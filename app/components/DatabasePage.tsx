'use client';

import { Database, Page } from '@/lib/data';
import DatabaseView from './DatabaseView';
import KanbanView from './KanbanView';
import TimelineView from './TimelineView';
import ItemDetailModal from './ItemDetailModal';
import FilterBar, { FilterRule } from './FilterBar';
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

    // Search & Rules Filtering
    const searchQuery = searchParams.get('q') || '';
    
    let currentFilters: FilterRule[] = [];
    try {
        const filtersStr = searchParams.get('filters');
        if (filtersStr) {
            currentFilters = JSON.parse(filtersStr);
        }
    } catch (e) {
        console.error("Failed to parse filters from URL");
    }

    const filteredPages = pages.filter(page => {
        // 1. Text Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            if (!page.title.toLowerCase().includes(lowerQ)) return false;
        }

        // 2. Advanced Multi-Property Row Filters (AND logic)
        for (const rule of currentFilters) {
            const prop = database.schema.find(p => p.id === rule.propertyId);
            if (!prop) continue;

            const pageValRaw = page.properties[rule.propertyId];
            
            // Normalize page value for text comparisons
            let pageValStr = '';
            let pageValArr: string[] = [];

            if (prop.type === 'multi-select') {
               pageValArr = Array.isArray(pageValRaw) ? pageValRaw : [];
            } else {
               pageValStr = pageValRaw != null ? String(pageValRaw).toLowerCase() : '';
            }
            
            const ruleValStr = rule.value != null ? String(rule.value).toLowerCase() : '';

            let matchesRule = false;

            switch (rule.operator) {
                case 'is':
                    if (prop.type === 'multi-select') {
                        matchesRule = pageValArr.includes(rule.value); // Exact match in array
                    } else {
                        // For select/status/date, Exact string match. (pageValStr already checked for null above)
                        if (prop.type === 'date') {
                             // Simple string equivalence for dates format YYYY-MM-DD
                             matchesRule = page.properties[rule.propertyId] === rule.value;
                        } else {
                             matchesRule = pageValStr === ruleValStr; 
                        }
                    }
                    break;
                case 'is_not':
                     if (prop.type === 'multi-select') {
                        matchesRule = !pageValArr.includes(rule.value);
                    } else {
                         if (prop.type === 'date') {
                             matchesRule = page.properties[rule.propertyId] !== rule.value;
                        } else {
                             matchesRule = pageValStr !== ruleValStr; 
                        }
                    }
                    break;
                case 'contains':
                     if (prop.type === 'multi-select') {
                         // multi-select contains is same as 'is'
                        matchesRule = pageValArr.includes(rule.value);
                    } else {
                        matchesRule = pageValStr.includes(ruleValStr);
                    }
                    break;
                case 'is_empty':
                     if (prop.type === 'multi-select') {
                        matchesRule = pageValArr.length === 0;
                    } else {
                        matchesRule = !pageValRaw || pageValStr === '';
                    }
                    break;
                case 'is_not_empty':
                    if (prop.type === 'multi-select') {
                        matchesRule = pageValArr.length > 0;
                    } else {
                        matchesRule = !!pageValRaw && pageValStr !== '';
                    }
                    break;
            }

            if (!matchesRule) return false;
        }

        return true;
    });

    const handleFiltersChange = (newFilters: FilterRule[]) => {
        const params = new URLSearchParams(searchParams);
        if (newFilters.length > 0) {
            params.set('filters', JSON.stringify(newFilters));
        } else {
            params.delete('filters');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

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

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-3">
                    <FilterBar 
                        database={database} 
                        filters={currentFilters} 
                        onFiltersChange={handleFiltersChange}
                    />
                    
                    <div className="h-4 w-px bg-gray-300"></div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-64 px-3 py-1.5 text-sm bg-white/50 border border-white/40 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-400"
                        />
                    </div>
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
