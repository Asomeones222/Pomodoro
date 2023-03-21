// import { createTodoItemHTML } from "./Controller.js";

const APP = {
    todoItems: [],
    halted: false,
    haltTime: 500,
    clearTodoItems() {
        APP.todoItems = [];
        Model.save("todo-items", []);
    },
    todoItemFactory(content, status) {
        return {
            content,
            status,
        };
    },
    createSaveTodoItemObject(content, status) {
        APP.todoItems.push(APP.todoItemFactory(content, status));
        Model.save("todo-items", APP.todoItems);
    },
    trackTodoList() {
        // Loops through the children of the todo list element in the DOM and saves them
        APP.clearTodoItems();
        const todoList = UI.retrieveItemsFromUI();
        for (let i = 0; i < todoList.length; i++) {
            const todoItem = todoList[i];
            const todoItemContent = todoItem.textContent.trim();
            const todoItemStatus = todoItem.classList.contains(
                "todo-list-item--completed"
            );
            APP.createSaveTodoItemObject(todoItemContent, todoItemStatus);
        }
    },
    importTodoList() {
        APP.todoItems = Model.query("todo-items");
    },
    updateAPP() {
        APP.trackTodoList();
    },
    init() {
        APP.importTodoList();
        UI.initUI();
    },
};

const UI = {
    DOM: {
        todoForm: document.getElementById("todo-form"),
        todoItemInput: document.getElementById("new-todo-input"),
        todoList: document.getElementById("todo-list"),
        settingContainer: document.getElementById(
            "todo-list-settings-container"
        ),
        filterSettingContainer: document.getElementById(
            "todo-list-settings-status"
        ),
        remaingItems: document.getElementById(
            "todo-list-settings-remaning-items"
        ),
    },
    classes: {
        todoItemCompleted: "todo-list-item--completed",
        clearBtnClass: ".todo-list-settings-clear",
        allItemsBtnClass: ".todo-list-settings-status-all",
        activeItemsBtnClass: ".todo-list-settings-status-active",
        completedItemsBtnClass: ".todo-list-settings-status-completed",
        activeSettingsBtnClass: "todo-list-settings--status-active",
    },
    createTodoItemHTML(content, status = false) {
        const todoItemHTML = `<li class="todo-list-item todo-check ${
            status ? UI.classes.todoItemCompleted : ""
        }">
          <button class="todo-check-btn btn"></button>
          <span>${content}</span>
          <button class="todo-cross-btn btn"></button>
        </li>`;
        return todoItemHTML;
    },
    appendedTodoItem(content, status = false) {
        // Can be used by the app to add the items into the UI
        const todoItem = UI.createTodoItemHTML(content, status);
        UI.DOM.todoList.insertAdjacentHTML("afterbegin", todoItem);
        UI.DOM.todoItemInput.value = "";
    },
    appendedTodoItemFromUser(content, status = false) {
        // Takes input from user so validation is crucial
        if (APP.halted) return;
        if (!content) return;

        UI.appendedTodoItem(content, status);
        UI.updateAfterDOMManipulation();

        // halt timer stops user from adding items rapidly
        APP.halted = true;
        setTimeout(() => {
            APP.halted = false;
        }, APP.haltTime);
    },
    toggleTodoItemAsDone(todoItemElement) {
        todoItemElement.classList.toggle(UI.classes.todoItemCompleted);
        UI.updateAfterDOMManipulation();
    },
    removeTodoItem(todoItemElement) {
        todoItemElement.remove();
        UI.updateAfterDOMManipulation();
    },
    updateRemainingItems() {
        // UI.DOM.remaingItems.textContent = UI.DOM.todoList.childElementCount - 1;
        let count = 0;
        APP.todoItems.forEach((item) => !item.status && count++);
        UI.DOM.remaingItems.textContent = count;
    },
    loadTodoItemsIntoUI() {
        console.log(APP.todoItems);
        // Loop backwards to preserve the order of the items
        for (let i = APP.todoItems.length - 1; i > -1; --i) {
            const todoItem = APP.todoItems[i];
            console.log(todoItem);
            UI.appendedTodoItem(todoItem.content, todoItem.status);
        }
    },
    retrieveItemsFromUI() {
        const todoItems = [...UI.DOM.todoList.children];
        // We skip the last one since it's the settings element
        todoItems.pop();
        return todoItems;
    },
    filterByActiveItems() {
        UI.filterTodoBy((item) => !item.status);
    },
    filterByCompletedItems() {
        UI.filterTodoBy((item) => item.status);
    },
    filterByAllItems() {
        UI.filterTodoBy(() => true);
    },
    filterTodoBy(callback) {
        UI.clearItemsFromUI();
        const todoItems = [...APP.todoItems].reverse();
        todoItems.forEach((item) => {
            if (callback(item)) UI.appendedTodoItem(item.content, item.status);
        });
        UI.updateUI();
    },
    clearItemsFromUI() {
        const todoItems = UI.retrieveItemsFromUI();
        todoItems.forEach((item) => item.remove());
        UI.updateUI();
    },
    deleteAllItems() {
        UI.clearItemsFromUI();
        UI.updateAfterDOMManipulation();
    },
    updateAfterDOMManipulation() {
        APP.updateAPP();
        UI.updateUI();
    },
    initEventListeners() {
        UI.DOM.todoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            UI.appendedTodoItemFromUser(UI.DOM.todoItemInput.value.trim());
        });

        UI.DOM.todoList.addEventListener("click", (e) => {
            const emitter = e.target;
            const todoItem = emitter.closest(".todo-list-item ");

            if (emitter.closest("#todo-list-settings-container")) {
                if (emitter.closest(UI.classes.clearBtnClass)) {
                    console.log("Clear btn pressed");
                    UI.deleteAllItems();
                    return;
                }
                UI.DOM.filterSettingContainer
                    .querySelectorAll("button")
                    .forEach((btn) => {
                        btn.classList.remove(UI.classes.activeSettingsBtnClass);
                    });

                if (emitter.closest(UI.classes.allItemsBtnClass)) {
                    const btn = emitter.closest(UI.classes.allItemsBtnClass);
                    btn.classList.add(UI.classes.activeSettingsBtnClass);
                    UI.filterByAllItems();
                    console.log("All btn pressed");
                }

                if (emitter.closest(UI.classes.activeItemsBtnClass)) {
                    const btn = emitter.closest(UI.classes.activeItemsBtnClass);
                    btn.classList.add(UI.classes.activeSettingsBtnClass);
                    UI.filterByActiveItems();
                    console.log("Active btn pressed");
                }

                if (emitter.closest(UI.classes.completedItemsBtnClass)) {
                    const btn = emitter.closest(
                        UI.classes.completedItemsBtnClass
                    );
                    btn.classList.add(UI.classes.activeSettingsBtnClass);
                    UI.filterByCompletedItems();
                    console.log("Completed btn pressed");
                }
                return;
            }
            if (emitter.closest(".todo-check-btn")) {
                // Checks if check-as-done btn was pressed
                UI.toggleTodoItemAsDone(todoItem);
                return;
            }
            if (emitter.closest(".todo-cross-btn")) {
                // Checks if delete btn was pressed
                UI.removeTodoItem(todoItem);
                return;
            }
        });
    },

    updateUI() {
        UI.updateRemainingItems();
    },
    initUI() {
        UI.initEventListeners();
        UI.loadTodoItemsIntoUI();
        UI.updateUI();
    },
};

const Model = {
    save(key, value) {
        // key must be a string value will be stringified using JSON

        // const data = {};
        // data[key] = value;
        window.localStorage.setItem(key, JSON.stringify(value));
    },
    query(key) {
        // chrome.storage.local.get(key, (data) => {
        // console.log(data);
        // });
        return JSON.parse(window.localStorage.getItem(key));
    },
};
APP.init();
