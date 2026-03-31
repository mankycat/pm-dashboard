'use server';

import {
  getDatabases,
  getPages,
  savePage,
  updatePage,
  createPageInDb,
  Page,
  PropertyValue,
  getDatabase,
  deletePage,
  updateDatabasePropertySchema,
  PropertySchema,
  saveDatabase,
  Database
} from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function fetchDatabases() {
  return await getDatabases();
}

export async function fetchPages(databaseId: string) {
  return await getPages(databaseId);
}

export async function createPage(databaseId: string, title: string, initialProperties?: PropertyValue, content?: string) {
  if (!title) return;

  const newPage: Page = {
    id: uuidv4(),
    databaseId,
    title,
    properties: initialProperties || {},
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await createPageInDb(newPage);
  revalidatePath('/');
}

export async function updatePageProperty(
  databaseId: string,
  pageId: string,
  propertyId: string,
  value: any
) {
  await updatePage(databaseId, pageId, (page) => {
    page.properties[propertyId] = value;
  });
  revalidatePath('/');
}

export async function updatePageTitle(databaseId: string, pageId: string, newTitle: string) {
  await updatePage(databaseId, pageId, (page) => {
    page.title = newTitle;
  });
  revalidatePath('/');
}

export async function updatePageContent(databaseId: string, pageId: string, content: string) {
  await updatePage(databaseId, pageId, (page) => {
    page.content = content;
  });
  revalidatePath('/');
}

export async function deletePageAction(databaseId: string, pageId: string) {
  await deletePage(databaseId, pageId);
  revalidatePath('/');
}

export async function updatePropertyOptionsAction(
  databaseId: string,
  propertyId: string,
  options: NonNullable<PropertySchema['options']>
) {
  await updateDatabasePropertySchema(databaseId, propertyId, (prop) => {
    prop.options = options;
  });
  revalidatePath('/');
}

export async function createDatabaseAction(name: string) {
  if (!name) return;
  const newDb: Database = {
    id: `db-${uuidv4().substring(0, 8)}`,
    name,
    schema: [
      {
        id: `prop-${uuidv4().substring(0, 8)}`,
        name: 'Status',
        type: 'status',
        options: [
          { id: 'opt-1', name: 'To Do', color: 'gray' },
          { id: 'opt-2', name: 'In Progress', color: 'blue' },
          { id: 'opt-3', name: 'Done', color: 'green' }
        ]
      },
      {
        id: `prop-${uuidv4().substring(0, 8)}`,
        name: 'Assignee',
        type: 'person'
      },
      {
        id: `prop-${uuidv4().substring(0, 8)}`,
        name: 'Due Date',
        type: 'date'
      }
    ] 
  };
  await saveDatabase(newDb);
  revalidatePath('/');
}
