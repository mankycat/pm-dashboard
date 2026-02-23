'use client';

import { Database, Page } from '@/lib/data';
import DatabaseView from './DatabaseView';
import KanbanView from './KanbanView';
import TimelineView from './TimelineView';
import ItemDetailModal from './ItemDetailModal';
import { useState } from 'react';
import { LayoutGrid, List, Calendar } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function DatabasePage({
    database,
    pages
}: {
    database: Database;
    pages: Page[];
}) {
    const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'timeline'>('table');
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const selectedItemId = searchParams.get('itemId');
    const selectedPage = selectedItemId ? pages.find(p => p.id === selectedItemId) : undefined;

    // Search Filtering
    const searchQuery = searchParams.get('q') || '';
    const filteredPages = pages.filter(page => {
        if (!searchQuery) return true;
        const lowerQ = searchQuery.toLowerCase();
        // Search by Title
        if (page.title.toLowerCase().includes(lowerQ)) return true;
        return false;
    });

    const handleCloseModal = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('itemId');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.value) {
            params.set('q', e.target.value);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const singularName = database.name.endsWith('s')
        ? database.name.slice(0, -1)
        : database.name;

    return (
        <div className="h-full flex flex-col overflow-hidden relative">
            {/* View Switcher & Actions Bar */}
            <div className="bg-white/40 border-b border-white/20 px-8 py-2 flex items-center justify-between backdrop-blur-md z-20">
                <div className="flex items-center gap-1">
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

                {/* Search Bar */}
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Filter..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-64 px-3 py-1.5 text-sm bg-white/50 border border-white/40 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'table' && <DatabaseView database={database} pages={filteredPages} />}
                {viewMode === 'kanban' && <KanbanView database={database} pages={filteredPages} />}
                {viewMode === 'timeline' && <TimelineView database={database} pages={filteredPages} />}
            </div>

            {/* Detail Modal */}
            <ItemDetailModal
                isOpen={!!selectedPage}
                onClose={handleCloseModal}
                database={database}
                page={selectedPage}
            />
        </div>
    );
}
