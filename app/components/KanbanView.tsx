'use client';

import { Database, Page } from '@/lib/data';
import { updatePageProperty } from '@/app/actions';
import { useState, useTransition } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

export default function KanbanView({
    database,
    pages
}: {
    database: Database;
    pages: Page[];
}) {
    const statusProp = database.schema.find(p => p.type === 'status');
    const [isPending, startTransition] = useTransition();
    const [activeId, setActiveId] = useState<string | null>(null);

    // Optimistic UI state for faster perceived drag-and-drop
    const [localPages, setLocalPages] = useState<Page[]>(pages);

    // Sync local pages if upstream pages change
    if (pages !== localPages && !isPending) {
        setLocalPages(pages);
    }

    if (!statusProp) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                This database doesn't have a Status property to group by.
            </div>
        );
    }

    const columns = statusProp.options || [];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before dragging starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over) return;

        const pageId = active.id as string;
        const newStatusId = over.id as string;

        // Find current page
        const pageToUpdate = localPages.find(p => p.id === pageId);
        if (!pageToUpdate) return;

        const currentStatusId = pageToUpdate.properties[statusProp.id];

        if (currentStatusId !== newStatusId) {
            // Optimistic Update
            setLocalPages(prev => prev.map(p =>
                p.id === pageId
                    ? { ...p, properties: { ...p.properties, [statusProp.id]: newStatusId } }
                    : p
            ));

            // Server Update
            startTransition(async () => {
                await updatePageProperty(database.id, pageId, statusProp.id, newStatusId);
            });
        }
    };

    const activePage = activeId ? localPages.find(p => p.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full overflow-x-auto p-8 gap-6">
                {columns.map(col => {
                    const columnPages = localPages.filter(p => p.properties[statusProp.id] === col.id);
                    return (
                        <KanbanColumn
                            key={col.id}
                            column={col}
                            pages={columnPages}
                            database={database}
                        />
                    );
                })}
            </div>

            {/* Overlay for the item being dragged */}
            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {activePage ? <KanbanCard page={activePage} database={database} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({ column, pages, database }: { column: any, pages: Page[], database: Database }) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div className="w-72 flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getColor(column.color) }}
                    />
                    <h3 className="font-semibold text-gray-700 text-sm">{column.name}</h3>
                    <span className="text-xs text-gray-400 font-medium ml-1">
                        {pages.length}
                    </span>
                </div>
                <div className="flex gap-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto space-y-3 pb-4 rounded-xl min-h-[150px] transition-colors ${isOver ? 'bg-gray-100/50 outline outline-2 outline-indigo-200/50 outline-offset-2' : ''}`}
            >
                {pages.map(page => (
                    <DraggableKanbanCard
                        key={page.id}
                        page={page}
                        database={database}
                    />
                ))}

                {pages.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200/50 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}

function DraggableKanbanCard({ page, database }: { page: Page, database: Database }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: page.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <KanbanCard page={page} database={database} isDragging={isDragging} />
        </div>
    );
}

function KanbanCard({ page, database, isOverlay = false, isDragging = false }: { page: Page, database: Database, isOverlay?: boolean, isDragging?: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const visibleProps = database.schema.filter(p => p.type !== 'status' && p.type !== 'text' && p.type !== 'multi-select');

    return (
        <div
            onClick={(e) => {
                if (isDragging) return;
                const params = new URLSearchParams(searchParams);
                params.set('itemId', page.id);
                router.push(`${pathname}?${params.toString()}`);
            }}
            className={`p-3 rounded-lg text-left w-full transition-all group ${isOverlay
                    ? 'bg-white shadow-xl ring-2 ring-indigo-500 scale-105 rotate-2 cursor-grabbing'
                    : isDragging
                        ? 'bg-gray-50 border border-gray-200 shadow-sm cursor-grabbing'
                        : 'glass-card hover:shadow-md hover:border-indigo-200 cursor-grab hover:-translate-y-0.5'
                }`}
        >
            <h4 className="text-sm font-medium text-gray-900 mb-2 leading-snug group-hover:text-indigo-700 transition-colors">
                {page.title || 'Untitled'}
            </h4>

            <div className="space-y-1 mt-3">
                {visibleProps.slice(0, 2).map(prop => {
                    const val = page.properties[prop.id];
                    if (!val) return null;

                    return (
                        <div key={prop.id} className="flex items-center gap-2 text-[11px] text-gray-500 font-medium bg-gray-50/80 px-2 py-0.5 rounded w-fit">
                            <span className="truncate max-w-[150px]">{String(val)}</span>
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
