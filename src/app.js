// import { destroyDOM } from './destroy-dom.js'
// import { createDispatcher } from './dispatcher.js'
// import { mountDOM } from './mount-dom.js'

// export function createApp({ state, view, reducers = {} }) {
//     let parentEl = null;
//     let vdom = null;
//     let isRendering = false;

//     const dispatcher = createDispatcher();
//     const subscriptions = [dispatcher.afterEveryCommand(renderApp)];

//     function emit(eventName, payload) {
//         dispatcher.dispatch(eventName, payload);
//     }

//     for (const actionName in reducers) {
//         const reducer = reducers[actionName];
//         const subs = dispatcher.subscribe(actionName, payload => {
//             const newState = reducer(state, payload);
//             // if (newState !== state) {
//             //     state == newState;
//             // }
//             state = reducer(state, payload);
//         });
//         subscriptions.push(subs);
//     }

//     function handlePopState() {
//         const path = window.location.hash.slice(1) || '/';
//         dispatcher.dispatch('routeChange', path);
//     }
    
//     window.addEventListener('popstate', handlePopState);

//     function navigate(path) {
//         window.location.hash = path === '/' ? '' : path;
//         emit('routeChange', path);
//     }

//     function renderApp() {
        
//         if (isRendering) return;
//         isRendering = true;

//         const activeElement = document.activeElement;
//         const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
//         const isEditingInput = isInput && activeElement.classList.contains('edit');
//         const cursorPos = isInput ? activeElement.selectionStart : null;
//         const cursorEnd = isInput ? activeElement.selectionEnd : null;
//         const elementClass = isInput ? activeElement.className : null;
//         const elementId = isInput && activeElement.dataset ? activeElement.dataset.todoId : null;

//         if (vdom) {
//             destroyDOM(vdom);
//         }
//         vdom = view(state, emit, navigate);
//         mountDOM(vdom, parentEl);

//         if (isInput && elementClass) {
//             let targetInput = null;
            
//             if (isEditingInput && elementId) {
//                 targetInput = parentEl.querySelector(`input.edit[data-todo-id="${elementId}"]`);
//             } else if (!isEditingInput) {
//                 targetInput = parentEl.querySelector(`input.${elementClass.replace(/\s+/g, '.')}`);
//             }
            
//             if (targetInput) {
//                 targetInput.focus();
//                 if (cursorPos !== null && cursorEnd !== null) {
//                     targetInput.setSelectionRange(cursorPos, cursorEnd);
//                 }
//             }
//         }

//         if (state.editingId && !isEditingInput) {
//             setTimeout(() => {
//                 const editInput = parentEl.querySelector(`input.edit[data-todo-id="${state.editingId}"]`);
//                 if (editInput) {
//                     editInput.focus();
//                     editInput.select();
//                 }
//             }, 0);
//         }

//         isRendering = false;
//     }

//     return {
//         mount(_parentEl) {
//             parentEl = _parentEl;
//             renderApp();
//         },
//         unmount() {
//             window.removeEventListener('popstate', handlePopState);
//             if (vdom) destroyDOM(vdom);
//             vdom = null;
//             subscriptions.forEach(unsubscribe => unsubscribe());
//         }
//     };
// }

import { destroyDOM } from './destroy-dom.js'
import { createDispatcher } from './dispatcher.js'
import { diffAndPatch } from './diff_algo.js'

export function createApp({ state, view, reducers = {} }) {
    let parentEl = null;
    let vdom = null;
    let isRendering = false;

    const dispatcher = createDispatcher();
    const subscriptions = [dispatcher.afterEveryCommand(renderApp)];

    function emit(eventName, payload) {
        dispatcher.dispatch(eventName, payload);
    }

    for (const actionName in reducers) {
        const reducer = reducers[actionName];
        const subs = dispatcher.subscribe(actionName, payload => {
            const newState = reducer(state, payload);
            if (newState !== state) {
                state = newState;
            }
        });
        subscriptions.push(subs);
    }

    function navigate(path) {
        window.location.hash = path === '/' ? '' : path;
        emit('routeChange', path);
    }

    function renderApp() {
        if (isRendering) return;
        isRendering = true;

        try {
            const activeElement = document.activeElement;
            const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
            const cursorPos = isInput ? activeElement.selectionStart : null;
            const cursorEnd = isInput ? activeElement.selectionEnd : null;
            const elementClass = isInput ? activeElement.className : null;
            const elementDataId = isInput ? activeElement.dataset.todoId : null;

            const newVdom = view(state, emit, navigate);
            vdom = diffAndPatch(vdom, newVdom, parentEl);

            if (isInput) {
                let targetInput = null;

                if (elementDataId) {
                    targetInput = document.querySelector(`[data-todo-id="${elementDataId}"]`);
                } else if (elementClass) {
                    targetInput = document.querySelector(`.${elementClass.split(' ')[0]}`);
                }

                if (targetInput && typeof targetInput.focus === 'function') {
                    targetInput.focus();
                    if (cursorPos !== null && cursorEnd !== null) {
                        targetInput.setSelectionRange(cursorPos, cursorEnd);
                    }
                }
            }
        } catch (error) {
            console.error('Render error:', error);
        }

        isRendering = false;
    }

    return {
        mount(_parentEl) {
            parentEl = _parentEl;
            renderApp();
        },
        unmount() {
            if (vdom) destroyDOM(vdom);
            vdom = null;
            subscriptions.forEach(unsubscribe => unsubscribe());
        },
        getState() {
            return state;
        },
        forceUpdate() {
            renderApp();
        }
    };
}