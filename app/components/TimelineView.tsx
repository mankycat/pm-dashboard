'use client';

import { Database, Page, PropertySchema } from '@/lib/data';
import { updatePageProperty } from '@/app/actions';
import { useState, useTransition, useMemo } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    DndContext,
    useDraggable,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';

const DAY_WIDTH = 40; // px
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function TimelineView({
    database,
    pages
}: {
    database: Database;
    pages: Page[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [isPending, startTransition] = useTransition();
    const [localPages, setLocalPages] = useState<Page[]>(pages);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sync local pages
    if (pages !== localPages && !isPending && !activeId) {
        setLocalPages(pages);
    }

    const dateProps = database.schema.filter(p => p.type === 'date');

    if (dateProps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <CalendarIcon className="w-8 h-8 opacity-50" />
                <p>This database has no Date properties to visualize.</p>
            </div>
        );
    }

    let startProp = dateProps.find(p => p.name.toLowerCase().includes('start')) || dateProps[0];
    let endProp = dateProps.find(p => p.name.toLowerCase().includes('due') || p.name.toLowerCase().includes('end'));

    if (dateProps.length === 1) endProp = startProp;
    if (!endProp && startProp) endProp = startProp;

    // We need both props to function properly ideally, but handle cases where they are the same
    const isSingleDateMode = startProp.id === endProp?.id;

    const { days, minDate } = useMemo(() => {
        const allDates = localPages.flatMap(p => {
            const dates = [];
            if (p.properties[startProp.id]) dates.push(new Date(p.properties[startProp.id]));
            if (endProp && p.properties[endProp.id]) dates.push(new Date(p.properties[endProp.id]));
            return dates;
        }).filter(d => !isNaN(d.getTime()));

        if (allDates.length === 0) return { days: [], minDate: new Date() };

        const min = new Date(Math.min(...allDates.map(d => d.getTime())));
        const max = new Date(Math.max(...allDates.map(d => d.getTime())));

        min.setDate(min.getDate() - 14); // 2 weeks padding
        max.setDate(max.getDate() + 14);

        const d: Date[] = [];
        const curr = new Date(min);
        while (curr <= max) {
            d.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return { days: d, minDate: min };
    }, [localPages, startProp, endProp]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    if (days.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <div className="bg-gray-100 p-4 rounded-full">
                    <CalendarIcon className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-medium">No dates set</p>
                <p className="text-sm">Add dates to your items to see them on the timeline.</p>
            </div>
        );
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, delta } = event;

        const pageId = active.id as string;
        const page = localPages.find(p => p.id === pageId);
        if (!page) return;

        // Calculate days shifted based on purely horizontal delta
        const daysShifted = Math.round(delta.x / DAY_WIDTH);

        if (daysShifted === 0) return;

        const startStr = page.properties[startProp.id];
        const endStr = endProp ? page.properties[endProp.id] : startStr;
        if (!startStr) return;

        // Use local time parsing to avoid timezone shifts
        const parseDateLocal = (str: string) => {
            const [y, m, d] = str.split(/[-/]/).map(Number);
            return new Date(y, m - 1, d);
        };

        const formatDateLocal = (date: Date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const startDate = parseDateLocal(String(startStr));
        startDate.setDate(startDate.getDate() + daysShifted);
        const newStartStr = formatDateLocal(startDate);

        let newEndStr = newStartStr;
        if (!isSingleDateMode && endStr) {
            const endDate = parseDateLocal(String(endStr));
            endDate.setDate(endDate.getDate() + daysShifted);
            newEndStr = formatDateLocal(endDate);
        }

        // Optimistic UI Update
        setLocalPages(prev => prev.map(p => {
            if (p.id !== pageId) return p;
            return {
                ...p,
                properties: {
                    ...p.properties,
                    [startProp.id]: newStartStr,
                    ...(endProp && !isSingleDateMode ? { [endProp.id]: newEndStr } : {})
                }
            };
        }));

        // Server Call
        startTransition(async () => {
            await updatePageProperty(database.id, pageId, startProp.id, newStartStr);
            if (!isSingleDateMode && endProp) {
                await updatePageProperty(database.id, pageId, endProp.id, newEndStr);
            }
        });
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full overflow-auto flex flex-col p-8">
                <div className="glass-card rounded-xl border border-white/40 shadow-sm bg-white/50 backdrop-blur-md relative overflow-hidden" style={{ minWidth: 'min-content' }}>
                    <div className="flex border-b border-gray-200/60 bg-white/40 sticky top-0 z-20">
                        <div className="w-64 flex-shrink-0 border-r border-gray-200/60 p-3 font-semibold text-gray-600 text-xs uppercase tracking-wider bg-gray-50/90 backdrop-blur-md sticky left-0 z-30">
                            Item
                        </div>
                        <div className="flex bg-white/50">
                            {days.map((day, i) => {
                                const isFirstOfMonth = day.getDate() === 1 || i === 0;
                                return (
                                    <div key={i} className="flex-shrink-0 border-r border-gray-200/50 relative" style={{ width: DAY_WIDTH }}>
                                        {isFirstOfMonth && (
                                            <div className="absolute top-1 text-xs font-bold text-gray-400 pl-1 whitespace-nowrap z-10 bg-white/80 px-1 rounded">
                                                {day.toLocaleString('default', { month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                        <div className={`mt-6 text-center text-[10px] font-medium ${[0, 6].includes(day.getDay()) ? 'text-gray-400 bg-gray-50/50' : 'text-gray-500'} h-full flex items-center justify-center`}>
                                            {day.getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative bg-white/30">
                        {/* Background Grid Lines */}
                        <div className="absolute top-0 bottom-0 left-64 flex pointer-events-none">
                            {days.map((day, i) => (
                                <div key={`grid-${i}`} className={`flex-shrink-0 border-r border-gray-200/30 ${[0, 6].includes(day.getDay()) ? 'bg-gray-100/30' : ''}`} style={{ width: DAY_WIDTH }} />
                            ))}
                        </div>

                        <div className="relative z-10 w-full">
                            {localPages.map(page => {
                                const startStr = page.properties[startProp.id];
                                if (!startStr) return null;

                                return (
                                    <TimelineRow
                                        key={page.id}
                                        page={page}
                                        database={database}
                                        days={days}
                                        minDate={minDate}
                                        startProp={startProp}
                                        endProp={endProp!}
                                        isSingleDateMode={isSingleDateMode}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </DndContext>
    );
}

function TimelineRow({
    page, database, days, minDate, startProp, endProp, isSingleDateMode
}: {
    page: Page; database: Database; days: Date[]; minDate: Date; startProp: PropertySchema; endProp: PropertySchema; isSingleDateMode: boolean;
}) {
    const startStr = page.properties[startProp.id];
    const endStr = isSingleDateMode ? startStr : (page.properties[endProp.id] || startStr);

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    // Calculate position
    const diffTime = startDate.getTime() - minDate.getTime();
    const diffDays = Math.floor(diffTime / MS_PER_DAY);
    const left = diffDays * DAY_WIDTH;

    const durationTime = endDate.getTime() - startDate.getTime();
    const durationDays = Math.floor(durationTime / MS_PER_DAY) + 1;
    const width = Math.max(durationDays * DAY_WIDTH, DAY_WIDTH);

    const statusProp = database.schema.find(p => p.type === 'status');
    const statusVal = statusProp ? page.properties[statusProp.id] : undefined;
    const statusOpt = statusProp?.options?.find(o => o.id === statusVal);
    const color = getColor(statusOpt?.color);

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: page.id,
    });

    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const barStyle = transform ? {
        transform: `translate3d(${transform.x}px, 0, 0)`, // Only horizontal
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 50 : 10,
    } : undefined;

    return (
        <div className="flex border-b border-gray-200/50 hover:bg-white/60 transition-colors group relative h-12">
            <div className="w-64 flex-shrink-0 border-r border-gray-200/60 p-3 text-sm font-medium text-gray-700 truncate sticky left-0 z-20 bg-white/80 backdrop-blur-md group-hover:bg-gray-50/90 transition-colors">
                {page.title || 'Untitled'}
            </div>

            <div className="relative flex-1" style={{ width: days.length * DAY_WIDTH }}>
                <div
                    ref={setNodeRef}
                    {...listeners}
                    {...attributes}
                    className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md shadow-sm border transition-all cursor-grab active:cursor-grabbing flex items-center px-2 select-none ${isDragging ? 'shadow-lg ring-2 ring-indigo-500/50' : 'hover:brightness-95'}`}
                    style={{
                        left,
                        width: width - 2,
                        backgroundColor: color,
                        borderColor: color,
                        touchAction: 'none',
                        ...barStyle
                    }}
                    onDoubleClick={(e) => {
                        // Double click to open modal, avoiding conflict with drag
                        e.stopPropagation();
                        const params = new URLSearchParams(searchParams);
                        params.set('itemId', page.id);
                        router.push(`${pathname}?${params.toString()}`, { scroll: false });
                    }}
                >
                    <span className="text-[10px] text-white font-medium truncate drop-shadow-sm pointer-events-none">
                        {page.title}
                    </span>

                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-0 text-white bg-gray-800 text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none z-[100] shadow-xl">
                        {startStr} {endStr !== startStr ? `→ ${endStr}` : ''}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getColor(colorName?: string) {
    const colors: Record<string, string> = {
        gray: '#9ca3af',
        blue: '#60a5fa',
        green: '#4ade80',
        yellow: '#facc15',
        red: '#f87171',
        purple: '#c084fc',
        pink: '#f472b6',
    };
    return colors[colorName || 'gray'] || colorName || '#60a5fa'; // default to blueish
}
