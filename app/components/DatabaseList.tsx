'use client';

import { Database, Page } from '@/lib/data';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Layers, Plus, Folder, Loader2 } from 'lucide-react';
import { createPage } from '../actions';
import { useTransition } from 'react';

export default function DatabaseList({
    projects,
    databases,
}: {
    projects: Page[];
    databases: Database[];
}) {
    const searchParams = useSearchParams();
    const activeDatabaseId = searchParams.get('databaseId');
    const activeProjectId = searchParams.get('projectId');
    const [isPending, startTransition] = useTransition();

    const handleCreateProject = () => {
        startTransition(async () => {
            const projectsDb = databases.find(db => db.id === 'db-projects');
            if (!projectsDb) return;
            // Optionally prompt for name, or just create "Untitled"
            const name = window.prompt("Enter new project name:");
            if (name) {
                await createPage(projectsDb.id, name);
            }
        });
    };

    return (
        <div className="w-64 glass border-r border-white/20 h-screen overflow-y-auto flex flex-col pt-6 pb-4 shadow-xl z-20">
            <div className="px-6 mb-8">
                <div className="flex items-center gap-3 text-indigo-700">
                    <Layers className="w-6 h-6" />
                    <h2 className="text-xl font-bold tracking-tight">Workspaces</h2>
                </div>
            </div>

            <div className="px-3 space-y-1">
                <Link
                    href="/"
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-6 ${!activeDatabaseId && !activeProjectId && searchParams.get('view') !== 'report'
                        ? 'bg-white/60 text-indigo-700 shadow-sm border border-white/40 backdrop-blur-sm'
                        : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                        }`}
                >
                    <LayoutGrid className={`w-4 h-4 ${!activeDatabaseId && !activeProjectId && searchParams.get('view') !== 'report' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    Overview Dashboard
                </Link>

                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Projects
                </h3>
                {projects.map(project => {
                    const isActive = activeProjectId === project.id;
                    return (
                        <Link
                            key={project.id}
                            href={`/?projectId=${project.id}`}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-white/60 text-indigo-700 shadow-sm border border-white/40 backdrop-blur-sm'
                                : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                                }`}
                        >
                            <Folder className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            {project.title || 'Untitled'}
                        </Link>
                    );
                })}

                <button 
                    onClick={handleCreateProject}
                    disabled={isPending}
                    className="w-full mt-2 mb-6 flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-indigo-600 transition-colors border border-dashed border-gray-300 hover:border-indigo-300 rounded-lg disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Add Project</span>
                </button>

                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 pt-4 border-t border-gray-200">
                    System Views
                </h3>
                <Link
                    href="/?view=report"
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-6 ${searchParams.get('view') === 'report'
                        ? 'bg-white/60 text-indigo-700 shadow-sm border border-white/40 backdrop-blur-sm'
                        : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                        }`}
                >
                    <List className={`w-4 h-4 ${searchParams.get('view') === 'report' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    Weekly Report
                </Link>

                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 pt-4 border-t border-gray-200">
                    Raw Databases
                </h3>
                {databases.filter(d => ['db-projects', 'db-tasks', 'db-issues'].includes(d.id)).map(db => {
                    const isActive = activeDatabaseId === db.id;
                    return (
                        <Link
                            key={db.id}
                            href={`/?databaseId=${db.id}`}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-white/60 text-indigo-700 shadow-sm border border-white/40 backdrop-blur-sm'
                                : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                                }`}
                        >
                            {db.name.toLowerCase().includes('task') ? (
                                <List className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            ) : (
                                <LayoutGrid className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            )}
                            {db.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
