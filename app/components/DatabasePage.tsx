'use client';

import { Database, Page } from '@/lib/data';
import DatabaseView from './DatabaseView';
import KanbanView from './KanbanView';
import TimelineView from './TimelineView';
import { useState } from 'react';
import { LayoutGrid, List, Calendar } from 'lucide-react';

export default function DatabasePage({
    database,
    pages
}: {
    database: Database;
    pages: Page[];
}) {
    const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'timeline'>('table');

    const singularName = database.name.endsWith('s')
        ? database.name.slice(0, -1)
        : database.name;

    return (
        <div className="h-full flex flex-col overflow-hidden relative">
            {/* View Switcher (Tab Bar) */}
            <div className="bg-white/40 border-b border-white/20 px-8 py-2 flex items-center gap-1 backdrop-blur-md z-20">
                <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                        }`}
                >
                    <List className="w-4 h-4" />
                    Table
                </button>
                <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                        }`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Board
                </button>
                <button
                    onClick={() => setViewMode('timeline')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'timeline' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    Timeline
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'table' && <DatabaseView database={database} pages={pages} />}
                {viewMode === 'kanban' && <KanbanView database={database} pages={pages} />}
                {viewMode === 'timeline' && <TimelineView database={database} pages={pages} />}
            </div>
        </div>
    );
}
