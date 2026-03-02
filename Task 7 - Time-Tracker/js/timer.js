// timer logic
import { getData, saveData } from './storage.js';
import { addLog, formatDuration } from './logs.js';

let timerInterval = null;
let idleSeconds = 0;
let onTickCallback = null;
let onStopCallback = null;

export const getActiveTimer = () => getData('active');

export const startTimer = (projectId, taskName) => {
    const timerData = { projectId, taskName, startTime: Date.now() };
    saveData('active', timerData);
    idleSeconds = 0;
    resumeTimer();
};

export const stopTimer = () => {
    const active = getActiveTimer();
    if (!active) return;
    
    addLog(active.projectId, active.taskName, active.startTime, Date.now());
    saveData('active', null);
    
    clearInterval(timerInterval);
    if (onStopCallback) onStopCallback();
};

export const resumeTimer = () => {
    if (!getActiveTimer()) return;
    clearInterval(timerInterval);
    timerInterval = setInterval(tick, 1000);
};

export const setCallbacks = (onTick, onStop) => {
    onTickCallback = onTick;
    onStopCallback = onStop;
};

export const resetIdle = () => idleSeconds = 0;

const tick = () => {
    const active = getActiveTimer();
    if (!active) return;
    
    idleSeconds++;
    if (idleSeconds >= 300) { // 5 minutes idle
        swal("Idle Detected", "We paused your timer due to 5 minutes of inactivity.", "warning");
        stopTimer();
        return;
    }

    const elapsedSeconds = Math.floor((Date.now() - active.startTime) / 1000);
    if (onTickCallback) onTickCallback(formatDuration(elapsedSeconds), active);
};
