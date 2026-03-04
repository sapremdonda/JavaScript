// app.js
import { createStore } from './store.js';
import { tasksModule, localStoragePlugin, loggerMiddleware } from './tasksModule.js';
import { debounce } from './utils.js';

// 1. Initialize the store with plugins and middleware
const store = createStore({
    ...tasksModule,
    plugins: [localStoragePlugin],
    middlewares: [loggerMiddleware]
});

// 2. Grab DOM elements
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const titleError = document.getElementById('title-error');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

// 3. Handle form submission and inline errors
form.addEventListener('submit', (e) => {
    e.preventDefault();
    titleError.textContent = ''; 

    const title = titleInput.value.trim();
    if (!title) {
        titleError.textContent = 'Please provide a task title.'; 
        return;
    }

    const task = {
        title,
        priority: document.getElementById('task-priority').value,
        status: 'pending'
    };

    store.commit('ADD_TASK', task); 
    titleInput.value = '';
    
    Swal.fire({ icon: 'success', title: 'Task Added', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
});

// 4. Search and sort listeners
searchInput.addEventListener('input', debounce((e) => {
    store.commit('SET_SEARCH_QUERY', e.target.value);
}, 300));

sortSelect.addEventListener('change', (e) => {
    store.commit('SET_SORT_BY', e.target.value);
});

// 5. Global functions for UI buttons (Delete and Edit)
window.deleteTask = function(id) {
    Swal.fire({
        title: 'Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) store.commit('DELETE_TASK', id);
    });
};

window.editTask = async function(id) {
    const task = store.state.tasks.find(t => t.id === id);
    if (!task) return;

    const { value: formValues } = await Swal.fire({
        title: 'Edit Task',
        html: `
            <input id="swal-input1" class="swal2-input" value="${task.title}">
            <select id="swal-input2" class="swal2-input">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High Priority</option>
            </select>
        `,
        focusConfirm: false,
        preConfirm: () => {
            const newTitle = document.getElementById('swal-input1').value.trim();
            if(!newTitle) { Swal.showValidationMessage('Title is required'); return false; }
            return {
                title: newTitle,
                priority: document.getElementById('swal-input2').value
            };
        }
    });

    if (formValues) {
        store.commit('EDIT_TASK', { id, ...formValues });
        Swal.fire({ icon: 'success', title: 'Task Updated', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    }
};

// 6. Time travel controls
document.getElementById('undo-btn').addEventListener('click', () => store.undo());
document.getElementById('redo-btn').addEventListener('click', () => store.redo());

// 7. Subscribe to store changes to render the UI
store.subscribe(() => {
    // Update dashboard statistics 
    document.getElementById('dashboard-stats').innerHTML = `
        <span>Total: ${store.getters.totalTasks}</span> | 
        <span>Completed: ${store.getters.completedTasks}</span> | 
        <span>Pending: ${store.getters.pendingTasks}</span>
    `;

    // Clear current lists
    document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');

    // Render tasks based on getters
    store.getters.filteredAndSortedTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card priority-${task.priority}`;
        taskEl.draggable = true;
        taskEl.innerHTML = `
            <strong>${task.title}</strong>
            <div class="task-actions">
                <button onclick="editTask('${task.id}')" class="btn-edit"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteTask('${task.id}')" class="btn-delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        
        taskEl.addEventListener('dragstart', (e) => e.dataTransfer.setData('taskId', task.id));

        const column = document.getElementById(`col-${task.status}`);
        if(column) column.querySelector('.task-list').appendChild(taskEl);
    });
});

// 8. Drag and drop mechanics for the columns
document.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', e => e.preventDefault());
    col.addEventListener('drop', e => {
        const taskId = e.dataTransfer.getData('taskId');
        const newStatus = col.getAttribute('data-status');
        store.commit('UPDATE_TASK_STATUS', { taskId, status: newStatus }); 
    });
});

// 9. Theme toggle logic
const themeStylesheet = document.getElementById('theme-stylesheet');
const themeToggleBtn = document.getElementById('theme-toggle');

const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const isLight = themeStylesheet.getAttribute('href').includes('light');
    setTheme(isLight ? 'dark' : 'light');
});

function setTheme(theme) {
    if (theme === 'dark') {
        themeStylesheet.setAttribute('href', 'dark-style.css');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        themeStylesheet.setAttribute('href', 'light-style.css');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
}

// 10. JSON export and import
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// Export current state
exportBtn.addEventListener('click', () => {
    const tasks = store.state.tasks;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "task_manager_backup.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    Swal.fire({ icon: 'success', title: 'Exported Successfully', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
});

// Trigger hidden file input
importBtn.addEventListener('click', () => importFile.click());

// Handle file read
importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedTasks = JSON.parse(e.target.result);
            if (Array.isArray(importedTasks)) {
                store.commit('SET_TASKS', importedTasks);
                Swal.fire({ icon: 'success', title: 'Imported Successfully', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            } else {
                throw new Error("Invalid format");
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Import Failed', text: 'Make sure you uploaded a valid JSON file.' });
        }
        importFile.value = ''; // Reset input
    };
    reader.readAsText(file);
});

// 11. Fetch initial data on load
store.dispatch('fetchTasks');