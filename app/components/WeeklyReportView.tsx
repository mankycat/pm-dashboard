'use client';

import { Database, Page } from '@/lib/data';
import { CalendarDays, Copy, CheckCircle2, Save, History, Loader2, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { createPage, deletePageAction } from '../actions';

export default function WeeklyReportView({ allData, activeProject }: { allData: { db: Database; pages: Page[] }[], activeProject?: Page }) {
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<'generate' | 'history'>('generate');

    const tasksDb = allData.find(d => d.db.id === 'db-tasks' || d.db.name === 'Tasks');
    const issuesDb = allData.find(d => d.db.id === 'db-issues' || d.db.name === 'Issue Tracker');
    const reportsDb = allData.find(d => d.db.id === 'db-reports');

    let tasks = tasksDb?.pages || [];
    let issues = issuesDb?.pages || [];
    let historicalReports = reportsDb?.pages || [];

    if (activeProject) {
        tasks = tasks.filter(t => {
            const p = tasksDb?.db.schema.find(s => s.name === 'Project ID' || s.name === 'Project');
            return p && t.properties[p.id] === activeProject.id;
        });
        issues = issues.filter(t => {
            const p = issuesDb?.db.schema.find(s => s.name === 'Project ID' || s.name === 'Project');
            return p && t.properties[p.id] === activeProject.id;
        });
        historicalReports = historicalReports.filter(t => {
            const p = reportsDb?.db.schema.find(s => s.name === 'Project ID' || s.name === 'Project');
            return p && t.properties[p.id] === activeProject.id;
        });
    }

    historicalReports = [...historicalReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const nextThreeWeeks = new Date(today);
    nextThreeWeeks.setDate(today.getDate() + 21);

    // Helpers to parse dates safely
    const parseDateLocal = (str?: string | number | string[]) => {
        if (!str || typeof str !== 'string') return null;
        const parts = str.split(/[-/]/);
        if (parts.length !== 3) return null;
        const [y, m, d] = parts.map(Number);
        return new Date(y, m - 1, d);
    };

    const getStatusVal = (page: Page, db: Database) => {
        const statusProp = db.schema.find(s => s.type === 'status');
        if (!statusProp) return null;
        const val = page.properties[statusProp.id];
        const opt = statusProp.options?.find(o => o.id === val);
        return opt ? opt.name : val;
    };

    const isDone = (page: Page, db: Database) => {
        const val = getStatusVal(page, db);
        return val === 'Done' || val === 'Closed';
    };

    // 1. Last week completed items
    const lastWeekCompleted = tasks.filter(task => {
        if (!isDone(task, tasksDb!.db)) return false;
        // Check updated at or due date
        const dateProp = tasksDb?.db.schema.find(s => s.name.includes('Due'));
        const dateStr = dateProp ? task.properties[dateProp.id] : null;
        const date = parseDateLocal(dateStr);
        if (date) {
            return date >= oneWeekAgo && date <= today;
        }
        // Fallback to updated Date
        const updated = new Date(task.updatedAt);
        return updated >= oneWeekAgo && updated <= today;
    });

    // 2. This week's ongoing items
    const thisWeekItems = tasks.filter(task => {
        if (isDone(task, tasksDb!.db)) return false;
        
        // Items that are touching this week
        const startProp = tasksDb?.db.schema.find(s => s.name.includes('Start'));
        const dueProp = tasksDb?.db.schema.find(s => s.name.includes('Due') || s.name.includes('End'));
        
        const start = parseDateLocal(startProp ? task.properties[startProp.id] : null);
        const end = parseDateLocal(dueProp ? task.properties[dueProp.id] : null);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        // If it starts before next week and (ends after today or has no end)
        if (start && start < nextWeek) {
            if (!end) return true;
            if (end >= today) return true;
        }
        
        // Include items with no dates but 'In Progress'
        const status = getStatusVal(task, tasksDb!.db);
        if (!start && !end && (status === 'In Progress' || status === 'opt-doing')) return true;

        return false;
    });

    // 3. Next 3 Weeks 
    const nextThreeWeeksItems = tasks.filter(task => {
        if (isDone(task, tasksDb!.db)) return false;
        
        const startProp = tasksDb?.db.schema.find(s => s.name.includes('Start'));
        const start = parseDateLocal(startProp ? task.properties[startProp.id] : null);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        if (start && start >= nextWeek && start <= nextThreeWeeks) {
            return true;
        }

        // Include due soon things
        const dueProp = tasksDb?.db.schema.find(s => s.name.includes('Due') || s.name.includes('End'));
        const end = parseDateLocal(dueProp ? task.properties[dueProp.id] : null);

        if (end && end >= nextWeek && end <= nextThreeWeeks) {
            return true;
        }

        return false;
    });

    // 4. Issues tracking
    const activeIssues = issues.filter(issue => {
        return !isDone(issue, issuesDb!.db);
    });

    const reportMarkdown = `
# Weekly Summary (${oneWeekAgo.toLocaleDateString()} - ${today.toLocaleDateString()})

## 上週執行事項 (Last Week Completed)
${lastWeekCompleted.length > 0 ? lastWeekCompleted.map((t, i) => `${i + 1}. **${t.title}** - Completed.`).join('\n') : '無'}

## 本週執行事項 (This Week Ongoing)
${thisWeekItems.length > 0 ? thisWeekItems.map((t, i) => {
    const dueProp = tasksDb?.db.schema.find(s => s.name.includes('Due') || s.name.includes('End'));
    const noteProp = tasksDb?.db.schema.find(s => s.name === 'Note');
    const due = dueProp ? t.properties[dueProp.id] : '';
    const note = noteProp ? t.properties[noteProp.id] : '';
    return `${i + 1}. **${t.title}**${due ? ` (預計 ${due} 完成)` : ''}${note ? ` : ${note}` : ''}`;
}).join('\n') : '無'}

## 未來三週預計安排與異動事項 (Next 3 Weeks Plan)
${nextThreeWeeksItems.length > 0 ? nextThreeWeeksItems.map((t, i) => `${i + 1}. 排程: ${t.title}`).join('\n') : '無'}

## 臨時動議事項追蹤 (Issue Tracking)
${activeIssues.length > 0 ? activeIssues.map((t, i) => {
    const issueDescProp = issuesDb?.db.schema.find(s => s.name === 'Issue');
    const desc = issueDescProp ? t.properties[issueDescProp.id] : '';
    return `${i + 1}. **${t.title}**: ${desc || ''}`;
}).join('\n') : '無'}
`.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(reportMarkdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        if (!reportsDb) return;
        startTransition(async () => {
            const initialProps: Record<string, string> = {};
            const projProp = reportsDb.db.schema.find(s => s.name === 'Project ID' || s.name === 'Project');
            const dateProp = reportsDb.db.schema.find(s => s.name === 'Date Range');

            if (projProp && activeProject) initialProps[projProp.id] = activeProject.id;
            if (dateProp) initialProps[dateProp.id] = `${oneWeekAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`;

            const title = `${activeProject ? activeProject.title : 'Global'} Weekly Summary (${today.toLocaleDateString()})`;
            await createPage('db-reports', title, initialProps, reportMarkdown);
            setViewMode('history');
        });
    };

    return (
        <div className="h-full overflow-auto p-8 bg-slate-50">
            <header className="mb-8 flex justify-between items-end border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <CalendarDays className="w-8 h-8 text-indigo-600" />
                        Weekly Report Generator
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {activeProject 
                            ? `Generating specifically for project: ${activeProject.title}` 
                            : 'Global aggregate across all projects.'}
                    </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg ml-auto mr-4">
                    <button
                        onClick={() => setViewMode('generate')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'generate' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Generator
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <History className="w-4 h-4" /> History ({historicalReports.length})
                    </button>
                </div>
                {viewMode === 'generate' && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleSave}
                            disabled={isPending || !reportsDb}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 font-medium px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Report
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
                        >
                            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                     </div>
                )}
            </header>

            {viewMode === 'generate' ? (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto prose prose-indigo">
                        <pre className="whitespace-pre-wrap font-sans text-gray-800 bg-transparent p-0 m-0 text-sm leading-relaxed">
                            {reportMarkdown}
                        </pre>
                    </div>
                    
                    <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 max-w-4xl mx-auto">
                        <p><strong>Note:</strong> This report is generated dynamically based on the Tasks and Issues databases.</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li><strong>上週執行事項:</strong> Tasks marked as &quot;Done&quot; within the last 7 days.</li>
                            <li><strong>本週執行事項:</strong> Tasks not Done, currently overlapping with this week.</li>
                            <li><strong>未來三週:</strong> Tasks starting or ending within the next 21 days (excluding this week).</li>
                            <li><strong>臨時動議:</strong> Any open items in the Issue Tracker.</li>
                        </ul>
                    </div>
                </>
            ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                    {historicalReports.map(report => (
                        <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this report?')) {
                                            startTransition(async () => {
                                                await deletePageAction('db-reports', report.id);
                                            });
                                        }
                                    }}
                                    disabled={isPending}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                    title="Delete Report"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4 pr-8">{report.title}</h3>
                            <div className="prose prose-sm font-sans text-gray-700 mb-4 whitespace-pre-wrap leading-tight">
                                {report.content}
                            </div>
                            <span className="text-xs text-gray-400">Created: {new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                    ))}
                    {historicalReports.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <FileIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <p>No historical reports found for this project.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    )
}
