// csv export logic
import { getLogs, formatDuration } from './logs.js';
import { getProjectById } from './projects.js';

export const exportToCSV = () => {
    const logs = getLogs();
    if (logs.length === 0) {
        swal("Empty", "No data to export", "info");
        return;
    }

    const headers = "Date,Project,Task,Duration,Notes\n";
    const rows = logs.map(log => {
        const p = getProjectById(log.projectId);
        const pName = p ? p.name.replace(/"/g, '""') : 'Unknown';
        const tName = log.taskName.replace(/"/g, '""');
        const notes = (log.notes || '').replace(/"/g, '""');
        const date = new Date(log.startTime).toLocaleDateString();
        const dur = formatDuration(log.durationSeconds);
        return `"${date}","${pName}","${tName}","${dur}","${notes}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `time_logs_${new Date().toISOString().slice(0,10)}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
