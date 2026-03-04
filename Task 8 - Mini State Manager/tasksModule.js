// tasksModule.js
import { generateUUID } from './utils.js';

export const tasksModule = {
    state: {
        tasks: [],
        searchQuery: '',
        sortBy: 'createdAt' // 'createdAt' or 'priority'
    },
    
    mutations: {
        ADD_TASK(state, task) {
            state.tasks.push({ ...task, id: generateUUID(), createdAt: new Date().getTime() });
        },
        EDIT_TASK(state, updatedTask) {
            const index = state.tasks.findIndex(t => t.id === updatedTask.id);
            if (index !== -1) state.tasks[index] = { ...state.tasks[index], ...updatedTask };
        },
        DELETE_TASK(state, taskId) {
            state.tasks = state.tasks.filter(t => t.id !== taskId);
        },
        UPDATE_TASK_STATUS(state, { taskId, status }) {
            const task = state.tasks.find(t => t.id === taskId);
            if (task) task.status = status;
        },
        SET_TASKS(state, tasks) {
            state.tasks = tasks;
        },
        SET_SEARCH_QUERY(state, query) {
            state.searchQuery = query;
        },
        SET_SORT_BY(state, sortBy) {
            state.sortBy = sortBy;
        }
    },
    
    actions: {
        fetchTasks({ commit }) {
            setTimeout(() => {
                const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
                commit('SET_TASKS', storedTasks);
            }, 100);
        }
    },
    
    getters: {
        totalTasks: (state) => state.tasks.length,
        completedTasks: (state) => state.tasks.filter(t => t.status === 'completed').length,
        pendingTasks: (state) => state.tasks.filter(t => t.status === 'pending').length,
        
        filteredAndSortedTasks: (state) => {
            let result = state.tasks.filter(task => 
                task.title.toLowerCase().includes(state.searchQuery.toLowerCase())
            );

            result.sort((a, b) => {
                if (state.sortBy === 'priority') {
                    const pValues = { high: 3, medium: 2, low: 1 };
                    return pValues[b.priority] - pValues[a.priority];
                } else {
                    return b.createdAt - a.createdAt; // Newest first
                }
            });

            return result;
        }
    }
};

export const localStoragePlugin = (store) => {
    store.subscribe((state) => {
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
    });
};

export const loggerMiddleware = (type, payload, state) => {
    console.log(`[Mutation]: ${type}`, payload);
};