import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const rootDir = process.cwd();
export const dataDir = path.join(rootDir, "data");
export const sourceDir = path.join(dataDir, "source");
export const sourceKnowledgeDir = path.join(sourceDir, "knowledge");
export const generatedDir = path.join(dataDir, "generated");
export const generatedDocsDir = path.join(generatedDir, "docs");

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function listJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJsonFiles(fullPath);
    if (entry.isFile() && entry.name.endsWith(".json")) return [fullPath];
    return [];
  }));
  return files.flat().sort();
}

export async function loadSourceDocs() {
  const files = await listJsonFiles(sourceKnowledgeDir);
  const docs = await Promise.all(files.map(readJson));
  const order = await loadKnowledgeOrder();
  return sortDocsByOrder(docs, order);
}

export function taxonomyPath() {
  return path.join(sourceDir, "taxonomy.json");
}

export function curriculumMapPath() {
  return path.join(sourceDir, "curriculum-map.json");
}

export function knowledgeOrderPath() {
  return path.join(sourceDir, "knowledge-order.json");
}

export async function loadKnowledgeOrder() {
  try {
    const order = await readJson(knowledgeOrderPath());
    return Array.isArray(order) ? order : [];
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}

export function sortDocsByOrder(docs, order) {
  const orderIndex = new Map(order.map((id, index) => [id, index]));
  return [...docs].sort((a, b) => {
    const aIndex = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return String(a.id).localeCompare(String(b.id));
  });
}

export async function loadTaxonomy() {
  return readJson(taxonomyPath());
}

export async function loadCurriculumMap() {
  return readJson(curriculumMapPath());
}
