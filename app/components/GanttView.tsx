'use client';

import { Task } from '@/lib/data';

export default function GanttView({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return <div className="p-8 text-center text-gray-400">No tasks to display.</div>;

  // Find min start and max end
  const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Add buffer
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 5);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(minDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="min-w-[800px]">
        {/* Timeline Header */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-48 p-3 text-xs font-bold text-gray-500 sticky left-0 bg-gray-50 border-r border-gray-200 z-10">
            Task Name
          </div>
          <div className="flex-1 flex">
            {daysArray.map((date, i) => (
              <div key={i} className="flex-shrink-0 w-10 border-r border-gray-100 p-2 text-[10px] text-center text-gray-400">
                <div className="font-bold text-gray-600">{date.getDate()}</div>
                <div>{date.toLocaleDateString('en-US', { month: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Rows */}
        <div className="divide-y divide-gray-100">
          {tasks.map((task) => {
            const start = new Date(task.startDate);
            const end = new Date(task.endDate);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1; // inclusive
            const offset = (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
            
            return (
              <div key={task.id} className="flex hover:bg-blue-50/30 transition-colors group">
                <div className="w-48 p-3 text-sm font-medium text-gray-700 sticky left-0 bg-white group-hover:bg-blue-50/30 border-r border-gray-200 z-10 truncate">
                  {task.title}
                </div>
                <div className="flex-1 relative h-12">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {daysArray.map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-10 border-r border-gray-100 h-full" />
                    ))}
                  </div>
                  
                  {/* Task Bar */}
                  <div 
                    className={`absolute top-2 h-8 rounded shadow-sm flex items-center px-2 text-xs text-white overflow-hidden whitespace-nowrap transition-all
                      ${task.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}
                    `}
                    style={{
                      left: `${offset * 40}px`, // 40px per day (w-10)
                      width: `${duration * 40}px`
                    }}
                  >
                    {task.progress}%
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
