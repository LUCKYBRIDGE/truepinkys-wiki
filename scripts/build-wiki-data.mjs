import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  generatedDir,
  generatedDocsDir,
  loadCurriculumMap,
  loadSourceDocs,
  loadTaxonomy
} from "./wiki-source.mjs";

const docs = await loadSourceDocs();
const taxonomy = await loadTaxonomy();
const curriculumMap = await loadCurriculumMap();

await rm(generatedDir, { recursive: true, force: true });
await mkdir(generatedDocsDir, { recursive: true });

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
    item.explanation,
    ...(item.choiceExplanations || [])
  ].join(" ")).join(" ");
}

function textFromTimeline(doc) {
  return (doc.timeline || []).map(item => [
    item.date,
    item.title,
    item.description
  ].join(" ")).join(" ");
}

function textFromFigures(doc) {
  return (doc.figures || []).map(item => [
    item.kind,
    item.title,
    item.caption,
    item.alt,
    item.sourceNote,
    item.dataSource?.title,
    item.dataSource?.license
  ].join(" ")).join(" ");
}

function textFromStoryNotes(doc) {
  return (doc.storyNotes || []).map(item => [
    item.title,
    item.type,
    item.reliability,
    ...(item.body || []),
    item.sourceNote
  ].join(" ")).join(" ");
}

function textFromTermNotations(doc) {
  return (doc.termNotations || []).map(item => [
    item.term,
    item.hanja,
    item.english
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
    abstract,
    termNotations,
    storyNotes
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
    termNotations,
    storyNotes,
    quizCount: (doc.quiz || []).length,
    timelineCount: (doc.timeline || []).length,
    figureCount: (doc.figures || []).length
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
      timeline: textFromTimeline(doc),
      figures: textFromFigures(doc),
      storyNotes: textFromStoryNotes(doc),
      termNotations: textFromTermNotations(doc),
      curriculum: curriculumLinks.map(item => [item.subject, item.area, item.achievementSupport].join(" ")).join(" "),
      grades: grades.flatMap(gradeAliases).join(" ")
    }
  };
});

await writeFile(path.join(generatedDir, "taxonomy.json"), JSON.stringify(taxonomy, null, 2) + "\n");
await writeFile(path.join(generatedDir, "curriculum-map.json"), JSON.stringify(curriculumMap, null, 2) + "\n");
await writeFile(path.join(generatedDir, "knowledge-index.json"), JSON.stringify(knowledgeIndex, null, 2) + "\n");
await writeFile(path.join(generatedDir, "quiz-index.json"), JSON.stringify(quizIndex, null, 2) + "\n");
await writeFile(path.join(generatedDir, "search-index.json"), JSON.stringify(searchIndex, null, 2) + "\n");

for (const doc of docs) {
  await writeFile(path.join(generatedDocsDir, `${doc.id}.json`), JSON.stringify(doc, null, 2) + "\n");
}

console.log(`Built ${docs.length} split wiki data files.`);
