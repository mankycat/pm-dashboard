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
  deletePage
} from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function fetchDatabases() {
  return await getDatabases();
}

export async function fetchPages(databaseId: string) {
  return await getPages(databaseId);
}

export async function createPage(databaseId: string, title: string) {
  if (!title) return;

  const newPage: Page = {
    id: uuidv4(),
    databaseId,
    title,
    properties: {},
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
