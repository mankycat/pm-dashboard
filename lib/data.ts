import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

export interface Task {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'todo' | 'in-progress' | 'done';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  tasks: Task[];
}

export interface Database {
  projects: Project[];
}

export async function getProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const db: Database = JSON.parse(data);
    return db.projects;
  } catch (error) {
    console.error("Failed to read database:", error);
    return [];
  }
}

export async function saveProjects(projects: Project[]): Promise<void> {
  const db: Database = { projects };
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}
