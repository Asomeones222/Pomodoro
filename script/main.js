import { createTODOItem } from "./Controller.js";
const todoForm = document.getElementById("todo-form");
const todoItemInput = document.getElementById("new-todo-input");
const todoList = document.getElementById("todo-list");
const todoItemCompletedClass = "todo-list-item--completed";

const toggleTODOItemDone = function (todoItemElement) {
    todoItemElement.classList.toggle(todoItemCompletedClass);
};

todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const todoItem = createTODOItem(todoItemInput.value);
    todoList.insertAdjacentHTML("afterbegin", todoItem);
});

todoList.addEventListener("click", (e) => {
    const emitter = e.target;

    if (emitter.closest("#todo-list-settings-container")) {
        console.log("Settings invoked");
        return;
    }
    if (emitter.closest(".todo-check-btn")) {
        console.log("Mark this as done");
        toggleTODOItemDone(emitter.closest(".todo-list-item "));
        return;
    }
    if (emitter.closest(".todo-cross-btn")) {
        console.log("Delete this");
        console.log(emitter.closest(".todo-list-item"));
        return;
    }
});
