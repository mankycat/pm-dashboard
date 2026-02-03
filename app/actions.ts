'use server';

import { getProjects, saveProjects, Project, Task } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function fetchProjects() {
  return await getProjects();
}

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) return;

  const projects = await getProjects();
  const newProject: Project = {
    id: uuidv4(),
    name,
    status: 'active',
    tasks: []
  };

  projects.push(newProject);
  await saveProjects(projects);
  revalidatePath('/');
}

export async function createTask(projectId: string, formData: FormData) {
  const title = formData.get('title') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;

  if (!title || !startDate || !endDate) return;

  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);

  if (project) {
    const newTask: Task = {
      id: uuidv4(),
      title,
      startDate,
      endDate,
      progress: 0,
      status: 'todo'
    };
    project.tasks.push(newTask);
    await saveProjects(projects);
    revalidatePath('/');
  }
}

export async function updateTaskStatus(projectId: string, taskId: string, newStatus: Task['status']) {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (project) {
    const task = project.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
      task.progress = newStatus === 'done' ? 100 : task.progress;
      await saveProjects(projects);
      revalidatePath('/');
    }
  }
}
