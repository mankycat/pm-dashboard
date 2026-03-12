'use client';

import { useState, useEffect } from 'react';
import { PropertySchema } from '@/lib/data';
import { updatePropertyOptionsAction } from '@/app/actions';
import { Dialog } from '@headlessui/react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';

const COLORS = [
    { name: 'gray', label: 'Gray' },
    { name: 'blue', label: 'Blue' },
    { name: 'green', label: 'Green' },
    { name: 'yellow', label: 'Yellow' },
    { name: 'red', label: 'Red' },
    { name: 'purple', label: 'Purple' },
    { name: 'pink', label: 'Pink' },
];

export default function PropertyOptionsEditor({
    databaseId,
    property,
    isOpen,
    onClose
}: {
    databaseId: string;
    property: PropertySchema;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [options, setOptions] = useState(property.options || []);

    useEffect(() => {
        if (isOpen) {
            setOptions(property.options || []);
        }
    }, [isOpen, property]);

    if (!isOpen) return null;

    const handleAddOption = () => {
        const newOption = {
            id: `opt-${Math.random().toString(36).substring(7)}`,
            name: 'New Option',
            color: 'gray'
        };
        setOptions([...options, newOption]);
    };

    const handleUpdateOption = (id: string, updates: any) => {
        setOptions(options.map(opt => opt.id === id ? { ...opt, ...updates } : opt));
    };

    const handleRemoveOption = (id: string) => {
        setOptions(options.filter(opt => opt.id !== id));
    };

    const handleSave = async () => {
        await updatePropertyOptionsAction(databaseId, property.id, options);
        onClose();
    };

    return (
        <Dialog as="div" className="relative z-[100]" open={isOpen} onClose={onClose}>
            <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white shadow-2xl p-6 w-full transform transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                            Edit Options
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-1 rounded-md hover:bg-gray-100 transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100 font-medium">
                        Property: <span className="text-gray-900 font-bold">{property.name}</span>
                    </div>

                    <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                        {options.map((opt, index) => (
                            <div key={opt.id} className="flex items-center gap-2 group">
                                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab opacity-50 hover:opacity-100" />
                                <input
                                    type="text"
                                    value={opt.name}
                                    onChange={(e) => handleUpdateOption(opt.id, { name: e.target.value })}
                                    className="flex-1 rounded border-gray-200 text-sm py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <select
                                    value={opt.color || 'gray'}
                                    onChange={(e) => handleUpdateOption(opt.id, { color: e.target.value })}
                                    className="rounded border-gray-200 text-sm py-1.5 w-24 text-gray-700 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    {COLORS.map(c => (
                                        <option key={c.name} value={c.name}>{c.label}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleRemoveOption(opt.id)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-all"
                                    title="Delete Option"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                        <button
                            onClick={handleAddOption}
                            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 -ml-2 rounded-md transition"
                        >
                            <Plus className="w-4 h-4" />
                            Add Option
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
