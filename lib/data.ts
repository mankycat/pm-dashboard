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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface ActivityLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'batch_delete';
  entityType: string;
  entityTitle: string;
  details?: string;
  timestamp: string;
}

// --- Paths ---

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'databases.json');
const PAGES_DIR = path.join(DATA_DIR, 'pages');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');

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
  } catch {
    return defaultValue;
  }
}

async function writeActivityLogInline(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
  const logs = await readJson<ActivityLog[]>(LOGS_FILE, []);
  logs.unshift({
    ...log,
    id: Math.random().toString(36).substring(2, 11),
    timestamp: new Date().toISOString()
  });
  if (logs.length > 50) logs.length = 50;
  await writeJson(LOGS_FILE, logs);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      await writeActivityLogInline({
        action: 'create',
        entityType: 'Database',
        entityTitle: database.name
      });
    }
    await writeJson(DB_FILE, dbs);
  });
}

export async function updateDatabasePropertySchema(
  databaseId: string,
  propertyId: string,
  updater: (prop: PropertySchema) => void
) {
  await withLock(async () => {
    const dbs = await getDatabases();
    const dbIndex = dbs.findIndex(db => db.id === databaseId);
    if (dbIndex === -1) return;
    
    const propIndex = dbs[dbIndex].schema.findIndex(p => p.id === propertyId);
    if (propIndex === -1) return;
    
    updater(dbs[dbIndex].schema[propIndex]);
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
  updater: (page: Page) => void,
  logDetails?: string
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

      const dbs = await readJson<Database[]>(DB_FILE, []);
      const db = dbs.find(d => d.id === databaseId);

      await writeActivityLogInline({
        action: 'update',
        entityType: db?.name || 'Item',
        entityTitle: page.title || 'Untitled',
        details: logDetails
      });
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

    const dbs = await readJson<Database[]>(DB_FILE, []);
    const db = dbs.find(d => d.id === page.databaseId);

    await writeActivityLogInline({
      action: 'create',
      entityType: db?.name || 'Item',
      entityTitle: page.title || 'Untitled'
    });
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
    const pageToDelete = pages.find(p => p.id === pageId);
    
    if (pageToDelete) {
        const filtered = pages.filter(p => p.id !== pageId);
        await writeJson(filePath, filtered);

        const dbs = await readJson<Database[]>(DB_FILE, []);
        const db = dbs.find(d => d.id === databaseId);

        await writeActivityLogInline({
            action: 'delete',
            entityType: db?.name || 'Item',
            entityTitle: pageToDelete.title || 'Untitled'
        });
    }
  });
}

export async function deletePages(databaseId: string, pageIds: string[]) {
  await withLock(async () => {
    const filePath = getPageFilePath(databaseId);
    const pages = await readJson<Page[]>(filePath, []);
    
    const count = pages.filter(p => pageIds.includes(p.id)).length;
    if (count > 0) {
        const filtered = pages.filter(p => !pageIds.includes(p.id));
        await writeJson(filePath, filtered);

        const dbs = await readJson<Database[]>(DB_FILE, []);
        const db = dbs.find(d => d.id === databaseId);

        await writeActivityLogInline({
            action: 'batch_delete',
            entityType: db?.name || 'Item',
            entityTitle: `Selected ${db?.name || 'Items'}`,
            details: `Deleted ${count} items`
        });
    }
  });
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
   return await readJson<ActivityLog[]>(LOGS_FILE, []);
}
