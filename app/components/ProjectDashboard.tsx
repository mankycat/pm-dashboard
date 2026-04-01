'use client';

import { Database, Page } from '@/lib/data';
import { useState } from 'react';
import { Kanban, Calendar as CalendarIcon, FileText, CheckCircle2 } from 'lucide-react';
import KanbanView from './KanbanView';
import TimelineView from './TimelineView';
import WeeklyReportView from './WeeklyReportView';
import ItemDetailModal from './ItemDetailModal';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function ProjectDashboard({
    project,
        allData,
}: {
    project: Page;
    allData: { db: Database; pages: Page[] }[];
}) {
    const [activeTab, setActiveTab] = useState<'board' | 'timeline' | 'issues' | 'reports'>('board');

    const tasksDb = allData.find(d => d.db.id === 'db-tasks')?.db;
    const issuesDb = allData.find(d => d.db.id === 'db-issues')?.db;

    const allTasks = allData.find(d => d.db.id === 'db-tasks')?.pages || [];
    const allIssues = allData.find(d => d.db.id === 'db-issues')?.pages || [];

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const itemId = searchParams.get('itemId');

    let selectedPage: Page | undefined;
    let selectedDatabase: Database | undefined;

    if (itemId) {
        selectedPage = allTasks.find(p => p.id === itemId);
        if (selectedPage && tasksDb) {
            selectedDatabase = tasksDb;
        } else {
            selectedPage = allIssues.find(p => p.id === itemId);
            if (selectedPage && issuesDb) selectedDatabase = issuesDb;
        }
    }

    const handleCloseModal = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('itemId');
        router.replace(`${pathname}?${params.toString()}`);
    };

    // Filter by Project
    const projectTasks = allTasks.filter(t => {
        const projProp = tasksDb?.schema.find(s => s.name === 'Project ID' || s.name === 'Project');
        return projProp && t.properties[projProp.id] === project.id;
    });

    const projectIssues = allIssues.filter(i => {
        const projProp = issuesDb?.schema.find(s => s.name === 'Project ID' || s.name === 'Project');
        return projProp && i.properties[projProp.id] === project.id;
    });

    return (
        <div className="h-full flex flex-col w-full min-w-0 bg-slate-50 relative">
            {/* Header */}
            <header className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 border-none outline-none bg-transparent">
                        {project.title || 'Untitled Project'}
                    </h1>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('board')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'board' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Kanban className="w-4 h-4" /> Board (Tasks)
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'timeline' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <CalendarIcon className="w-4 h-4" /> Timeline
                    </button>
                    <button
                        onClick={() => setActiveTab('issues')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'issues' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <CheckCircle2 className="w-4 h-4" /> Issues
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'reports' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <FileText className="w-4 h-4" /> Weekly Reports
                    </button>
                </div>
            </header>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'board' && tasksDb && (
                    <KanbanView database={tasksDb} pages={projectTasks} activeProjectId={project.id} />
                )}
                {activeTab === 'timeline' && tasksDb && (
                    <TimelineView database={tasksDb} pages={projectTasks} />
                )}
                {activeTab === 'issues' && issuesDb && (
                    <KanbanView database={issuesDb} pages={projectIssues} activeProjectId={project.id} />
                )}
                {activeTab === 'reports' && (
                    <WeeklyReportView allData={allData} activeProject={project} />
                )}
            </div>

            {selectedDatabase && selectedPage && (
                <ItemDetailModal 
                    isOpen={true} 
                    onClose={handleCloseModal} 
                    database={selectedDatabase} 
                    page={selectedPage} 
                />
            )}
        </div>
    );
}
