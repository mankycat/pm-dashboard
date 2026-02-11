import { fetchDatabases, fetchPages } from './actions';
import DatabaseList from './components/DatabaseList';
import DatabasePage from './components/DatabasePage';
import { Database, Page } from '@/lib/data';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const databases = await fetchDatabases();
  const params = await searchParams;
  const databaseId = params['databaseId'] as string;

  // Find active database or default to specific one if needed
  const activeDatabase = databaseId
    ? databases.find(db => db.id === databaseId)
    : undefined;

  let pages: Page[] = [];
  if (activeDatabase) {
    pages = await fetchPages(activeDatabase.id);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <DatabaseList databases={databases} />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeDatabase ? (
          <DatabasePage database={activeDatabase} pages={pages} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
            <h2 className="text-xl font-semibold mb-2">Welcome to PM Dashboard V2</h2>
            <p>Select a database from the sidebar to view items.</p>
          </div>
        )}
      </div>
    </div>
  );
}
