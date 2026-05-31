import { readFile } from "node:fs/promises";
import path from "node:path";
import { generatedDir } from "./wiki-source.mjs";

const SEARCH_FIELDS = [
  { id: "title", weight: 5.0, tiers: { exact: 100, phrase: 95, token: 76 } },
  { id: "aliases", weight: 4.2, tiers: { exact: 92, phrase: 88, token: 72 } },
  { id: "definition", weight: 3.7, tiers: { exact: 86, phrase: 82, token: 65 } },
  { id: "summary", weight: 2.8, tiers: { exact: 80, phrase: 77, token: 62 } },
  { id: "abstract", weight: 2.5, tiers: { exact: 78, phrase: 74, token: 60 } },
  { id: "chapters", weight: 1.5, tiers: { exact: 76, phrase: 72, token: 56 } },
  { id: "storyNotes", weight: 1.6, tiers: { exact: 75, phrase: 71, token: 55 } },
  { id: "timeline", weight: 1.9, tiers: { exact: 73, phrase: 69, token: 54 } },
  { id: "searchContexts", weight: 2.0, tiers: { exact: 69, phrase: 66, token: 55 } },
  { id: "grades", weight: 3.4, tiers: { exact: 67, phrase: 64, token: 45 } },
  { id: "curriculum", weight: 2.8, tiers: { exact: 60, phrase: 56, token: 42 } },
  { id: "subjects", weight: 2.8, tiers: { exact: 58, phrase: 54, token: 40 } },
  { id: "categoryPaths", weight: 2.7, tiers: { exact: 56, phrase: 52, token: 38 } },
  { id: "mainTopic", weight: 2.5, tiers: { exact: 55, phrase: 51, token: 37 } },
  { id: "subTopicPath", weight: 2.4, tiers: { exact: 54, phrase: 50, token: 36 } },
  { id: "topicTags", weight: 2.4, tiers: { exact: 53, phrase: 49, token: 35 } },
  { id: "keywords", weight: 2.6, tiers: { exact: 74, phrase: 70, token: 57 } },
  { id: "figures", weight: 1.3, tiers: { exact: 66, phrase: 62, token: 48 } }
];

const SEARCH_INTENT_RULES = [
  { test: /전기.*흐르|흐르.*전기|전류.*길|불이.*켜지/, terms: ["전기 회로", "전류", "닫힌 회로", "전구"] },
  { test: /계절.*왜|왜.*계절|계절.*바뀌|여름.*겨울|봄.*가을/, terms: ["계절의 변화", "계절의 변화가 생기는 까닭", "지구의 공전", "자전축"] },
  { test: /비.*왜|왜.*비|비.*오|구름.*비/, terms: ["구름과 비", "물의 순환", "이슬 안개 구름", "수증기"] },
  { test: /바람.*왜|왜.*바람|바람.*부/, terms: ["바람이 부는 까닭", "기압", "공기 이동"] },
  { test: /돈.*빌|빌린.*돈|이자|금리.*왜/, terms: ["금리", "이자", "중앙은행", "대출"] },
  { test: /물가.*오르|돈.*값|가격.*오르|생활비.*오르/, terms: ["인플레이션", "물가", "화폐 가치", "시장 가격"] },
  { test: /물가.*내리|가격.*내리|경기.*나빠/, terms: ["디플레이션", "물가", "경기", "소비"] },
  { test: /나라.*세운|건국|왕.*세운|시조/, terms: ["건국", "시조", "왕", "나라의 성립"] },
  { test: /독립.*운동|일제.*저항|광복.*전/, terms: ["독립운동", "일제강점기", "대한민국 임시정부", "광복"] },
  { test: /법.*단계|헌법.*법률|법률.*명령/, terms: ["헌법 법률 명령", "법의 단계", "헌법", "법률", "명령"] },
  { test: /지도.*위치|위치.*찾|위도|경도/, terms: ["위도와 경도", "지도", "지구본", "위성지도"] },
  { test: /날씨.*기후|기후.*날씨|오래.*날씨/, terms: ["날씨와 기후", "기후", "날씨", "기후대"] }
];

const CASES = [
  { query: "세종대왕", expected: ["king-sejong"], top: 1 },
  { query: "광개토대왕", expected: ["gwanggaeto-the-great"], top: 1 },
  { query: "훈민정음", expected: ["hunminjeongeum", "king-sejong"], top: 3 },
  { query: "전기 흐르는 길", expected: ["electric-circuit", "electric-current-switch"], top: 5 },
  { query: "왜 계절이 바뀌나요", expected: ["cause-of-seasons", "seasons", "earth-rotation-revolution"], top: 5 },
  { query: "비가 오는 이유", expected: ["clouds-rain", "water-cycle", "dew-fog-cloud"], top: 5 },
  { query: "돈을 빌릴 때 붙는 것", expected: ["interest-rate", "central-bank"], top: 5 },
  { query: "물가가 오르는 현상", expected: ["inflation"], top: 3 },
  { query: "헌법 법률 명령", expected: ["law-hierarchy"], top: 1 },
  { query: "독립운동가", expected: ["independence-movement", "yu-gwan-sun", "kim-gu", "an-jung-geun", "hong-beom-do", "kim-jwa-jin"], top: 8 },
  { query: "5학년 역사", expectedTopic: "역사", top: 8 }
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function normalizeLoose(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(query) {
  return normalizeLoose(query)
    .split(/[\s,./?~!@#$%^&*()_+=|;:'"<>[\]{}-]+/g)
    .map(normalize)
    .filter(Boolean);
}

function uniqueNormalized(values) {
  const seen = new Set();
  return values.filter(value => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function searchProfile(query) {
  const loose = normalizeLoose(query);
  const rawDirectTokens = tokenize(query);
  const directTokens = rawDirectTokens.filter(token => token.length > 1 || rawDirectTokens.length === 1);
  const intentTerms = SEARCH_INTENT_RULES.filter(rule => rule.test.test(loose)).flatMap(rule => rule.terms);
  const intentTokens = intentTerms.flatMap(tokenize);
  return {
    normalizedQuery: normalize(query),
    directTokens: uniqueNormalized(directTokens),
    intentTokens: uniqueNormalized(intentTokens),
    allTokens: uniqueNormalized([...directTokens, ...intentTokens]),
    phraseVariants: uniqueNormalized([query, ...intentTerms])
  };
}

function countOccurrences(target, term) {
  const text = normalize(target);
  const needle = normalize(term);
  if (!text || !needle) return 0;
  let count = 0;
  let index = text.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(needle, index + Math.max(needle.length, 1));
  }
  return count;
}

function categoryPathTexts(doc) {
  return (doc.categoryPaths || []).map(item => item.join(" "));
}

function fieldText(doc, fieldId) {
  if (fieldId === "categoryPaths") return categoryPathTexts(doc).join(" ");
  if (fieldId === "chapters") return doc.searchFields?.chapters || "";
  if (fieldId === "quiz") return doc.searchFields?.quiz || "";
  if (fieldId === "storyNotes") return doc.searchFields?.storyNotes || "";
  if (fieldId === "timeline") return doc.searchFields?.timeline || "";
  if (fieldId === "curriculum") return doc.searchFields?.curriculum || "";
  if (fieldId === "grades") return doc.searchFields?.grades || "";
  if (fieldId === "figures") return doc.searchFields?.figures || "";
  const value = doc[fieldId];
  return Array.isArray(value) ? value.join(" ") : String(value || "");
}

function fieldValues(doc, fieldId) {
  if (fieldId === "categoryPaths") return categoryPathTexts(doc);
  if (["chapters", "quiz", "storyNotes", "timeline", "curriculum", "grades", "figures"].includes(fieldId)) return [fieldText(doc, fieldId)];
  const value = doc[fieldId];
  return Array.isArray(value) ? value : [value];
}

function scoreField(doc, profile, field) {
  const text = fieldText(doc, field.id);
  const normalizedText = normalize(text);
  const normalizedValues = fieldValues(doc, field.id).map(normalize).filter(Boolean);
  const directMatches = profile.directTokens.filter(token => normalizedText.includes(token));
  const intentMatches = profile.intentTokens.filter(token => normalizedText.includes(token));
  const phraseCount = profile.phraseVariants.reduce((sum, phrase) => sum + countOccurrences(text, phrase), 0);
  const hasExactValue = profile.normalizedQuery && normalizedValues.some(value => value === profile.normalizedQuery);
  const hasPhrase = profile.normalizedQuery && normalizedText.includes(profile.normalizedQuery);
  const hasIntentPhrase = profile.phraseVariants.map(normalize).filter(phrase => phrase && phrase !== profile.normalizedQuery).some(phrase => normalizedText.includes(phrase));

  let accuracy = 0;
  let bestTier = 0;
  if (hasExactValue) {
    accuracy += 170;
    bestTier = Math.max(bestTier, field.tiers.exact);
  } else if (hasPhrase) {
    accuracy += 130;
    bestTier = Math.max(bestTier, field.tiers.phrase);
  } else if (hasIntentPhrase) {
    accuracy += 96;
    bestTier = Math.max(bestTier, Math.max(field.tiers.phrase - 8, field.tiers.token));
  }
  if (profile.directTokens.length) {
    const coverage = directMatches.length / profile.directTokens.length;
    accuracy += coverage * 76;
    if (directMatches.length === profile.directTokens.length && profile.directTokens.length > 1) accuracy += 30;
    if (directMatches.length) bestTier = Math.max(bestTier, field.tiers.token);
  }
  if (profile.intentTokens.length) {
    const coverage = intentMatches.length / profile.intentTokens.length;
    accuracy += coverage * 35;
    if (intentMatches.length) bestTier = Math.max(bestTier, Math.max(field.tiers.token - 6, 1));
  }

  let frequency = phraseCount * 12;
  for (const token of profile.allTokens) frequency += countOccurrences(text, token) * 3;
  frequency = Math.min(frequency, 60);
  return {
    score: (accuracy + frequency) * field.weight,
    bestTier,
    phraseCount,
    tokenCount: directMatches.length + intentMatches.length,
    matchedTokens: uniqueNormalized([...directMatches, ...intentMatches])
  };
}

function scoreDocument(doc, query) {
  const profile = searchProfile(query);
  const fieldScores = SEARCH_FIELDS.map(field => scoreField(doc, profile, field)).filter(result => result.score > 0);
  const matchedTokens = new Set(fieldScores.flatMap(item => item.matchedTokens || []));
  return {
    doc,
    total: fieldScores.reduce((sum, item) => sum + item.score, 0),
    bestTier: fieldScores.reduce((max, item) => Math.max(max, item.bestTier), 0),
    frequencyTotal: fieldScores.reduce((sum, item) => sum + item.phraseCount + item.tokenCount, 0),
    hasPhraseMatch: fieldScores.some(item => item.phraseCount > 0),
    matchedTokenCount: matchedTokens.size,
    directTokenCount: profile.directTokens.length
  };
}

function isSearchCandidate(result) {
  if (result.directTokenCount <= 1) return true;
  if (result.hasPhraseMatch) return true;
  if (result.matchedTokenCount >= 2) return true;
  return result.bestTier >= 80;
}

function searchDocs(docs, query) {
  return docs
    .map(doc => scoreDocument(doc, query))
    .filter(result => result.total > 0 && isSearchCandidate(result))
    .sort((a, b) => b.bestTier - a.bestTier || b.total - a.total || b.frequencyTotal - a.frequencyTotal || a.doc.title.localeCompare(b.doc.title, "ko"));
}

async function readJson(fileName) {
  return JSON.parse(await readFile(path.join(generatedDir, fileName), "utf8"));
}

const docs = await readJson("knowledge-index.json");
const searchIndex = await readJson("search-index.json");
const searchFieldsById = new Map(searchIndex.map(entry => [entry.id, entry.searchFields || {}]));
const indexedDocs = docs.map(doc => ({ ...doc, searchFields: searchFieldsById.get(doc.id) || {} }));

const failures = [];
for (const testCase of CASES) {
  const topResults = searchDocs(indexedDocs, testCase.query).slice(0, testCase.top);
  const topIds = topResults.map(result => result.doc.id);
  const matchedId = testCase.expected?.some(id => topIds.includes(id));
  const matchedTopic = testCase.expectedTopic && topResults.some(result => result.doc.mainTopic === testCase.expectedTopic || (result.doc.subTopicPath || []).includes(testCase.expectedTopic));
  if (!matchedId && !matchedTopic) {
    failures.push(`${testCase.query}: expected ${testCase.expected?.join(", ") || testCase.expectedTopic} in top ${testCase.top}, got ${topIds.join(", ")}`);
  }
}

if (failures.length) {
  console.error("Search quality validation failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Search quality validation passed: ${CASES.length} representative queries checked.`);
