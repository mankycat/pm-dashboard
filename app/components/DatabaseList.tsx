'use client';

import { Database } from '@/lib/data';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Layers, Plus } from 'lucide-react';

export default function DatabaseList({
    databases,
}: {
    databases: Database[];
}) {
    const searchParams = useSearchParams();
    const activeId = searchParams.get('databaseId');

    return (
        <div className="w-64 glass border-r border-white/20 h-screen overflow-y-auto flex flex-col pt-6 pb-4 shadow-xl z-20">
            <div className="px-6 mb-8">
                <div className="flex items-center gap-3 text-indigo-700">
                    <Layers className="w-6 h-6" />
                    <h2 className="text-xl font-bold tracking-tight">Workspaces</h2>
                </div>
            </div>

            <div className="px-3 space-y-1">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Databases
                </h3>
                {databases.map(db => {
                    const isActive = activeId === db.id;
                    return (
                        <Link
                            key={db.id}
                            href={`/?databaseId=${db.id}`}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-white/60 text-indigo-700 shadow-sm border border-white/40 backdrop-blur-sm'
                                    : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                                }`}
                        >
                            {db.name.toLowerCase().includes('task') ? (
                                <List className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            ) : (
                                <LayoutGrid className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            )}
                            {db.name}
                        </Link>
                    );
                })}

                <button className="w-full mt-4 flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-indigo-600 transition-colors border border-dashed border-gray-300 hover:border-indigo-300 rounded-lg">
                    <Plus className="w-4 h-4" />
                    <span>Add Database</span>
                </button>
            </div>
        </div>
    );
}
