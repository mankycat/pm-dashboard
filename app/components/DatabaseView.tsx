'use client';

import { Database, Page } from '@/lib/data';
import { createPage, updatePageProperty, updatePageTitle } from '@/app/actions';
import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Calendar, User, Tag, CheckCircle2, Layers } from 'lucide-react';

export default function DatabaseView({
    database,
    pages
}: {
    database: Database;
    pages: Page[];
}) {
    const [isCreating, setIsCreating] = useState(false);

    // Helper to singularize name for button (basic heuristic)
    const singularName = database.name.endsWith('s')
        ? database.name.slice(0, -1)
        : database.name;

    return (
        <div className="h-full flex flex-col overflow-hidden relative">
            {/* Glass Header */}
            <div className="px-8 py-6 border-b border-white/20 flex justify-between items-end bg-white/40 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{database.name}</h1>
                    {database.description && (
                        <p className="text-gray-500 mt-1 text-sm font-medium">{database.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-9 pr-4 py-2 bg-white/60 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48 transition-all hover:bg-white/80"
                        />
                    </div>

                    <button className="p-2 text-gray-500 hover:text-gray-700 bg-white/60 hover:bg-white/90 border border-gray-200 rounded-lg transition-all shadow-sm">
                        <Filter className="w-4 h-4" />
                    </button>

                    <button
                        onClick={async () => {
                            setIsCreating(true);
                            await createPage(database.id, "Untitled");
                            setIsCreating(false);
                        }}
                        disabled={isCreating}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New {singularName}
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="flex-1 overflow-auto p-8">
                <div className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl shadow-sm overflow-hidden min-w-full">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                                    Name
                                </th>
                                {database.schema.map(prop => (
                                    <th key={prop.id} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            {getIconForType(prop.type)}
                                            {prop.name}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/60 bg-transparent">
                            {pages.map(page => (
                                <tr key={page.id} className="hover:bg-indigo-50/40 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-indigo-900">
                                        <input
                                            type="text"
                                            defaultValue={page.title}
                                            onBlur={async (e) => {
                                                if (e.target.value !== page.title) {
                                                    await updatePageTitle(database.id, page.id, e.target.value);
                                                }
                                            }}
                                            className="bg-transparent w-full focus:outline-none focus:border-b-2 focus:border-indigo-500 transition-colors"
                                        />
                                    </td>
                                    {database.schema.map(prop => {
                                        const value = page.properties[prop.id];
                                        return (
                                            <td key={prop.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <PropertyCell
                                                    databaseId={database.id}
                                                    pageId={page.id}
                                                    propertyId={prop.id}
                                                    type={prop.type}
                                                    options={prop.options}
                                                    value={value}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {pages.length === 0 && (
                                <tr>
                                    <td colSpan={database.schema.length + 1} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                                <Layers className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <p className="font-medium">No items found</p>
                                            <p className="text-sm mt-1">Get started by creating a new {singularName.toLowerCase()}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function getIconForType(type: string) {
    switch (type) {
        case 'status': return <CheckCircle2 className="w-3 h-3" />;
        case 'date': return <Calendar className="w-3 h-3" />;
        case 'person': return <User className="w-3 h-3" />;
        case 'select': return <Tag className="w-3 h-3" />;
        default: return null;
    }
}

function PropertyCell({
    databaseId, pageId, propertyId, type, options, value
}: {
    databaseId: string;
    pageId: string;
    propertyId: string;
    type: string;
    options?: any[];
    value: any;
}) {
    const handleChange = async (newValue: any) => {
        await updatePageProperty(databaseId, pageId, propertyId, newValue);
    };

    if (type === 'status' || type === 'select') {
        const selectedOption = options?.find(o => o.id === value);
        return (
            <div className="relative">
                <select
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className="block w-full text-xs font-medium border-0 rounded-full py-1 pl-2 pr-8 focus:ring-0 cursor-pointer appearance-none transition-all"
                    style={{
                        backgroundColor: selectedOption ? `${getColor(selectedOption.color)}20` : '#f3f4f6',
                        color: selectedOption ? getColor(selectedOption.color) : '#6b7280',
                    }}
                >
                    <option value="">Empty</option>
                    {options?.map(opt => (
                        <option key={opt.id} value={opt.id}>
                            {opt.name}
                        </option>
                    ))}
                </select>
                {/* Helper to show color if simple dropdown doesn't support generic styling well enough */}
                {/* We rely on tailwind colors mapped to hex roughly, or just simple names */}
            </div>
        );
    }

    if (type === 'text') {
        return (
            <input
                type="text"
                defaultValue={value || ''}
                onBlur={(e) => {
                    if (e.target.value !== value) handleChange(e.target.value);
                }}
                className="block w-full text-sm border-transparent focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 focus:bg-white rounded-md bg-transparent px-2 -ml-2 transition-all"
                placeholder="Empty"
            />
        );
    }

    if (type === 'date') {
        return (
            <input
                type="date"
                value={value || ''}
                onChange={(e) => handleChange(e.target.value)}
                className="block w-full text-sm border-transparent focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 rounded-md bg-transparent px-2 -ml-2 text-gray-600"
            />
        );
    }

    return <span className="text-gray-400 text-xs">{JSON.stringify(value)}</span>;
}

function getColor(colorName?: string) {
    const colors: Record<string, string> = {
        gray: '#6b7280',
        blue: '#2563eb',
        green: '#16a34a',
        yellow: '#d97706',
        red: '#dc2626',
        purple: '#9333ea',
        pink: '#db2777',
    };
    return colors[colorName || 'gray'] || colorName || '#6b7280';
}
