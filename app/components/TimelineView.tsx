'use client';

import { Database, Page } from '@/lib/data';
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function TimelineView({
    database,
    pages
}: {
    database: Database;
    pages: Page[];
}) {
    // 1. Identify Date Properties
    const dateProps = database.schema.filter(p => p.type === 'date');

    if (dateProps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <CalendarIcon className="w-8 h-8 opacity-50" />
                <p>This database has no Date properties to visualize.</p>
            </div>
        );
    }

    // Heuristic: Try to find "Start" and "End" based on naming, or just pick first/second
    let startProp = dateProps.find(p => p.name.toLowerCase().includes('start')) || dateProps[0];
    let endProp = dateProps.find(p => p.name.toLowerCase().includes('due') || p.name.toLowerCase().includes('end'));

    // If only one date prop exists, use it for both (milestone)
    if (dateProps.length === 1) {
        endProp = startProp;
    }
    // If we found start but no end (and they are different), use start as end
    if (!endProp && startProp) endProp = startProp;

    // 2. Determine Timeline Range
    const allDates = pages.flatMap(p => {
        const dates = [];
        if (p.properties[startProp.id]) dates.push(new Date(p.properties[startProp.id]));
        if (endProp && p.properties[endProp.id]) dates.push(new Date(p.properties[endProp.id]));
        return dates;
    }).filter(d => !isNaN(d.getTime()));

    if (allDates.length === 0) {
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

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Add padding (1 week before, 1 week after)
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    // Generate Array of Days
    const days: Date[] = [];
    const curr = new Date(minDate);
    while (curr <= maxDate) {
        days.push(new Date(curr));
        curr.setDate(curr.getDate() + 1);
    }

    const DAY_WIDTH = 40; // px

    return (
        <div className="h-full overflow-auto flex flex-col p-8">
            <div className="glass-card rounded-xl overflow-hidden border border-white/40 shadow-sm bg-white/50 backdrop-blur-md">

                {/* Timeline Header (Months/Days) */}
                <div className="flex border-b border-gray-200/60 bg-white/40 sticky top-0 z-10">
                    <div className="w-64 flex-shrink-0 border-r border-gray-200/60 p-3 font-semibold text-gray-600 text-xs uppercase tracking-wider bg-gray-50/50 backdrop-blur-sm sticky left-0 z-20">
                        Item
                    </div>
                    <div className="flex">
                        {days.map((day, i) => {
                            const isFirstOfMonth = day.getDate() === 1 || i === 0;
                            return (
                                <div key={i} className="flex-shrink-0 border-r border-gray-100/50" style={{ width: DAY_WIDTH }}>
                                    {/* Month Label */}
                                    {isFirstOfMonth && (
                                        <div className="absolute top-0 text-xs font-bold text-gray-400 pl-1 whitespace-nowrap">
                                            {day.toLocaleString('default', { month: 'short' })}
                                        </div>
                                    )}
                                    {/* Day Number */}
                                    <div className={`mt-5 text-center text-xs ${[0, 6].includes(day.getDay()) ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Timeline Rows */}
                <div className="relative">
                    {pages.map(page => {
                        const startStr = page.properties[startProp.id];
                        const endStr = endProp ? page.properties[endProp.id] : startStr;

                        if (!startStr) return null; // Skip items without start date

                        const startDate = new Date(startStr);
                        const endDate = endStr ? new Date(endStr) : startDate;

                        // Calculate position
                        const diffTime = Math.abs(startDate.getTime() - minDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const left = diffDays * DAY_WIDTH;

                        const durationTime = Math.abs(endDate.getTime() - startDate.getTime());
                        const durationDays = Math.floor(durationTime / (1000 * 60 * 60 * 24)) + 1;
                        const width = Math.max(durationDays * DAY_WIDTH, DAY_WIDTH); // at least 1 unit

                        return (
                            <div key={page.id} className="flex border-b border-gray-100 hover:bg-white/40 transition-colors group">
                                <div className="w-64 flex-shrink-0 border-r border-gray-200/60 p-3 text-sm font-medium text-gray-700 truncate sticky left-0 z-10 bg-white/30 backdrop-blur-sm group-hover:bg-white/80 transition-colors">
                                    {page.title}
                                </div>
                                <div className="relative flex-1" style={{ width: days.length * DAY_WIDTH }}>
                                    <div
                                        className="absolute top-2 h-6 rounded-md bg-indigo-500 shadow-sm border border-indigo-400 hover:bg-indigo-600 transition-colors cursor-pointer group/bar"
                                        style={{ left, width: width - 8 }} // -8 for margin
                                        title={`${startStr} - ${endStr}`}
                                    >
                                        <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                            {startStr} → {endStr}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
