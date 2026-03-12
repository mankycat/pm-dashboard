'use client';

import { Database, PropertySchema } from '@/lib/data';
import { useState, useRef, useEffect } from 'react';
import { Filter, Plus, X, ChevronDown } from 'lucide-react';

export type FilterOperator = 'is' | 'is_not' | 'contains' | 'is_empty' | 'is_not_empty';

export interface FilterRule {
    id: string;
    propertyId: string;
    operator: FilterOperator;
    value: string;
}

interface FilterBarProps {
    database: Database;
    filters: FilterRule[];
    onFiltersChange: (newFilters: FilterRule[]) => void;
}

const OPERATORS: { value: FilterOperator; label: string; types: string[] }[] = [
    { value: 'is', label: 'Is', types: ['text', 'select', 'status', 'multi-select', 'date'] },
    { value: 'is_not', label: 'Is not', types: ['text', 'select', 'status', 'multi-select', 'date'] },
    { value: 'contains', label: 'Contains', types: ['text', 'multi-select'] },
    { value: 'is_empty', label: 'Is empty', types: ['text', 'select', 'status', 'multi-select', 'date'] },
    { value: 'is_not_empty', label: 'Is not empty', types: ['text', 'select', 'status', 'multi-select', 'date'] }
];

export default function FilterBar({ database, filters, onFiltersChange }: FilterBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddFilter = () => {
        const firstProp = database.schema[0];
        const newRule: FilterRule = {
            id: Math.random().toString(36).substring(7),
            propertyId: firstProp.id,
            operator: 'is',
            value: ''
        };
        onFiltersChange([...filters, newRule]);
    };

    const handleUpdateFilter = (id: string, updates: Partial<FilterRule>) => {
        onFiltersChange(filters.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleRemoveFilter = (id: string) => {
        onFiltersChange(filters.filter(f => f.id !== id));
    };

    const getAvailableOperators = (propId: string) => {
        const prop = database.schema.find(p => p.id === propId);
        if (!prop) return [];
        return OPERATORS.filter(op => op.types.includes(prop.type));
    };

    const renderValueInput = (rule: FilterRule) => {
        if (rule.operator === 'is_empty' || rule.operator === 'is_not_empty') return null;

        const prop = database.schema.find(p => p.id === rule.propertyId);
        if (!prop) return null;

        if (prop.type === 'select' || prop.type === 'status') {
            return (
                <div className="relative">
                    <select
                        value={rule.value}
                        onChange={(e) => handleUpdateFilter(rule.id, { value: e.target.value })}
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-1.5 pl-3 pr-8 rounded leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">Select option...</option>
                        {prop.options?.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            );
        }

        if (prop.type === 'date') {
             return (
                 <input
                     type="date"
                     value={rule.value}
                     onChange={(e) => handleUpdateFilter(rule.id, { value: e.target.value })}
                     className="w-full bg-white border border-gray-200 text-gray-700 py-1.5 px-3 rounded leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                 />
             );
        }

        return (
            <input
                type="text"
                value={rule.value}
                placeholder="Type a value..."
                className="w-full bg-white border border-gray-200 text-gray-700 py-1.5 px-3 rounded leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                onChange={(e) => handleUpdateFilter(rule.id, { value: e.target.value })}
            />
        );
    };

    return (
        <div className="relative" ref={popoverRef}>
             <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filters.length > 0 || isOpen ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                }`}
            >
                <Filter className="w-4 h-4" />
                Filter {filters.length > 0 && <span className="bg-indigo-100 text-indigo-800 text-xs py-0.5 px-1.5 rounded-full">{filters.length}</span>}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[500px] bg-white rounded-lg shadow-xl border border-gray-100 z-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800 text-sm">Filters</h3>
                    </div>

                    {filters.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-500">
                            No filters applied to this view.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 mb-4">
                            {filters.map((rule, index) => (
                                <div key={rule.id} className="flex items-center gap-2">
                                     {index === 0 ? <span className="text-xs font-semibold text-gray-400 w-10 shrink-0">Where</span> : <span className="text-xs font-semibold text-gray-400 w-10 shrink-0">And</span>}
                                    
                                    {/* Property Select */}
                                    <div className="relative w-1/3">
                                        <select
                                            value={rule.propertyId}
                                            onChange={(e) => {
                                                const newPropId = e.target.value;
                                                const newOps = getAvailableOperators(newPropId);
                                                handleUpdateFilter(rule.id, { 
                                                    propertyId: newPropId, 
                                                    operator: newOps[0]?.value || 'is',
                                                    value: '' // Reset value on prop change
                                                });
                                            }}
                                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1.5 pl-3 pr-8 rounded leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                        >
                                            {database.schema.map(prop => (
                                                <option key={prop.id} value={prop.id}>{prop.name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Operator Select */}
                                    <div className="relative w-1/4">
                                        <select
                                            value={rule.operator}
                                            onChange={(e) => handleUpdateFilter(rule.id, { operator: e.target.value as FilterOperator })}
                                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1.5 pl-3 pr-8 rounded leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                        >
                                            {getAvailableOperators(rule.propertyId).map(op => (
                                                <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Value Input */}
                                    <div className="w-1/3">
                                        {renderValueInput(rule)}
                                    </div>

                                    {/* Remove button */}
                                    <button 
                                        onClick={() => handleRemoveFilter(rule.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleAddFilter}
                        className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add filter
                    </button>
                </div>
            )}
        </div>
    );
}
