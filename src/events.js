export function addEventListeners(listeners = {}, el) {
    const addedListeners = {};
    Object.entries(listeners).forEach(([eventName, handler]) => {
        const wrappedHandler = (e) => {
            try {
                handler(e);
            } catch (error) {
                console.error(`Error in ${eventName} handler:`, error);
            }
        };
        const property = 'on' + eventName;
        el[property] = wrappedHandler;
        addedListeners[eventName] = wrappedHandler;
    });
    return addedListeners;
}

export function removeEventListeners(listeners = {}, el) {
    Object.entries(listeners).forEach(([eventName, handler]) => {
        el.removeEventListener(eventName, handler);
    });
}