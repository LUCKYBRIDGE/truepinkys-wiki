import fs from "node:fs";

const docs = JSON.parse(fs.readFileSync("data/documents.json", "utf8"));
const curriculumMap = JSON.parse(fs.readFileSync("data/curriculum-map.json", "utf8"));

const docIds = new Set(docs.map(doc => doc.id));
const linkEntries = Object.entries(curriculumMap.docLinks || {});
const errors = [];

if (!Array.isArray(curriculumMap.sources) || curriculumMap.sources.length === 0) {
  errors.push("curriculum-map.json must include at least one source.");
}

for (const source of curriculumMap.sources || []) {
  for (const field of ["publisher", "title", "url", "usedFor", "license", "checkedAt"]) {
    if (!source[field]) errors.push(`Curriculum source is missing ${field}.`);
  }
}

for (const doc of docs) {
  if (!Array.isArray(curriculumMap.docLinks?.[doc.id]) || curriculumMap.docLinks[doc.id].length === 0) {
    errors.push(`${doc.id} is missing curriculum links.`);
  }
  if (!Array.isArray(curriculumMap.gradeLinks?.[doc.id]) || curriculumMap.gradeLinks[doc.id].length === 0) {
    errors.push(`${doc.id} is missing grade links.`);
  }
}

for (const [docId, links] of linkEntries) {
  if (!docIds.has(docId)) errors.push(`${docId} does not match a knowledge id.`);
  if (!Array.isArray(links)) {
    errors.push(`${docId} curriculum links must be an array.`);
    continue;
  }
  for (const [index, link] of links.entries()) {
    for (const field of ["subject", "area", "achievementSupport"]) {
      if (!link[field]) errors.push(`${docId} link ${index + 1} is missing ${field}.`);
    }
    if (link.achievementSupport && /성취기준\s*\[/.test(link.achievementSupport)) {
      errors.push(`${docId} link ${index + 1} appears to copy an achievement standard code.`);
    }
  }
}

const allowedGrades = new Set(["초3", "초4", "초5", "초6", "중학교", "고등학교"]);
for (const [docId, grades] of Object.entries(curriculumMap.gradeLinks || {})) {
  if (!docIds.has(docId)) errors.push(`${docId} grade links do not match a knowledge id.`);
  if (!Array.isArray(grades)) {
    errors.push(`${docId} grade links must be an array.`);
    continue;
  }
  for (const grade of grades) {
    if (!allowedGrades.has(grade)) errors.push(`${docId} has unsupported grade link: ${grade}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Curriculum map validation passed for ${docs.length} knowledge entries.`);
