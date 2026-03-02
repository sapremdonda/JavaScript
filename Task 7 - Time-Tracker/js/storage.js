// localstorage read/write helpers

const KEYS = { 
    projects: 'tt_projects', 
    logs: 'tt_logs', 
    active: 'tt_active_timer', 
    theme: 'tt_theme' 
};

export const getData = (keyName) => {
    const data = localStorage.getItem(KEYS[keyName]);
    if (keyName === 'active') return data ? JSON.parse(data) : null;
    if (keyName === 'theme') return data || 'light';
    return data ? JSON.parse(data) : [];
};

export const saveData = (keyName, data) => {
    if (keyName === 'theme') {
        localStorage.setItem(KEYS[keyName], data);
    } else {
        localStorage.setItem(KEYS[keyName], JSON.stringify(data));
    }
};
