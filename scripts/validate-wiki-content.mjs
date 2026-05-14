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
    validateArrayOfText(doc, "quiz");

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
        if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
          addError(docId, `chapters[${chapterIndex}].sections must contain at least 1 section`);
        } else {
          chapter.sections.forEach((section, sectionIndex) => {
            if (!hasText(section.heading)) addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].heading must be non-empty`);
            if (!Array.isArray(section.body) || section.body.length === 0) {
              addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body must contain text`);
            } else {
              section.body.forEach((paragraph, paragraphIndex) => {
                if (!hasText(paragraph)) addError(docId, `chapters[${chapterIndex}].sections[${sectionIndex}].body[${paragraphIndex}] must be non-empty`);
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
