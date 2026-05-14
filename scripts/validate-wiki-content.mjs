import fs from "node:fs";

const documentsPath = "data/documents.json";
const taxonomyPath = "data/taxonomy.json";

const docs = JSON.parse(fs.readFileSync(documentsPath, "utf8"));
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
const errors = [];

const sourceObjectFields = ["publisher", "title", "url", "usedFor", "license", "checkedAt"];
const requiredDocFields = [
  "id",
  "title",
  "summary",
  "definition",
  "documentKind",
  "lastReviewed",
  "subjects",
  "topicTags",
  "aliases",
  "keywords",
  "searchContexts",
  "chapters",
  "quiz",
  "related",
  "sources",
  "copyrightNote"
];
const blockedSourceHosts = [
  "namu.wiki",
  "wikipedia.org",
  "blog.naver.com",
  "tistory.com",
  "reddit.com",
  "dcinside.com",
  "fandom.com",
  "youtube.com",
  "instagram.com",
  "facebook.com",
  "theqoo.net"
];
const allowedDocumentKinds = new Set(taxonomy.documentKinds || []);

const taxonomySubjects = new Set(taxonomy.subjects || []);
const taxonomyTags = new Set(taxonomy.topicTags || []);
const ids = new Set();
const definitionOwners = new Map();
const blockedQuizChoiceTexts = new Set([
  "출처를 확인하지 않아도 항상 맞는 정보라는 뜻입니다.",
  "한 가지 예만 알면 전체를 모두 설명할 수 있다는 뜻입니다.",
  "생활과 연결되지 않고 시험에서만 쓰이는 말입니다.",
  "정확한 기준이나 기간을 볼 필요가 없다는 뜻입니다.",
  "무조건 좋거나 나쁘다고 바로 판단하면 된다는 뜻입니다.",
  "개인의 느낌만으로 사실을 정하면 된다는 뜻입니다."
]);
const weakStructureHeadings = new Set([
  "쉽게 풀어보기",
  "생활 속 예시",
  "더 깊게 생각하기",
  "탐구와 연결하기",
  "경제 뉴스와 연결하기",
  "생활 안전과 연결하기",
  "환경과 생활 속에서 보기",
  "생각 넓히기"
]);
const weakStructurePhrases = [
  "이 지식은 교과서 속 낱말로만 보지 말고",
  "처음에는 쉬운 뜻을 확인하고",
  "이 지식은 알고 끝나는 지식이 아니라 실제 상황에서 안전하게 행동하는 데 연결됩니다.",
  "이 지식은 관찰, 비교, 실험, 모형 같은 과학 탐구 방법과 연결해서 이해할 수 있습니다.",
  "이 지식은 생활비, 가격, 돈의 흐름처럼 실제 생활과 연결해서 보면 이해하기 쉽습니다."
];

if (Array.isArray(docs)) {
  for (const doc of docs) {
    if (hasText(doc.definition)) definitionOwners.set(doc.definition.trim(), doc.id);
  }
}

function addError(docId, message) {
  errors.push(`${docId}: ${message}`);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateArrayOfText(doc, field, minLength = 1) {
  if (!Array.isArray(doc[field]) || doc[field].length < minLength) {
    addError(doc.id || "(missing id)", `${field} must be an array with at least ${minLength} item(s)`);
    return;
  }
  doc[field].forEach((item, index) => {
    if (!hasText(item)) addError(doc.id, `${field}[${index}] must be non-empty text`);
  });
}

function validateQuiz(doc) {
  if (!Array.isArray(doc.quiz) || doc.quiz.length < 1) {
    addError(doc.id || "(missing id)", "quiz must contain at least 1 question");
    return;
  }
  doc.quiz.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      addError(doc.id, `quiz[${index}] must be an object`);
      return;
    }
    if (!hasText(item.question)) addError(doc.id, `quiz[${index}].question must be non-empty text`);
    if (!Array.isArray(item.choices) || item.choices.length !== 4) {
      addError(doc.id, `quiz[${index}].choices must contain exactly 4 choices`);
    } else {
      const choiceSet = new Set();
      item.choices.forEach((choice, choiceIndex) => {
        if (!hasText(choice)) addError(doc.id, `quiz[${index}].choices[${choiceIndex}] must be non-empty text`);
        if (hasText(choice)) {
          const normalizedChoice = choice.trim();
          if (choiceSet.has(normalizedChoice)) {
            addError(doc.id, `quiz[${index}].choices[${choiceIndex}] duplicates another choice`);
          }
          choiceSet.add(normalizedChoice);
          if (blockedQuizChoiceTexts.has(normalizedChoice)) {
            addError(doc.id, `quiz[${index}].choices[${choiceIndex}] uses a generic filler distractor`);
          }
          const definitionOwner = definitionOwners.get(normalizedChoice);
          if (definitionOwner && definitionOwner !== doc.id) {
            addError(doc.id, `quiz[${index}].choices[${choiceIndex}] copies another knowledge definition (${definitionOwner})`);
          }
        }
      });
    }
    if (!Number.isInteger(item.answerIndex) || item.answerIndex < 0 || item.answerIndex > 3) {
      addError(doc.id, `quiz[${index}].answerIndex must be an integer from 0 to 3`);
    }
    if (!hasText(item.explanation)) addError(doc.id, `quiz[${index}].explanation must be non-empty text`);
  });
}

if (!Array.isArray(docs)) {
  errors.push("data/documents.json must contain a top-level array");
} else {
  for (const doc of docs) {
    const docId = doc.id || "(missing id)";

    for (const field of requiredDocFields) {
      if (!(field in doc)) addError(docId, `missing required field ${field}`);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(docId)) {
      addError(docId, "id must use lowercase kebab-case");
    }
    if (ids.has(docId)) addError(docId, "duplicate id");
    ids.add(docId);

    ["title", "summary", "definition", "documentKind", "lastReviewed", "copyrightNote"].forEach(field => {
      if (!hasText(doc[field])) addError(docId, `${field} must be non-empty text`);
    });
    if (hasText(doc.documentKind)) {
      if (doc.documentKind.includes("문서")) addError(docId, "documentKind must use 지식, not 문서");
      if (allowedDocumentKinds.size && !allowedDocumentKinds.has(doc.documentKind)) {
        addError(docId, `documentKind "${doc.documentKind}" is not listed in taxonomy.documentKinds`);
      }
    }
    if ("infobox" in doc) addError(docId, "infobox must not be used");
    if ("sections" in doc) addError(docId, "top-level sections must not be used; use chapters");
    if ("checkpoints" in doc) addError(docId, "checkpoints must not be used; use quiz");
    if ("quickQuiz" in doc) addError(docId, "quickQuiz must not be used; use quiz");

    validateArrayOfText(doc, "subjects");
    validateArrayOfText(doc, "topicTags");
    validateArrayOfText(doc, "aliases");
    validateArrayOfText(doc, "keywords");
    validateArrayOfText(doc, "searchContexts");
    validateQuiz(doc);

    for (const subject of doc.subjects || []) {
      if (!taxonomySubjects.has(subject)) addError(docId, `unknown subject "${subject}"`);
    }
    for (const tag of doc.topicTags || []) {
      if (!taxonomyTags.has(tag)) addError(docId, `unknown topic tag "${tag}"`);
    }

    if (!Array.isArray(doc.chapters) || doc.chapters.length < 1) {
      addError(docId, "chapters must contain at least 1 chapter");
    } else {
      doc.chapters.forEach((chapter, chapterIndex) => {
        if (!hasText(chapter.title)) addError(docId, `chapters[${chapterIndex}].title must be non-empty`);
        if (hasText(chapter.title) && weakStructureHeadings.has(chapter.title.trim())) {
          addError(docId, `chapters[${chapterIndex}].title is too generic: ${chapter.title}`);
        }
        if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
          addError(docId, `chapters[${chapterIndex}].sections must contain at least 1 section`);
        } else {
          chapter.sections.forEach((section, sectionIndex) => {
            if (!hasText(section.heading)) addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].heading must be non-empty`);
            if (hasText(section.heading) && weakStructureHeadings.has(section.heading.trim())) {
              addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].heading is too generic: ${section.heading}`);
            }
            if (!Array.isArray(section.body) || section.body.length === 0) {
              addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body must contain text`);
            } else {
              section.body.forEach((paragraph, paragraphIndex) => {
                if (!hasText(paragraph)) addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body[${paragraphIndex}] must be non-empty`);
                if (hasText(paragraph) && weakStructurePhrases.some(phrase => paragraph.includes(phrase))) {
                  addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body[${paragraphIndex}] uses a generic structure filler phrase`);
                }
              });
            }
          });
        }
      });
    }

    if (!Array.isArray(doc.related)) {
      addError(docId, "related must be an array");
    }

    if (!Array.isArray(doc.sources) || doc.sources.length === 0) {
      addError(docId, "sources must contain at least one source object");
    } else {
      doc.sources.forEach((source, sourceIndex) => {
        if (!source || typeof source !== "object" || Array.isArray(source)) {
          addError(docId, `sources[${sourceIndex}] must be a structured source object`);
          return;
        }
        for (const field of sourceObjectFields) {
          if (!hasText(source[field])) addError(docId, `sources[${sourceIndex}].${field} must be non-empty text`);
        }
        if (hasText(source.url)) {
          try {
            const host = new URL(source.url).hostname.replace(/^www\\./, "");
            if (blockedSourceHosts.some(blocked => host === blocked || host.endsWith(`.${blocked}`))) {
              addError(docId, `sources[${sourceIndex}] uses blocked source host ${host}`);
            }
          } catch {
            addError(docId, `sources[${sourceIndex}].url must be a valid URL`);
          }
        }
        if (hasText(source.license) && !/(원문|직접).*(복제 없음|새로 작성|직접 복제 없음)/.test(source.license)) {
          addError(docId, `sources[${sourceIndex}].license must state no source copying`);
        }
      });
    }

    if (hasText(doc.copyrightNote) && !/(원문|문단).*(복제하지 않았|복제 없음)/.test(doc.copyrightNote)) {
      addError(docId, "copyrightNote must state that source text/assets were not copied");
    }
    if (hasText(doc.copyrightNote) && doc.copyrightNote.startsWith("이 문서는")) {
      addError(docId, "copyrightNote must use 이 지식은");
    }
  }

  for (const doc of docs) {
    for (const relatedId of doc.related || []) {
      if (!ids.has(relatedId)) addError(doc.id, `related id "${relatedId}" does not exist`);
    }
  }
}

if (errors.length) {
  console.error("Wiki content validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Wiki content validation passed: ${docs.length} knowledge entries checked.`);
