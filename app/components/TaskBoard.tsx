'use client';

import { Project, Task } from '@/lib/data';
import { createTask, updateTaskStatus } from '@/app/actions';

export default function TaskBoard({ project }: { project: Project }) {
  if (!project) return <div className="p-10 text-gray-500">Select a project to start.</div>;

  return (
    <div className="flex-1 h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{project.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{project.description}</p>
        </div>
        <div className="text-sm font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">
          {project.status.toUpperCase()}
        </div>
      </header>

      {/* Task List */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Task Name</th>
                <th className="px-6 py-3">Timeline</th>
                <th className="px-6 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {project.tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <StatusCheckbox projectId={project.id} task={task} />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {task.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {task.startDate} → {task.endDate}
                  </td>
                  <td className="px-6 py-4 w-32">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {project.tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No tasks yet. Add one below!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Task Form */}
        <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Add New Task</h3>
          <form action={createTask.bind(null, project.id)} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Task Title</label>
              <input name="title" className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" placeholder="e.g. Design Database" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input type="date" name="startDate" className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input type="date" name="endDate" className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm" required />
            </div>
            <button type="submit" className="bg-gray-900 text-white px-5 py-2 rounded hover:bg-black transition-colors text-sm font-medium">
              Create Task
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function StatusCheckbox({ projectId, task }: { projectId: string, task: Task }) {
  return (
    <button
      onClick={() => updateTaskStatus(projectId, task.id, task.status === 'done' ? 'todo' : 'done')}
      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
        task.status === 'done' 
          ? 'bg-blue-500 border-blue-500 text-white' 
          : 'border-gray-300 hover:border-blue-400'
      }`}
    >
      {task.status === 'done' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
    </button>
  );
}
