import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const dataDir = path.join(rootDir, "data");
const docsDir = path.join(dataDir, "docs");
const sourcePath = path.join(dataDir, "documents.json");
const curriculumPath = path.join(dataDir, "curriculum-map.json");

const docs = JSON.parse(await readFile(sourcePath, "utf8"));
const curriculumMap = JSON.parse(await readFile(curriculumPath, "utf8"));

await mkdir(docsDir, { recursive: true });

function textFromChapters(doc) {
  return (doc.chapters || []).map(chapter => [
    chapter.title,
    ...(chapter.sections || []).map(section => [section.heading, ...(section.body || [])].join(" "))
  ].join(" ")).join(" ");
}

function textFromQuiz(doc) {
  return (doc.quiz || []).map(item => [
    item.question,
    ...(item.choices || []),
    item.explanation
  ].join(" ")).join(" ");
}

function gradeAliases(grade) {
  const value = String(grade || "");
  if (value.startsWith("초")) {
    const number = value.replace("초", "");
    return [
      value,
      `초${number}`,
      `초등${number}`,
      `초등 ${number}`,
      `초등학교 ${number}학년`,
      `${number}학년`,
      `${number} 학년`
    ];
  }
  if (value === "중학교") return ["중학교", "중학생", "중등", "중학"];
  if (value === "고등학교") return ["고등학교", "고등학생", "고등"];
  return [value];
}

function indexDoc(doc) {
  const {
    id,
    title,
    summary,
    definition,
    subjects,
    topicTags,
    aliases,
    keywords,
    searchContexts,
    related,
    lastReviewed,
    mainTopic,
    subTopicPath,
    categoryPaths,
    abstract
  } = doc;
  return {
    id,
    title,
    summary,
    definition,
    subjects,
    topicTags,
    aliases,
    keywords,
    searchContexts,
    related,
    lastReviewed,
    mainTopic,
    subTopicPath,
    categoryPaths,
    abstract,
    quizCount: (doc.quiz || []).length
  };
}

const knowledgeIndex = docs.map(indexDoc);
const quizIndex = docs.map(doc => ({
  id: doc.id,
  title: doc.title,
  summary: doc.summary,
  definition: doc.definition,
  subjects: doc.subjects,
  topicTags: doc.topicTags,
  related: doc.related,
  mainTopic: doc.mainTopic,
  subTopicPath: doc.subTopicPath,
  categoryPaths: doc.categoryPaths,
  quiz: doc.quiz || []
}));
const searchIndex = docs.map(doc => {
  const curriculumLinks = (curriculumMap.docLinks && curriculumMap.docLinks[doc.id]) || [];
  const grades = (curriculumMap.gradeLinks && curriculumMap.gradeLinks[doc.id]) || [];
  return {
    id: doc.id,
    searchFields: {
      chapters: textFromChapters(doc),
      quiz: textFromQuiz(doc),
      curriculum: curriculumLinks.map(item => [item.subject, item.area, item.achievementSupport].join(" ")).join(" "),
      grades: grades.flatMap(gradeAliases).join(" ")
    }
  };
});

await writeFile(path.join(dataDir, "knowledge-index.json"), JSON.stringify(knowledgeIndex, null, 2) + "\n");
await writeFile(path.join(dataDir, "quiz-index.json"), JSON.stringify(quizIndex, null, 2) + "\n");
await writeFile(path.join(dataDir, "search-index.json"), JSON.stringify(searchIndex, null, 2) + "\n");

for (const doc of docs) {
  await writeFile(path.join(docsDir, `${doc.id}.json`), JSON.stringify(doc, null, 2) + "\n");
}

console.log(`Built ${docs.length} split wiki data files.`);
