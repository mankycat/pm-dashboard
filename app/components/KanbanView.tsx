'use client';

import { Database, Page, PropertySchema } from '@/lib/data';
import { updatePageProperty } from '@/app/actions';
import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';

export default function KanbanView({
    database,
    pages
}: {
    database: Database;
    pages: Page[];
}) {
    // 1. Find the "Status" property to group by
    const statusProp = database.schema.find(p => p.type === 'status');

    if (!statusProp) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                This database doesn't have a Status property to group by.
            </div>
        );
    }

    // 2. Group pages by status option
    const columns = statusProp.options || [];
    const groupedPages: Record<string, Page[]> = {};

    columns.forEach(opt => {
        groupedPages[opt.id] = pages.filter(p => p.properties[statusProp.id] === opt.id);
    });

    // Handle items with no status or invalid status
    const uncategorized = pages.filter(p => !p.properties[statusProp.id] || !columns.find(c => c.id === p.properties[statusProp.id]));
    if (uncategorized.length > 0) {
        // Optional: render uncategorized column
    }

    return (
        <div className="flex h-full overflow-x-auto p-8 gap-6">
            {columns.map(col => (
                <div key={col.id} className="w-72 flex-shrink-0 flex flex-col">
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getColor(col.color) }}
                            />
                            <h3 className="font-semibold text-gray-700 text-sm">{col.name}</h3>
                            <span className="text-xs text-gray-400 font-medium ml-1">
                                {groupedPages[col.id]?.length || 0}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                        {groupedPages[col.id]?.map(page => (
                            <KanbanCard
                                key={page.id}
                                page={page}
                                database={database}
                            />
                        ))}
                        {(!groupedPages[col.id] || groupedPages[col.id].length === 0) && (
                            <div className="h-full border-2 border-dashed border-gray-200/50 rounded-xl" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function KanbanCard({ page, database }: { page: Page, database: Database }) {
    // Helper to show some properties on the card (e.g. Owner, Date)
    // excluding the Title and the Status itself
    const visibleProps = database.schema.filter(p => p.type !== 'status' && p.type !== 'text'); // simplified filter

    return (
        <div className="glass-card p-3 rounded-lg hover:shadow-md hover:border-indigo-200 cursor-pointer group">
            <h4 className="text-sm font-medium text-gray-900 mb-2 leading-snug group-hover:text-indigo-700 transition-colors">
                {page.title}
            </h4>

            {/* Properties Preview (Tags, Dates, etc) */}
            <div className="space-y-1">
                {visibleProps.slice(0, 3).map(prop => {
                    const val = page.properties[prop.id];
                    if (!val) return null;

                    return (
                        <div key={prop.id} className="flex items-center gap-2 text-xs text-gray-500">
                            {/* Icon? */}
                            <span className="truncate max-w-[150px]">{JSON.stringify(val).replace(/"/g, '')}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getColor(colorName?: string) {
    const colors: Record<string, string> = {
        gray: '#9ca3af',
        blue: '#3b82f6',
        green: '#22c55e',
        yellow: '#eab308',
        red: '#ef4444',
        purple: '#a855f7',
        pink: '#ec4899',
    };
    return colors[colorName || 'gray'] || colorName || '#9ca3af';
}
