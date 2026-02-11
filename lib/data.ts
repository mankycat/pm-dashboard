import fs from 'fs/promises';
import path from 'path';

// --- Types ---

export type PropertyType = 'text' | 'number' | 'select' | 'multi-select' | 'status' | 'date' | 'person' | 'checkbox';

export interface PropertySchema {
  id: string;
  name: string;
  type: PropertyType;
  options?: {
    id: string;
    name: string;
    color?: string;
  }[];
}

export interface Database {
  id: string;
  name: string;
  description?: string;
  schema: PropertySchema[];
}

export interface PropertyValue {
  [propertyId: string]: any;
}

export interface Page {
  id: string;
  databaseId: string;
  title: string;
  properties: PropertyValue;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Paths ---

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'databases.json');
const PAGES_DIR = path.join(DATA_DIR, 'pages');

// --- Helpers ---

async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function readJson<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    return defaultValue;
  }
}

async function writeJson(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// --- Concurrency Control ---

let writeLock = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const currentLock = writeLock;
  let release: () => void;
  const newLock = new Promise<void>(resolve => { release = resolve; });
  // Append new lock to the chain, but don't await the *new* lock, await the *current* one before running fn
  writeLock = writeLock.then(() => newLock);

  await currentLock;
  try {
    return await fn();
  } finally {
    release!();
  }
}

// --- Database Operations ---

export async function getDatabases(): Promise<Database[]> {
  return await readJson<Database[]>(DB_FILE, []);
}

export async function getDatabase(id: string): Promise<Database | undefined> {
  const dbs = await getDatabases();
  return dbs.find(db => db.id === id);
}

export async function saveDatabase(database: Database) {
  await withLock(async () => {
    const dbs = await getDatabases();
    const index = dbs.findIndex(db => db.id === database.id);
    if (index >= 0) {
      dbs[index] = database;
    } else {
      dbs.push(database);
    }
    await writeJson(DB_FILE, dbs);
  });
}

// --- Page Operations ---

function getPageFilePath(databaseId: string) {
  return path.join(PAGES_DIR, `${databaseId}.json`);
}

export async function getPages(databaseId: string): Promise<Page[]> {
  await ensureDir(PAGES_DIR);
  return await readJson<Page[]>(getPageFilePath(databaseId), []);
}

/**
 * atomic update of a page to prevent race conditions
 */
export async function updatePage(
  databaseId: string,
  pageId: string,
  updater: (page: Page) => void
) {
  await withLock(async () => {
    await ensureDir(PAGES_DIR);
    const filePath = getPageFilePath(databaseId);
    const pages = await readJson<Page[]>(filePath, []);

    const page = pages.find(p => p.id === pageId);
    if (page) {
      updater(page); // Mutate in place
      page.updatedAt = new Date().toISOString();
      await writeJson(filePath, pages);
    }
  });
}

export async function createPageInDb(page: Page) {
  await withLock(async () => {
    await ensureDir(PAGES_DIR);
    const filePath = getPageFilePath(page.databaseId);
    const pages = await readJson<Page[]>(filePath, []);
    pages.push(page);
    await writeJson(filePath, pages);
  });
}

export async function savePage(page: Page) {
  // Use updatePage logic to be safe, or just lock here if we are replacing whole object
  // But savePage as typically used by overwrite might be risky if we don't read first.
  // Let's deprecate savePage for updatePage usage, OR handle logic here.
  await updatePage(page.databaseId, page.id, (p) => {
    Object.assign(p, page);
  });
}

export async function deletePage(databaseId: string, pageId: string) {
  await withLock(async () => {
    const filePath = getPageFilePath(databaseId);
    const pages = await readJson<Page[]>(filePath, []);
    const filtered = pages.filter(p => p.id !== pageId);
    await writeJson(filePath, filtered);
  });
}
