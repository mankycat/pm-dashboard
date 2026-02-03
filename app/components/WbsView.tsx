'use client';

import { Project, Task } from '@/lib/data';

export default function WbsView({ project }: { project: Project }) {
  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <div className="flex flex-col items-center">
        {/* Root Node (Project) */}
        <div className="border-2 border-gray-800 bg-gray-900 text-white px-6 py-3 rounded-lg font-bold shadow-md z-10">
          {project.name}
        </div>
        
        {/* Vertical Connector */}
        <div className="h-8 w-0.5 bg-gray-300"></div>
        
        {/* Horizontal Connector Bar */}
        {project.tasks.length > 0 && (
          <div className="w-[90%] border-t-2 border-gray-300 h-4 relative">
            {/* Ticks for each child - simplified visual */}
          </div>
        )}

        {/* Task Nodes */}
        <div className="flex gap-4 justify-center w-full">
          {project.tasks.map((task) => (
            <div key={task.id} className="flex flex-col items-center">
              {/* Connector from horizontal bar */}
              <div className="h-4 w-0.5 bg-gray-300 -mt-4"></div>
              
              {/* Node Card */}
              <div className={`
                w-48 p-3 rounded border-l-4 shadow-sm bg-gray-50 text-sm transition-transform hover:-translate-y-1 hover:shadow-md
                ${task.status === 'done' ? 'border-green-500' : 'border-blue-500'}
              `}>
                <div className="font-bold text-gray-700 mb-1 truncate" title={task.title}>
                  {task.title}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{task.endDate}</span>
                  <span className={task.status === 'done' ? 'text-green-600' : 'text-blue-600'}>
                    {task.progress}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {project.tasks.length === 0 && (
          <div className="text-gray-400 text-sm mt-4">Add tasks to see WBS structure</div>
        )}
      </div>
    </div>
  );
}
