'use client';

import { Database, Page } from '@/lib/data';
import { updatePageTitle, updatePageProperty, updatePageContent, deletePageAction } from '@/app/actions';
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Trash2, Calendar, Tag, CheckCircle2, User, AlignLeft, List, Type } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function ItemDetailModal({
    database,
    page,
    isOpen,
    onClose
}: {
    database: Database;
    page?: Page;
    isOpen: boolean;
    onClose: () => void;
}) {
    const router = useRouter();
    const [title, setTitle] = useState(page?.title || '');
    const [content, setContent] = useState(page?.content || '');
    const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');

    // Sync state when page changes
    useEffect(() => {
        if (page) {
            setTitle(page.title);
            setContent(page.content || '');
        }
    }, [page]);

    if (!page) return null;

    const handleTitleBlur = async () => {
        if (title !== page.title) {
            await updatePageTitle(database.id, page.id, title);
        }
    };

    const handleContentBlur = async () => {
        if (content !== (page.content || '')) {
            await updatePageContent(database.id, page.id, content);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this item?')) {
            await deletePageAction(database.id, page.id);
            onClose();
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/20 transition-opacity backdrop-blur-md" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300 sm:duration-500"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300 sm:duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl">

                                        {/* Header / Banner area could go here */}
                                        <div className="px-4 py-6 sm:px-6 border-b border-gray-100 flex justify-between items-start">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    onBlur={handleTitleBlur}
                                                    className="block w-full text-3xl font-bold text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-300"
                                                    placeholder="Untitled"
                                                />
                                            </div>
                                            <div className="ml-3 flex h-7 items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="rounded-md bg-white text-gray-400 hover:text-red-500 focus:outline-none"
                                                    onClick={handleDelete}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                                    onClick={onClose}
                                                >
                                                    <span className="sr-only">Close panel</span>
                                                    <X className="h-6 w-6" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Properties Grid */}
                                        <div className="px-4 py-4 sm:px-6 space-y-4 border-b border-gray-100 bg-gray-50/30">
                                            {database.schema.map(prop => (
                                                <div key={prop.id} className="flex items-center">
                                                    <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                                                        {getIconForType(prop.type)}
                                                        <span>{prop.name}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <PropertyInput
                                                            databaseId={database.id}
                                                            pageId={page.id}
                                                            property={prop}
                                                            value={page.properties[prop.id]}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Content Area */}
                                        <div className="relative flex-1 px-4 py-6 sm:px-6 flex flex-col min-h-[400px]">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <AlignLeft className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Description</span>
                                                </div>
                                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                                    <button
                                                        onClick={() => setEditorMode('write')}
                                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${editorMode === 'write' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        Write
                                                    </button>
                                                    <button
                                                        onClick={() => setEditorMode('preview')}
                                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${editorMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        Preview
                                                    </button>
                                                </div>
                                            </div>

                                            {editorMode === 'write' ? (
                                                <textarea
                                                    className="w-full flex-1 resize-none border-0 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-gray-700 leading-relaxed transition-all font-mono text-sm"
                                                    placeholder="Add a description... (Markdown supported)"
                                                    value={content}
                                                    onChange={(e) => setContent(e.target.value)}
                                                    onBlur={handleContentBlur}
                                                />
                                            ) : (
                                                <div className="w-full flex-1 prose prose-sm max-w-none text-gray-700 p-4 border border-transparent">
                                                    {content ? (
                                                        <ReactMarkdown>{content}</ReactMarkdown>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No description provided.</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

function getIconForType(type: string) {
    switch (type) {
        case 'status': return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
        case 'date': return <Calendar className="w-4 h-4 text-gray-400" />;
        case 'person': return <User className="w-4 h-4 text-gray-400" />;
        case 'select': return <List className="w-4 h-4 text-gray-400" />;
        case 'multi-select': return <Tag className="w-4 h-4 text-gray-400" />;
        default: return <Type className="w-4 h-4 text-gray-400" />;
    }
}

function PropertyInput({ databaseId, pageId, property, value }: { databaseId: string, pageId: string, property: any, value: any }) {
    const handleChange = async (newValue: any) => {
        await updatePageProperty(databaseId, pageId, property.id, newValue);
    };

    if (property.type === 'status' || property.type === 'select') {
        const selectedOption = property.options?.find((o: any) => o.id === value);
        return (
            <select
                value={value || ''}
                onChange={(e) => handleChange(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-transparent"
                style={{
                    color: selectedOption ? getColor(selectedOption.color) : 'inherit',
                    fontWeight: selectedOption ? 600 : 400
                }}
            >
                <option value="">Empty</option>
                {property.options?.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.name}
                    </option>
                ))}
            </select>
        );
    }

    if (property.type === 'multi-select') {
        // Basic implementation for multi-select: just a text input for now or single select disguised?
        // Implementing a real multi-select dropdown is complex without a library like Headless UI ComboBox/Listbox.
        // For now, let's treat it as a single Select but assuming array.
        // Actually, let's use a native multiple select for simplicity validation first? No that's ugly.
        // Let's just create a row of badges that are clickable to remove, and a '+' add button.
        // SIMPLIFICATION: Treat as Token Input (comma separated) or just Single Select for MVP of this field type, 
        // OR use a simple checkbox list dropdown.

        // Let's implement a simple Checkbox Group for MVP
        const selectedIds: string[] = Array.isArray(value) ? value : [];
        return (
            <div className="flex flex-wrap gap-2">
                {property.options?.map((opt: any) => {
                    const isSelected = selectedIds.includes(opt.id);
                    // Map simple colors to tailwind classes safely or use style
                    const color = opt.color || 'gray';
                    // We can use a helper or just inline styles for safety if classes aren't reliable
                    return (
                        <button
                            key={opt.id}
                            onClick={() => {
                                const newIds = isSelected
                                    ? selectedIds.filter(id => id !== opt.id)
                                    : [...selectedIds, opt.id];
                                handleChange(newIds);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${isSelected
                                ? `bg-indigo-50 text-indigo-700 border-indigo-200`
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                            style={isSelected ? {
                                backgroundColor: `${getColor(color)}20`,
                                color: getColor(color),
                                borderColor: `${getColor(color)}40`
                            } : {}}
                        >
                            {isSelected && <CheckCircle2 className="w-3 h-3" />}
                            {opt.name}
                        </button>
                    );
                })}
            </div>
        );
    }

    if (property.type === 'date') {
        return (
            <input
                type="date"
                value={value || ''}
                onChange={(e) => handleChange(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-transparent"
            />
        );
    }

    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-transparent"
        />
    );
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
