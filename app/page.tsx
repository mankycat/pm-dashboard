import { fetchDatabases, fetchPages } from './actions';
import DatabaseList from './components/DatabaseList';
import DatabasePage from './components/DatabasePage';
import { Database, Page } from '@/lib/data';
import { Activity, CheckCircle2, Clock, LayoutGrid, List, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const databases = await fetchDatabases();
  const params = await searchParams;
  const databaseId = params['databaseId'] as string;

  // Find active database
  const activeDatabase = databaseId
    ? databases.find(db => db.id === databaseId)
    : undefined;

  let pages: Page[] = [];
  if (activeDatabase) {
    pages = await fetchPages(activeDatabase.id);
  }

  // Dashboard Stats Logic
  let allPages: { db: Database; pages: Page[] }[] = [];
  if (!activeDatabase) {
    // Fetch all data for dashboard
    allPages = await Promise.all(
      databases.map(async (db) => ({
        db,
        pages: await fetchPages(db.id),
      }))
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <DatabaseList databases={databases} />
      <div className="flex-1 flex flex-col min-w-0 bg-white/50 relative">
        {activeDatabase ? (
          <DatabasePage database={activeDatabase} pages={pages} />
        ) : (
          <DashboardOverview allData={allPages} />
        )}
      </div>
    </div>
  );
}

function DashboardOverview({ allData }: { allData: { db: Database; pages: Page[] }[] }) {
  // Compute Stats
  const projectsDb = allData.find(d => d.db.name === 'Projects');
  const tasksDb = allData.find(d => d.db.name === 'Tasks');

  const totalProjects = projectsDb?.pages.length || 0;
  const totalTasks = tasksDb?.pages.length || 0;

  // Active Tasks (Status != Done)
  // Assuming 'opt-done' is the done option id, or name 'Done'
  const activeTasks = tasksDb?.pages.filter(p => {
    const statusProp = tasksDb.db.schema.find(s => s.name === 'Status');
    const statusVal = statusProp ? p.properties[statusProp.id] : undefined;
    return statusVal !== 'opt-done';
  }) || [];

  // Upcoming Deadlines (Due within 7 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const upcomingDeadlines = tasksDb?.pages.filter(p => {
    const statusProp = tasksDb.db.schema.find(s => s.name === 'Status');
    const statusVal = statusProp ? p.properties[statusProp.id] : undefined;
    if (statusVal === 'opt-done') return false;

    let dateProp = tasksDb.db.schema.find(s => s.type === 'date' && s.name.includes('Due'));
    if (!dateProp) {
      dateProp = tasksDb.db.schema.find(s => s.type === 'date');
    }
    if (!dateProp) return false;

    const dateStr = p.properties[dateProp.id];
    if (!dateStr || typeof dateStr !== 'string') return false;

    // Handle both YYYY-MM-DD and YYYY/MM/DD formats securely in local time
    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) return false;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    const date = new Date(year, month, day);
    return date >= today && date <= nextWeek;
  }).length || 0;

  // Recent Activity (Sort by updatedAt)
  const allItems = allData.flatMap(d => d.pages.map(p => ({ ...p, dbName: d.db.name })));
  const recentItems = allItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return (
    <div className="h-full overflow-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Active Projects"
          value={totalProjects}
          icon={<LayoutGrid className="w-5 h-5 text-indigo-600" />}
          trend="+1 this week"
        />
        <StatCard
          title="Pending Tasks"
          value={activeTasks.length}
          icon={<CheckCircle2 className="w-5 h-5 text-orange-500" />}
          trend={`${totalTasks - activeTasks.length} completed`}
        />
        <StatCard
          title="Upcoming Deadlines"
          value={upcomingDeadlines}
          icon={<Clock className="w-5 h-5 text-red-500" />}
          trend="Next 7 days"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-white/40 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.dbName === 'Projects' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-500">Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600 group-hover:bg-white transition-colors">
                  {item.dbName}
                </span>
              </div>
            ))}
            {recentItems.length === 0 && <p className="text-sm text-gray-500">No activity yet.</p>}
          </div>
        </div>

        {/* Quick Actions / Getting Started */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
            <p className="text-indigo-100 text-sm mb-6 max-w-sm">
              Ready to get to work? Create a new project or task to track your progress.
            </p>
            <div className="flex gap-3">
              <Link
                href="/?databaseId=db-projects"
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Project
              </Link>
              <Link
                href="/?databaseId=db-tasks"
                className="bg-indigo-700/50 hover:bg-indigo-700/70 text-white px-4 py-2 rounded-lg text-sm font-medium border border-indigo-400/30 transition-colors"
              >
                View Tasks
              </Link>
            </div>
          </div>
          {/* Decoration */}
          <div className="absolute -bottom-10 -right-10 text-white/10">
            <List className="w-48 h-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: number, icon: any, trend: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <h2 className="text-3xl font-bold text-gray-800">{value}</h2>
        <span className="text-xs text-gray-400 mb-1.5 font-medium">{trend}</span>
      </div>
    </div>
  );
}
