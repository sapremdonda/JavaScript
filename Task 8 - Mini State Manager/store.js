// store.js
import { deepClone } from './utils.js';

export function createStore({ state, mutations, actions, getters, plugins = [], middlewares = [] }) {
    let currentState = deepClone(state);
    let subscribers = [];
    
    let history = [deepClone(currentState)];
    let historyIndex = 0;

    const store = {
        get state() {
            return currentState;
        },
        
        get getters() {
            const evaluatedGetters = {};
            for (let key in getters) {
                Object.defineProperty(evaluatedGetters, key, {
                    get: () => getters[key](currentState)
                });
            }
            return evaluatedGetters;
        },

        subscribe(callback) {
            subscribers.push(callback);
            return () => {
                subscribers = subscribers.filter(sub => sub !== callback);
            };
        },

        notify() {
            subscribers.forEach(callback => callback(currentState));
        },

        commit(type, payload) {
            middlewares.forEach(mw => mw(type, payload, currentState));

            if (mutations[type]) {
                mutations[type](currentState, payload);
                
                history = history.slice(0, historyIndex + 1);
                history.push(deepClone(currentState));
                historyIndex++;

                this.notify();
            } else {
                console.error(`Mutation ${type} does not exist.`);
            }
        },

        dispatch(type, payload) {
            if (actions[type]) {
                return actions[type](this, payload);
            }
            console.error(`Action ${type} does not exist.`);
        },
        
        travelTo(index) {
            if (index >= 0 && index < history.length) {
                historyIndex = index;
                currentState = deepClone(history[historyIndex]);
                this.notify();
            }
        },
        
        undo() {
            this.travelTo(historyIndex - 1);
        },
        
        redo() {
            this.travelTo(historyIndex + 1);
        }
    };

    plugins.forEach(plugin => plugin(store));

    return store;
}