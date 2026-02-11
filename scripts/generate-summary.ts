import { getDatabases, getPages } from '../lib/data';
import fs from 'fs/promises';
import path from 'path';

async function generateSummary() {
    console.log("Generating Daily Summary...");

    // 1. Get Data
    const databases = await getDatabases();
    const tasksDb = databases.find(db => db.name === 'Tasks');

    if (!tasksDb) {
        console.error("Tasks database not found!");
        return;
    }

    const tasks = await getPages(tasksDb.id);

    // 2. Filter & Group
    const activeTasks = tasks.filter(t => {
        const statusProp = tasksDb.schema.find(p => p.name === 'Status')?.id;
        if (!statusProp) return true; // Keep if no status prop

        const statusVal = t.properties[statusProp];
        // Assuming 'opt-done' is the ID for Done. 
        // A more robust way is to find the option with name "Done".
        /* 
          In our current schema:
          opt-todo = To Do
          opt-doing = In Progress
          opt-done = Done
        */
        return statusVal !== 'opt-done';
    });

    // 3. Generate Markdown
    const date = new Date().toISOString().split('T')[0];
    let report = `# Daily Summary - ${date}\n\n`;
    report += `**Active Tasks**: ${activeTasks.length}\n\n`;

    if (activeTasks.length === 0) {
        report += "No active tasks. Great job!\n";
    } else {
        report += "| Task | Status | Due Date |\n";
        report += "| :--- | :--- | :--- |\n";

        // Helper to get readable status
        const getStatusName = (val: string) => {
            const prop = tasksDb.schema.find(p => p.name === 'Status');
            const opt = prop?.options?.find(o => o.id === val);
            return opt ? opt.name : val || 'Empty';
        };

        // Helper to get due date
        const getDueDate = (props: any) => {
            const prop = tasksDb.schema.find(p => p.name === 'Due Date');
            return prop ? (props[prop.id] || '-') : '-';
        };

        for (const task of activeTasks) {
            report += `| ${task.title} | ${getStatusName(task.properties[tasksDb.schema.find(p => p.name === 'Status')?.id!])} | ${getDueDate(task.properties)} |\n`;
        }
    }

    // 4. Save Report
    const reportPath = path.join(process.cwd(), 'daily-summary.md');
    await fs.writeFile(reportPath, report);
    console.log(`Report saved to ${reportPath}`);
}

// Execute
generateSummary().catch(console.error);
