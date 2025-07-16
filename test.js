import { createApp } from "./src/app.js";
import { CreateElement } from "./src/h.js";



const reducers = {
    Increment: (state) => {
        return {...state, count: state.count + 1}
    }
};

const state = {
    count: 0
}

const app = createApp({
    state,
    view,
    reducers
});
function view(state, emit) {
    return (
        CreateElement('div', {}, [
            CreateElement('h1', {}, ['Counter']),
            CreateElement('p', {}, [`Count: ${state.count}`]),
            CreateElement('button', {
                on: {
                    click: () => {
                        emit('Increment');
                    }
                }
            }, ['Increment']),
        ])
    )
}


app.mount(document.getElementById("root"));