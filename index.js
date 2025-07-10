import { CreateElement } from './src/h.js'
import { createApp } from './src/app.js'


const FILTERS = {
    ALL: 'all',
    ACTIVE: 'active',
    COMPLETED: 'completed'
};

let appState = {
    todos: [],
    newTodo: '',
    filter: FILTERS.ALL,
    editingId: null,
    editingText: ''
};

const reducers = {
    updateNewTodo: (state, value) => ({ ...state, newTodo: value }),
    
    addTodo: (state) => {
        const text = state.newTodo.trim();
        if (!text) return state;
        
        const newState = {
            ...state,
            todos: [...state.todos, {
                id: Date.now(),
                text,
                completed: false
            }],
            newTodo: ''
        };
        
        return newState;
    },
    
    toggleTodo: (state, id) => ({
        ...state,
        todos: state.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
    }),
    
    deleteTodo: (state, id) => ({
        ...state,
        todos: state.todos.filter(todo => todo.id !== id)
    }),
    
    startEditing: (state, { id, text }) => ({
        ...state,
        editingId: id,
        editingText: text
    }),
    
    updateEditingText: (state, text) => ({
        ...state,
        editingText: text
    }),
    
    saveEdit: (state) => {
        const trimmedText = state.editingText.trim();
        if (!trimmedText) {
            return {
                ...state,
                todos: state.todos.filter(todo => todo.id !== state.editingId),
                editingId: null,
                editingText: ''
            };
        }
        
        return {
            ...state,
            todos: state.todos.map(todo =>
                todo.id === state.editingId 
                    ? { ...todo, text: trimmedText }
                    : todo
            ),
            editingId: null,
            editingText: ''
        };
    },
    
    toggleAll: (state) => {
        const allCompleted = state.todos.every(todo => todo.completed);
        return {
            ...state,
            todos: state.todos.map(todo => ({ 
                ...todo, 
                completed: !allCompleted 
            }))
        };
    },
    
    clearCompleted: (state) => ({
        ...state,
        todos: state.todos.filter(todo => !todo.completed)
    }),
    
    setFilter: (state, filter) => ({ ...state, filter }),
    
    routeChange: (state, path) => {
        let filter = FILTERS.ALL;
        if (path === '/active') filter = FILTERS.ACTIVE;
        if (path === '/completed') filter = FILTERS.COMPLETED;
        return { ...state, filter };
    }
};

function view(state, emit, navigate) {
    const { todos, newTodo, filter, editingId, editingText } = state;
    
    const filteredTodos = todos.filter(todo => {
        switch (filter) {
            case FILTERS.ACTIVE: return !todo.completed;
            case FILTERS.COMPLETED: return todo.completed;
            default: return true;
        }
    });
    
    const activeTodoCount = todos.filter(todo => !todo.completed).length;
    const completedCount = todos.length - activeTodoCount;
    const allCompleted = todos.length > 0 && activeTodoCount === 0;

    return CreateElement('section', { class: 'todoapp' }, [
        CreateElement('header', { class: 'header' }, [
            CreateElement('h1', {}, ['todos']),
            CreateElement('input', {
                class: 'new-todo',
                placeholder: 'What needs to be done?',
                maxlength: 60,
                value: newTodo,
                autofocus: true,
                on: {
                    input: e => emit('updateNewTodo', e.target.value),
                    keypress: e => {
                        if (e.key === 'Enter' && e.target.value.length >= 2) {
                            e.preventDefault();
                            emit('addTodo');
                            setTimeout(() => {
                                e.target.value = '';
                            }, 0);
                        }
                    }
                }
            })
        ]),
        
        todos.length > 0 ? CreateElement('section', { class: 'main' }, [
            CreateElement('input', {
                id: 'toggle-all',
                class: 'toggle-all',
                type: 'checkbox',
                checked: allCompleted,
                on: { change: () => emit('toggleAll') }
            }),
            CreateElement('label', { 
                for: 'toggle-all',
                on: { 
                    click: (e) => {
                        e.preventDefault();
                        emit('toggleAll');
                    }
                }
            }, ['Mark all as complete']),
            
            CreateElement('ul', { class: 'todo-list' },
                filteredTodos.map(todo => {
                    const isEditing = editingId === todo.id;
                    const todoClass = [
                        todo.completed ? 'completed' : '',
                        isEditing ? 'editing' : ''
                    ].filter(Boolean).join(' ');
                    
                    return CreateElement('li', { class: todoClass }, [
                        CreateElement('div', { class: 'view' }, [
                            CreateElement('input', {
                                class: 'toggle',
                                type: 'checkbox',
                                checked: todo.completed,
                                on: { change: () => emit('toggleTodo', todo.id) }
                            }),
                            CreateElement('label', {
                                on: {
                                    dblclick: () => emit('startEditing', {
                                        id: todo.id, 
                                        text: todo.text 
                                    })
                                }
                            }, [todo.text]),
                            CreateElement('button', {
                                class: 'destroy',
                                on: { click: () => emit('deleteTodo', todo.id) }
                            })
                        ]),
                        
                        isEditing ? CreateElement('input', {
                            class: 'edit',
                            maxlength: 60,
                            value: editingText,
                            'data-todo-id': todo.id.toString(),
                            on: {
                                input: e => emit('updateEditingText', e.target.value),
                                blur: e => { emit('saveEdit') },
                                keypress: e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        emit('saveEdit');
                                    }
                                },
                            }
                        }) : null
                    ]);
                })
            )
        ]) : null,
        
        todos.length > 0 ? CreateElement('footer', { class: 'footer' }, [
            CreateElement('span', { class: 'todo-count' }, [
                CreateElement('strong', {}, [activeTodoCount.toString()]),
                ` ${activeTodoCount === 1 ? 'item' : 'items'} left`
            ]),
            
            CreateElement('ul', { class: 'filters' }, [
                CreateElement('li', {}, [
                    CreateElement('a', {
                        class: filter === FILTERS.ALL ? 'selected' : '',
                        href: '#/',
                        on: {
                            click: e => {
                                e.preventDefault();
                                navigate('/');
                                emit('setFilter', FILTERS.ALL);
                            }
                        }
                    }, ['All'])
                ]),
                CreateElement('li', {}, [
                    CreateElement('a', {
                        class: filter === FILTERS.ACTIVE ? 'selected' : '',
                        href: '#/active',
                        on: {
                            click: e => {
                                e.preventDefault();
                                navigate('/active');
                                emit('setFilter', FILTERS.ACTIVE);
                            }
                        }
                    }, ['Active'])
                ]),
                CreateElement('li', {}, [
                    CreateElement('a', {
                        class: filter === FILTERS.COMPLETED ? 'selected' : '',
                        href: '#/completed',
                        on: {
                            click: e => {
                                e.preventDefault();
                                navigate('/completed');
                                emit('setFilter', FILTERS.COMPLETED);
                            }
                        }
                    }, ['Completed'])
                ])
            ]),
            
            completedCount > 0 ? CreateElement('button', {
                class: 'clear-completed',
                on: { click: () => emit('clearCompleted') }
            }, ['Clear completed']) : null
        ]) : null
    ]);
}

const app = createApp({
    state: appState,
    view,
    reducers
});

const hash = window.location.hash.slice(2);
if (hash === 'active') {
    appState.filter = FILTERS.ACTIVE;
} else if (hash === 'completed') {
    appState.filter = FILTERS.COMPLETED;
}

app.mount(document.getElementById('app'));