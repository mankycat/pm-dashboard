'use client';

import { Database, Page, PropertySchema } from '@/lib/data';
import { updatePageProperty } from '@/app/actions';
import { useState, useTransition, useMemo, useRef } from 'react';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
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
import { toPng } from 'html-to-image';

const DAY_WIDTH = 50; // slightly wider to fit inner text better
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
    const [isExporting, setIsExporting] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

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

    const isSingleDateMode = startProp.id === endProp?.id;

    // Optional: Find project or categories for grouping
    const groupProp = database.schema.find(p => p.name.toLowerCase() === 'project' || p.name.toLowerCase() === 'category');

    const groupedPages = useMemo(() => {
        const groups: Record<string, Page[]> = {};
        if (groupProp) {
            localPages.forEach(p => {
                const gVal = p.properties[groupProp.id];
                let gName = '';
                if (gVal) {
                    if (groupProp.type === 'select' && groupProp.options) {
                        const opt = groupProp.options.find(o => o.id === gVal);
                        gName = opt ? opt.name : String(gVal);
                    } else {
                        gName = String(gVal);
                    }
                }

                if (!groups[gName]) groups[gName] = [];
                groups[gName].push(p);
            });
        } else {
            groups[''] = localPages;
        }
        return groups;
    }, [localPages, groupProp]);

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

        min.setDate(min.getDate() - 14); // padding
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

    const handleExport = async () => {
        if (!chartRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(chartRef.current, {
                cacheBust: true,
                backgroundColor: '#f8fafc',
                pixelRatio: 2 // High Res
            });
            const link = document.createElement('a');
            link.download = 'milestone-gantt-chart.png';
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to export', err);
        }
        setIsExporting(false);
    };

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

        let pageId = active.id as string;
        let isResizeStart = false;
        let isResizeEnd = false;

        if (pageId.startsWith('resize-start-')) {
            pageId = pageId.replace('resize-start-', '');
            isResizeStart = true;
        } else if (pageId.startsWith('resize-end-')) {
            pageId = pageId.replace('resize-end-', '');
            isResizeEnd = true;
        }

        const page = localPages.find(p => p.id === pageId);
        if (!page) return;

        const daysShifted = Math.round(delta.x / DAY_WIDTH);
        if (daysShifted === 0) return;

        const startStr = page.properties[startProp.id];
        const endStr = endProp ? page.properties[endProp.id] : startStr;
        if (!startStr) return;

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
        const endDate = endStr ? parseDateLocal(String(endStr)) : startDate;

        if (isResizeStart && !isSingleDateMode) {
            startDate.setDate(startDate.getDate() + daysShifted);
        } else if (isResizeEnd && !isSingleDateMode) {
            endDate.setDate(endDate.getDate() + daysShifted);
        } else {
            // Whole bar dragged
            startDate.setDate(startDate.getDate() + daysShifted);
            endDate.setDate(endDate.getDate() + daysShifted);
        }

        const newStartStr = formatDateLocal(startDate);
        const newEndStr = formatDateLocal(endDate);

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
            <div className="h-full overflow-auto flex flex-col p-8 bg-slate-50 relative">
                {/* Export Button */}
                <div className="absolute top-4 right-8 z-50">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-white/80 hover:bg-white text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition-all text-sm backdrop-blur-sm"
                    >
                        <Download className="w-4 h-4 text-indigo-500" />
                        {isExporting ? 'Exporting...' : 'Export Milestone Gantt'}
                    </button>
                </div>

                <div
                    ref={chartRef}
                    className="glass-card rounded-xl border border-white/40 shadow-sm bg-white backdrop-blur-md relative mt-8 p-4"
                    style={{ minWidth: 'min-content' }}
                >
                    {/* Header (Timeline axis) */}
                    <div className="flex border-b-2 border-slate-300 pb-2 mb-2 sticky top-0 z-20 bg-white">
                        <div className="w-32 flex-shrink-0 font-bold text-gray-800 text-sm tracking-widest uppercase flex items-center justify-center border-r-2 border-slate-300">
                            Parent
                        </div>
                        <div className="flex relative items-center">
                            {days.map((day, i) => {
                                const isFirstOfMonth = day.getDate() === 1 || i === 0 || day.getDate() === 15;
                                return (
                                    <div key={i} className="flex-shrink-0 relative h-10 border-l border-dashed border-gray-300/50" style={{ width: DAY_WIDTH }}>
                                        {isFirstOfMonth && (
                                            <div className="absolute -top-1 -translate-x-1/2 text-[11px] font-bold text-gray-600 bg-white px-1">
                                                {day.toLocaleString('default', { month: 'numeric' })}/{day.getDate()}
                                            </div>
                                        )}
                                        {/* Ticks for each day */}
                                        <div className="absolute bottom-0 w-full h-2 border-r border-gray-200" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative">
                        {/* Background Vertical Grid Lines */}
                        <div className="absolute top-0 bottom-0 flex pointer-events-none z-0" style={{ left: 128 /* w-32 */ }}>
                            {days.map((day, i) => (
                                <div key={`grid-${i}`} className={`flex-shrink-0 border-r border-dashed border-gray-300/60 ${[0, 6].includes(day.getDay()) ? 'bg-gray-100/30' : ''}`} style={{ width: DAY_WIDTH }} />
                            ))}
                        </div>

                        {/* Group Render (Parent / Child) */}
                        <div className="relative z-10 w-full flex flex-col gap-4">
                            {Object.entries(groupedPages).map(([groupName, gPages], groupIndex) => (
                                <div key={groupName} className="flex min-h-[60px] relative border-b border-gray-100 last:border-0 pb-4">
                                    {/* Parent Item (Large Block on left) */}
                                    <div className={`w-32 flex-shrink-0 sticky left-0 z-30 flex items-center justify-center p-3 text-sm tracking-wide break-words text-center ${groupName
                                            ? 'bg-blue-500 rounded-l-md shadow-sm border-r border-blue-600 text-white font-bold'
                                            : 'bg-white/50 text-gray-400 font-medium border-r border-dotted border-gray-200'
                                        }`}>
                                        {groupName || 'Uncategorized'}
                                    </div>

                                    {/* Child Items (Rows) */}
                                    <div className="flex-1 flex flex-col justify-around py-3">
                                        {gPages.map(page => {
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
                            ))}
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
    const originLeft = diffDays * DAY_WIDTH;

    const durationTime = endDate.getTime() - startDate.getTime();
    const durationDays = Math.floor(durationTime / MS_PER_DAY) + 1;
    const originWidth = Math.max(durationDays * DAY_WIDTH, DAY_WIDTH);

    const statusProp = database.schema.find(p => p.type === 'status');
    const statusVal = statusProp ? page.properties[statusProp.id] : undefined;
    const statusOpt = statusProp?.options?.find(o => o.id === statusVal);
    const color = getColor(statusOpt?.color);

    // Main Drag (Move)
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: page.id,
    });

    // Resize Start (Left Edge)
    const { attributes: startAttr, listeners: startList, setNodeRef: setStartRef, transform: startTransform, isDragging: isStartDragging } = useDraggable({
        id: `resize-start-${page.id}`,
    });

    // Resize End (Right Edge)
    const { attributes: endAttr, listeners: endList, setNodeRef: setEndRef, transform: endTransform, isDragging: isEndDragging } = useDraggable({
        id: `resize-end-${page.id}`,
    });

    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    let renderLeft = originLeft;
    let renderWidth = originWidth - 4; // Add slight gap

    if (transform) {
        renderLeft += transform.x;
    } else if (startTransform) {
        renderLeft += startTransform.x;
        renderWidth -= startTransform.x;
    } else if (endTransform) {
        renderWidth += endTransform.x;
    }

    // Ensure minimal width is maintained visually
    renderWidth = Math.max(renderWidth, DAY_WIDTH / 2);

    const isAnyDragging = isDragging || isStartDragging || isEndDragging;

    // Drawing Gantt bar with clipping/point style
    return (
        <div className="h-14 relative group flex items-center w-full my-1">
            <div
                className={`absolute h-10 rounded-sm overflow-hidden select-none transition-shadow ${isAnyDragging ? 'shadow-xl ring-2 ring-indigo-500 brightness-110 z-50' : 'shadow hover:brightness-105 z-10'}`}
                style={{
                    left: renderLeft,
                    width: renderWidth,
                    backgroundColor: '#bfdffa', // Sub-item gantt bar color
                    border: '1px solid #9cbfe8',
                    touchAction: 'none',
                    clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%)' // Add an arrow point tip!
                }}
            >
                {/* Drag Handle (Move Entire Bar) - Main Content Area */}
                <div
                    ref={setNodeRef}
                    {...listeners}
                    {...attributes}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing flex items-center px-4"
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        const params = new URLSearchParams(searchParams);
                        params.set('itemId', page.id);
                        router.push(`${pathname}?${params.toString()}`, { scroll: false });
                    }}
                >
                    <span className="text-sm text-gray-800 font-semibold truncate pointer-events-none relative z-10">
                        {page.title || 'Untitled'}
                    </span>

                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-4 text-white bg-gray-800 text-[11px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-[100] shadow-md">
                        {startStr} {endStr !== startStr ? `→ ${endStr}` : ''}
                    </div>
                </div>

                {/* Left Edge Handle */}
                {!isSingleDateMode && (
                    <div
                        ref={setStartRef}
                        {...startList}
                        {...startAttr}
                        className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/10 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="w-[2px] h-4 bg-gray-400 rounded-full" />
                    </div>
                )}

                {/* Right Edge Handle */}
                {!isSingleDateMode && (
                    <div
                        ref={setEndRef}
                        {...endList}
                        {...endAttr}
                        className="absolute right-0 top-0 bottom-0 w-6 cursor-ew-resize hover:bg-black/10 z-20 flex items-center justify-start pl-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="w-[2px] h-4 bg-gray-400 rounded-full" />
                    </div>
                )}
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
