import { destroyDOM } from "./destroy-dom.js";
import { mountDOM } from "./mount-dom.js";
import { patchDOM } from "./diff_algo.js";

export function createApp({ state, view, reducers = {} }) {
  let parentEl = null;
  let vdom = null;
  let isRendering = false;
  const eventHandlers = new Map();
  const afterRenderHandlers = [];

  function emit(eventName, payload) {
    try {
      if (eventHandlers.has(eventName)) {
        eventHandlers.get(eventName).forEach((handler) => {
          handler(payload);
        });
      }

      afterRenderHandlers.forEach((handler) => {
        handler(eventName, payload);
      });
    } catch (error) {
      console.error(`Error sending event${eventName}:`, error);
    }
  }

  for (const actionName in reducers) {
    const reducer = reducers[actionName];

    if (!eventHandlers.has(actionName)) {
      eventHandlers.set(actionName, []);
    }
    eventHandlers.get(actionName).push((payload) => {
      state = reducer(state, payload);
    });
  }
  afterRenderHandlers.push(() => {
    renderApp();
  });

  function handlePopState() {
    const path = window.location.hash.slice(1) || "/";
    emit("routeChange", path);
  }
  window.addEventListener("popstate", handlePopState);
  function navigate(path) {
    window.location.hash = path === "/" ? "" : path;
  }

  function renderApp() {
    if (isRendering) return;
    isRendering = true;

    const activeElement = document.activeElement;
    const isInput =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA");
    const isEditingInput = isInput && activeElement.classList.contains("edit");
    const isToggleInput = isInput && activeElement.classList.contains("toggle");
    const cursorPos = isInput ? activeElement.selectionStart : null;
    const cursorEnd = isInput ? activeElement.selectionEnd : null;
    const elementClass = isInput ? activeElement.className : null;
    const elementId =
      isInput && activeElement.dataset ? activeElement.dataset.todoId : null;

    const newVdom = view(state, emit, navigate);
    if (vdom) {
      patchDOM(vdom, newVdom, parentEl);
    } else {
      mountDOM(newVdom, parentEl);
    }
    vdom = newVdom;
    if (isInput && elementClass) {
      let targetInput = null;

      if (isEditingInput && elementId) {
        targetInput = parentEl.querySelector(
          `input.edit[data-todo-id="${elementId}"]`
        );
      } else if (isToggleInput && elementId) {
        targetInput = parentEl.querySelector(
          `input.toggle[data-todo-id="${elementId}"]`
        );
      } else if (!isEditingInput && !isToggleInput) {
        targetInput = parentEl.querySelector(
          `input.${elementClass.replace(/\s+/g, ".")}`
        );
      }

      if (targetInput) {
        targetInput.focus();
        if (cursorPos !== null && cursorEnd !== null) {
          targetInput.setSelectionRange(cursorPos, cursorEnd);
        }
      }
    }

    if (state.editingId && !isEditingInput) {
      setTimeout(() => {
        const editInput = parentEl.querySelector(
          `input.edit[data-todo-id="${state.editingId}"]`
        );
        if (editInput) {
          editInput.focus();
          editInput.select();
        }
      }, 0);
    }

    isRendering = false;
  }

  return {
    emit,
    mount(_parentEl) {
      parentEl = _parentEl;
      renderApp();
    },
    unmount() {
      window.removeEventListener("popstate", handlePopState);
      if (vdom) destroyDOM(vdom);
      vdom = null;
      eventHandlers.clear();
      afterRenderHandlers.length = 0;
    },
  };
}
