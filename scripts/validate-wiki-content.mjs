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
  "lastReviewed",
  "subjects",
  "mainTopic",
  "subTopicPath",
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
const taxonomySubjects = new Set(taxonomy.subjects || []);
const taxonomyTags = new Set(taxonomy.topicTags || []);
const ids = new Set();
const definitionOwners = new Map();
const schoolContextAllowedDocIds = new Set(["school-violence", "school-meal"]);
const forcedSchoolContextPattern = /학교|학급|교실|등교|운동장|숙제|반 번호|선생님/;
const blockedQuizChoiceTexts = new Set([
  "출처를 확인하지 않아도 항상 맞는 정보라는 뜻입니다.",
  "한 가지 예만 알면 전체를 모두 설명할 수 있다는 뜻입니다.",
  "생활과 연결되지 않고 시험에서만 쓰이는 말입니다.",
  "정확한 기준이나 기간을 볼 필요가 없다는 뜻입니다.",
  "무조건 좋거나 나쁘다고 바로 판단하면 된다는 뜻입니다.",
  "개인의 느낌만으로 사실을 정하면 된다는 뜻입니다."
]);
const awkwardExplanationEnding = "설명" + "입니다";
const weakQuizChoicePhrases = [
  "화면에 많이 보이는 정보를 모두 사실로 인정",
  "확인 과정 없이 결과만 믿어도",
  "만든 목적이나 사용 조건을 살피지 않아도",
  "몸 상태나 안전 안내를 확인하지 않아도",
  "위험 신호가 보여도 평소처럼",
  "공식 안내와 도움 받을 곳을 확인하지 않아도",
  "상황에 따라 달라지는 기준이 없다는 뜻",
  "사람마다 상황이 달라도 같은 방법만 쓰면"
];
const weakQuizDistractorPhrases = [
  awkwardExplanationEnding,
  "확인하지 않아도",
  "살피지 않아도",
  "보지 않아도",
  "상황이 달라도",
  "한 가지 방법만",
  "무조건",
  "언제나",
  "항상"
];
const weakStructureHeadings = new Set([
  "쉽게 풀어보기",
  "생활 속 예시",
  "더 깊게 생각하기",
  "탐구와 연결하기",
  "경제 뉴스와 연결하기",
  "생활 안전과 연결하기",
  "환경과 생활 속에서 보기",
  "생각 넓히기",
  "다음 질문",
  "관찰할 수 있는 장면",
  "오해하기 쉬운 부분",
  "뉴스에서 볼 때",
  "생활 속 연결",
  "왜 중요할까?",
  "관찰할 때 보기",
  "사회와 역사에서 보이는 장면",
  "나에게 생길 수 있는 일",
  "학교에서의 행동",
  "체험학습에서 볼 것",
  "관람할 때",
  "자연과 생활에서 보이는 모습",
  "가격과 선택에서 보이는 모습",
  "학교와 생활에서 만나는 상황",
  "정보를 사용할 때 보이는 모습"
]);
const weakStructurePhrases = [
  "이 지식은 교과서 속 낱말로만 보지 말고",
  "처음에는 쉬운 뜻을 확인하고",
  "이 지식은 알고 끝나는 지식이 아니라 실제 상황에서 안전하게 행동하는 데 연결됩니다.",
  "이 지식은 관찰, 비교, 실험, 모형 같은 과학 탐구 방법과 연결해서 이해할 수 있습니다.",
  "이 지식은 생활비, 가격, 돈의 흐름처럼 실제 생활과 연결해서 보면 이해하기 쉽습니다."
];
const weakQuizExplanationPhrases = [
  "너무 단순합니다",
  "관련된 설명처럼 보이지만",
  "한 가지 예나 느낌만으로",
  "본문에서는",
  "라고 설명하므로",
  "이 지식은 알고 끝나는",
  "교과서 속 낱말",
  "이 문장은 이 지식을 실제 상황과 연결해 이해하게 해 줍니다"
];
const weakQuizQuestionPhrases = [
  "의 뜻을 가장 바르게 설명한 것은",
  "의 설명으로 맞는 것은",
  "에 대해 조심해야 할 점은"
];
const awkwardKoreanPhrases = [
  "AI(인공지능)을",
  "생성형 AI을"
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

function hasFinalConsonant(text) {
  const chars = [...String(text).trim()].filter(ch => /[가-힣]/.test(ch));
  if (!chars.length) return false;
  const code = chars[chars.length - 1].charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

function shouldUseTopicParticle(title) {
  if (/(^|\s)AI$/.test(title) || title.includes("AI(")) return "는";
  return hasFinalConsonant(title) ? "은" : "는";
}

function shouldUseObjectParticle(title) {
  if (/(^|\s)AI$/.test(title) || title.includes("AI(")) return "를";
  return hasFinalConsonant(title) ? "을" : "를";
}

function validateNoForcedSchoolContext(doc, label, values) {
  if (schoolContextAllowedDocIds.has(doc.id)) return;
  for (const value of values) {
    if (hasText(value) && forcedSchoolContextPattern.test(value)) {
      addError(doc.id, `${label} uses school context in a non-school knowledge: ${value}`);
    }
  }
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
  const correctChoices = [];
  const bodyCorpus = [
    doc.summary,
    doc.definition,
    ...(doc.chapters || []).flatMap(chapter => (chapter.sections || []).flatMap(section => section.body || []))
  ].filter(hasText).join("\n");
  doc.quiz.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      addError(doc.id, `quiz[${index}] must be an object`);
      return;
    }
    if (!hasText(item.question)) addError(doc.id, `quiz[${index}].question must be non-empty text`);
    if (hasText(item.question) && weakQuizQuestionPhrases.some(phrase => item.question.includes(phrase))) {
      addError(doc.id, `quiz[${index}].question is too vague`);
    }
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
          if (
            choiceIndex !== item.answerIndex &&
            weakQuizDistractorPhrases.some(phrase => normalizedChoice.includes(phrase))
          ) {
            addError(doc.id, `quiz[${index}].choices[${choiceIndex}] uses a too-obvious generic distractor`);
          }
          if (awkwardKoreanPhrases.some(phrase => normalizedChoice.includes(phrase))) {
            addError(doc.id, `quiz[${index}].choices[${choiceIndex}] uses an awkward Korean phrase`);
          }
          if (
            weakQuizChoicePhrases.some(phrase => normalizedChoice.includes(phrase)) &&
            choiceIndex === item.answerIndex
          ) {
            addError(doc.id, `quiz[${index}].choices[${choiceIndex}] uses a generic weak correct answer`);
          }
          const topicParticle = shouldUseTopicParticle(doc.title);
          const wrongTopicParticle = topicParticle === "은" ? "는" : "은";
          if (normalizedChoice.includes(`${doc.title}${wrongTopicParticle}`)) {
            addError(doc.id, `quiz[${index}].choices[${choiceIndex}] uses an incorrect topic particle after the title`);
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
    } else if (Array.isArray(item.choices) && hasText(item.choices[item.answerIndex])) {
      const correctChoice = item.choices[item.answerIndex].trim();
      if (correctChoices.includes(correctChoice)) {
        addError(doc.id, `quiz[${index}] repeats a previous correct answer`);
      }
      if (!bodyCorpus.includes(correctChoice)) {
        addError(doc.id, `quiz[${index}] correct answer must be present in the knowledge body or definition`);
      }
      correctChoices.push(correctChoice);
    }
    if (!hasText(item.explanation)) {
      addError(doc.id, `quiz[${index}].explanation must be non-empty text`);
    } else if (weakQuizExplanationPhrases.some(phrase => item.explanation.includes(phrase))) {
      addError(doc.id, `quiz[${index}].explanation uses a generic explanation phrase`);
    } else if (awkwardKoreanPhrases.some(phrase => item.explanation.includes(phrase))) {
      addError(doc.id, `quiz[${index}].explanation uses an awkward Korean phrase`);
    }
    if (hasText(item.question)) {
      const rightParticle = shouldUseObjectParticle(doc.title);
      const wrongParticle = rightParticle === "을" ? "를" : "을";
      if (item.question.includes(`'${doc.title}'${wrongParticle}`)) {
        addError(doc.id, `quiz[${index}].question uses an incorrect object particle after the title`);
      }
    }
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

    ["title", "summary", "definition", "lastReviewed", "copyrightNote"].forEach(field => {
      if (!hasText(doc[field])) addError(docId, `${field} must be non-empty text`);
    });
    if ("documentKind" in doc) addError(docId, "documentKind must not be used; use subjects and topicTags instead");
    if ("infobox" in doc) addError(docId, "infobox must not be used");
    if ("sections" in doc) addError(docId, "top-level sections must not be used; use chapters");
    if ("checkpoints" in doc) addError(docId, "checkpoints must not be used; use quiz");
    if ("quickQuiz" in doc) addError(docId, "quickQuiz must not be used; use quiz");

    validateArrayOfText(doc, "subjects");
    if (!hasText(doc.mainTopic)) addError(docId, "mainTopic must be non-empty text");
    validateArrayOfText(doc, "subTopicPath");
    validateArrayOfText(doc, "topicTags");
    validateArrayOfText(doc, "aliases");
    validateArrayOfText(doc, "keywords");
    validateArrayOfText(doc, "searchContexts");
    validateQuiz(doc);
    validateNoForcedSchoolContext(doc, "summary", [doc.summary]);
    validateNoForcedSchoolContext(doc, "definition", [doc.definition]);
    validateNoForcedSchoolContext(doc, "mainTopic", [doc.mainTopic]);
    validateNoForcedSchoolContext(doc, "subTopicPath", doc.subTopicPath || []);
    validateNoForcedSchoolContext(doc, "topicTags", doc.topicTags || []);
    validateNoForcedSchoolContext(doc, "aliases", doc.aliases || []);
    validateNoForcedSchoolContext(doc, "keywords", doc.keywords || []);
    validateNoForcedSchoolContext(doc, "searchContexts", doc.searchContexts || []);
    const paragraphTotal = (doc.chapters || [])
      .flatMap(chapter => chapter.sections || [])
      .flatMap(section => section.body || [])
      .filter(hasText).length;
    if (paragraphTotal < 10) addError(docId, "knowledge body must contain at least 10 body paragraphs");

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
        validateNoForcedSchoolContext(doc, `chapters[${chapterIndex}].title`, [chapter.title]);
        if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
          addError(docId, `chapters[${chapterIndex}].sections must contain at least 1 section`);
        } else {
          chapter.sections.forEach((section, sectionIndex) => {
            if (!hasText(section.heading)) addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].heading must be non-empty`);
            if (hasText(section.heading) && weakStructureHeadings.has(section.heading.trim())) {
              addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].heading is too generic: ${section.heading}`);
            }
            validateNoForcedSchoolContext(doc, `chapters[${chapterIndex}].sections[${sectionIndex}].heading`, [section.heading]);
            if (!Array.isArray(section.body) || section.body.length === 0) {
              addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body must contain text`);
            } else {
              if (section.body.length < 2) {
                addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body must contain at least 2 paragraphs`);
              }
              section.body.forEach((paragraph, paragraphIndex) => {
                if (!hasText(paragraph)) addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body[${paragraphIndex}] must be non-empty`);
                if (hasText(paragraph) && weakStructurePhrases.some(phrase => paragraph.includes(phrase))) {
                  addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body[${paragraphIndex}] uses a generic structure filler phrase`);
                }
                if (hasText(paragraph) && awkwardKoreanPhrases.some(phrase => paragraph.includes(phrase))) {
                  addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body[${paragraphIndex}] uses an awkward Korean phrase`);
                }
                validateNoForcedSchoolContext(doc, `chapters[${chapterIndex}].sections[${sectionIndex}].body[${paragraphIndex}]`, [paragraph]);
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
        if (hasText(source.usedFor) && hasText(source.title) && source.usedFor.trim() === source.title.trim()) {
          addError(docId, `sources[${sourceIndex}].usedFor must explain what was verified, not repeat the title`);
        }
        if (hasText(source.usedFor) && /^(자료|교육 자료|포털|날씨 Q&A|.*이란)$/.test(source.usedFor.trim())) {
          addError(docId, `sources[${sourceIndex}].usedFor is too vague`);
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
        if (hasText(source.license) && !/(사실 확인용|공공누리|Open Government Licence|공개자료).*(원문|직접).*(복제 없음|새로 작성|직접 복제 없음)/.test(source.license)) {
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
