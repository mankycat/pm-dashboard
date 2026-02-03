import { fetchProjects } from './actions';
import ProjectList from './components/ProjectList';
import TaskBoard from './components/TaskBoard';

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const projects = await fetchProjects();
  const projectId = searchParams['projectId'] as string;
  
  // Find active project or default to first one
  const activeProject = projectId 
    ? projects.find(p => p.id === projectId) 
    : projects[0];

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <ProjectList projects={projects} />
      <div className="flex-1 flex flex-col min-w-0">
        {activeProject ? (
          <TaskBoard project={activeProject} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
            Create a project to get started.
          </div>
        )}
      </div>
    </div>
  );
}
