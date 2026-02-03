'use client';

import { Project } from '@/lib/data';
import { createProject } from '@/app/actions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ProjectList({ projects }: { projects: Project[] }) {
  const searchParams = useSearchParams();
  const activeId = searchParams.get('projectId');

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col p-4 border-r border-gray-800">
      <h1 className="text-xl font-bold mb-6 tracking-wider">PM DASHBOARD</h1>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/?projectId=${p.id}`}
            className={`block p-3 rounded transition-colors ${
              activeId === p.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            <div className="font-medium">{p.name}</div>
            <div className="text-xs opacity-60 truncate">{p.description || 'No desc'}</div>
          </Link>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-800">
        <form action={createProject} className="flex gap-2">
          <input
            name="name"
            placeholder="New Project..."
            className="flex-1 bg-gray-800 text-sm px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 text-sm"
          >
            +
          </button>
        </form>
      </div>
    </div>
  );
}
