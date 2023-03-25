const APP = {
    _items: [],
    storageKey: "todo-items",
    halted: false,
    haltTime: 500,
    timer: {
        running: false,
        timerInterval: null,
        _isStudySession: true,
        get isStudySession() {
            return APP.timer._isStudySession;
        },
        set isStudySession(x) {
            APP.timer._isStudySession = x;
            if (APP.timer.isStudySession)
                APP.timer.currentTime = APP.timer.studyTime;
            else APP.timer.currentTime = APP.timer.restTime;
            APP.timer.resetTimer();
        },
        studyTime: 10 * 60,
        restTime: 5 * 60,
        currentTime: 0,
        elapsedTime: 0,
        getCurrentTime() {
            return APP.timer.currentTime - APP.timer.elapsedTime;
        },
        initTimer() {
            if (APP.timer.isStudySession)
                APP.timer.currentTime = APP.timer.studyTime;
            else APP.timer.currentTime = APP.timer.restTime;
        },
        startTimer() {
            APP.timer.running = true;
            APP.timer.timerInterval = setInterval(() => {
                APP.timer.elapsedTime++;
                if (APP.timer.getCurrentTime() <= 0) APP.timer.pauseTimer();
            }, 1000);
        },
        pauseTimer() {
            clearInterval(APP.timer.timerInterval);
            APP.timer.running = false;
        },
        resetTimer() {
            APP.timer.pauseTimer();
            APP.timer.elapsedTime = 0;
        },
    },
    getItems() {
        return APP._items;
    },
    getItemsReversed() {
        return [...APP._items].reverse();
    },
    createItem(content, status = false) {
        const item = APP.itemFactory(content, status);
        APP._items.push(item);
        APP.exportItemsToStorage();
    },
    deleteItem(itemID) {
        APP._items = APP._items.filter((item) => item.id !== itemID);
        APP.exportItemsToStorage();
    },
    toggleItemAsDone(itemID) {
        const item =
            APP._items[APP._items.findIndex((item) => item.id === itemID)];
        item.status = !item.status;
        APP.exportItemsToStorage();
    },
    clearItems() {
        APP._items = [];
        APP.exportItemsToStorage();
    },
    itemFactory(content, status) {
        return {
            content,
            status,
            id: `${Math.floor(Date.now() * Math.random())}`,
        };
    },
    importItemsFromStorage() {
        APP._items = Model.query(APP.storageKey);
        if (APP._items === null) {
            APP._items = [];
            APP.exportItemsToStorage();
        }
    },
    exportItemsToStorage() {
        Model.save(APP.storageKey, APP._items);
    },
    init() {
        APP.importItemsFromStorage();
        APP.timer.initTimer();
        UI.initUI();
    },
};

const UI = {
    filterMethod: () => true,
    permissions: {
        notifications: false,
        sounds: false,
    },
    DOM: {
        StartTimerBtn: document.getElementById("start-timer-btn"),
        timerMinutes: document.getElementById("timer-minutes"),
        timerSeconds: document.getElementById("timer-seconds"),
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
        timerTypes: {
            timerTypesBtnContainer: document.getElementById(
                "study-rest-btns-container"
            ),
            studyTimerBtn: document.getElementById("study-btn"),
            restTimerBtn: document.getElementById("rest-btn"),
        },
        settings: {
            filterByAllItemsBtn: document.getElementById(
                "todo-list-settings-status-all"
            ),
            filterByActiveItemsBtn: document.getElementById(
                "todo-list-settings-status-active"
            ),
            filterByCompletedItemsBtn: document.getElementById(
                "todo-list-settings-status-completed"
            ),
        },
    },
    classes: {
        todoItemCompleted: "todo-list-item--completed",
        clearBtnClass: ".todo-list-settings-clear",
        allItemsBtnClass: ".todo-list-settings-status-all",
        activeItemsBtnClass: ".todo-list-settings-status-active",
        completedItemsBtnClass: ".todo-list-settings-status-completed",
        activeSettingsBtnClass: "todo-list-settings--status-active",
        settingsContainerID: "#todo-list-settings-container",
        timerTypeHighlightClass: "study-rest-btn-highlighted",
    },
    helpers: {
        formatTime(timeInSeconds) {
            const minutes = Math.trunc(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            return {
                minutes: `${minutes}`.padStart(2, 0),
                seconds: `${seconds}`.padStart(2, 0),
            };
        },
    },
    timer: {
        timerInterval: 0,
        startTimer() {
            APP.timer.startTimer();
            UI.timer.updateTimer();
            UI.DOM.StartTimerBtn.textContent = "Pause";
        },
        pauseTimer() {
            clearInterval(UI.timer.timerInterval);
            APP.timer.pauseTimer();
            UI.DOM.StartTimerBtn.textContent = "Start";
        },
        resetTimer() {
            UI.timer.pauseTimer();
            UI.timer.setCurrentTimerTime();
        },
        setCurrentTimerTime() {
            const currentTime = APP.timer.getCurrentTime();
            const time = currentTime >= 0 ? currentTime : 0;
            UI.DOM.timerMinutes.textContent =
                UI.helpers.formatTime(time).minutes;
            UI.DOM.timerSeconds.textContent =
                UI.helpers.formatTime(time).seconds;
        },
        updateTimer() {
            UI.timer.timerInterval = setInterval(() => {
                const time = APP.timer.getCurrentTime();
                if (time <= 0) {
                    UI.timer.timerConcluded();
                    UI.timer.pauseTimer();
                }
                UI.timer.setCurrentTimerTime();
            });
        },
        timerConcluded() {
            const timerConcludedAudio = new Audio("../sounds/sfx.wav");
            timerConcludedAudio.play();

            new Notification("%%%% timer has concluded let's %%%%");
        },
        initTimer() {
            UI.timer.setCurrentTimerTime();
        },
    },
    createItemHTML(content, id, status = false) {
        const maxLength = 36;
        const title = content.length > maxLength ? content : "";
        const truncatedContent =
            content.length > maxLength
                ? content.slice(0, maxLength).trim() + "..."
                : content;
        const todoItemHTML = `<li class="todo-list-item todo-check ${
            status ? UI.classes.todoItemCompleted : ""
        }" data-id="${id}">
          <button class="todo-check-btn btn"></button>
          <span title="${title}">${truncatedContent}</span>
          <button class="todo-cross-btn btn"></button>
        </li>`;
        return todoItemHTML;
    },
    appendedItemToContainer(content, id, status = false) {
        // Can be used by the app to add the items into the UI
        const item = UI.createItemHTML(content, id, status);
        UI.DOM.todoList.insertAdjacentHTML("afterbegin", item);
        UI.clearForm();
    },
    clearForm() {
        UI.DOM.todoItemInput.value = "";
    },
    toggleItemAsDone(itemID) {
        const itemElement = UI.DOM.todoList.querySelector(
            `[data-id='${itemID}']`
        );
        APP.toggleItemAsDone(itemID);
        itemElement.classList.toggle(UI.classes.todoItemCompleted);
        UI.updateUI();
    },
    deleteItem(itemID) {
        APP.deleteItem(itemID);
        UI.updateUI();
    },
    updateRemainingItems() {
        // UI.DOM.remaingItems.textContent = UI.DOM.todoList.childElementCount - 1;
        let count = 0;
        APP.getItems().forEach((item) => !item.status && count++);
        UI.DOM.remaingItems.textContent = count;
    },
    loadItemsIntoUI() {
        UI.clearItemFromUI();
        APP.getItems().forEach((item) => {
            if (UI.filterMethod(item))
                UI.appendedItemToContainer(item.content, item.id, item.status);
        });
    },
    clearItemFromUI() {
        const items = UI.retrieveItemsFromUI();
        items.forEach((item) => item.remove());
    },
    retrieveItemsFromUI() {
        const todoItems = [...UI.DOM.todoList.children];
        // We skip the last one since it's the settings element
        todoItems.pop();
        return todoItems;
    },
    filterByActiveItems() {
        UI.filterItemsBy((item) => !item.status);
    },
    filterByCompletedItems() {
        UI.filterItemsBy((item) => item.status);
    },
    filterByAllItems() {
        UI.filterItemsBy(() => true);
    },
    filterItemsBy(callback) {
        UI.filterMethod = callback;
        UI.updateUI();
    },
    clearItemsFromUI() {
        const todoItems = UI.retrieveItemsFromUI();
        todoItems.forEach((item) => item.remove());
        UI.updateUI();
    },
    deleteAllItems() {
        UI.clearItemsFromUI();
        APP.clearItems();
        UI.updateUI();
    },
    settingsContainerRemoveClickStyle() {
        UI.DOM.filterSettingContainer
            .querySelectorAll("button")
            .forEach((btn) => {
                btn.classList.remove(UI.classes.activeSettingsBtnClass);
            });
    },
    addClickedStyleToSettingsBtn(btn) {
        UI.settingsContainerRemoveClickStyle();
        btn.classList.add(UI.classes.activeSettingsBtnClass);
    },
    eventHandlers: {
        studyTimerBtnHandler() {
            if (APP.timer.isStudySession) return;
            UI.DOM.timerTypes.timerTypesBtnContainer.classList.remove(
                UI.classes.timerTypeHighlightClass
            );
            APP.timer.isStudySession = true;
            UI.timer.resetTimer();
        },
        restTimerBtnHandler() {
            if (!APP.timer.isStudySession) return;
            UI.DOM.timerTypes.timerTypesBtnContainer.classList.add(
                UI.classes.timerTypeHighlightClass
            );
            APP.timer.isStudySession = false;
            UI.timer.resetTimer();
        },
        startTimerBtnHandler() {
            if (!UI.permissions.notifications) UI.initPermissions();

            if (!APP.timer.running) {
                UI.timer.startTimer();
            } else {
                UI.timer.pauseTimer();
            }
        },
        todoFormHandler() {
            // UI.appendedItemToContainerFromUser(UI.DOM.todoItemInput.value.trim());
            // *****
            if (!UI.DOM.todoItemInput.value.trim()) return;
            APP.createItem(UI.DOM.todoItemInput.value.trim());
            UI.clearForm();
            UI.updateUI();
        },
        settingsClearBtnHandler() {
            UI.deleteAllItems();
        },

        settingsFilterByAllBtnHandler() {
            UI.addClickedStyleToSettingsBtn(
                UI.DOM.settings.filterByAllItemsBtn
            );
            UI.filterByAllItems();
        },
        settingsFilterByActiveBtnHandler() {
            UI.addClickedStyleToSettingsBtn(
                UI.DOM.settings.filterByActiveItemsBtn
            );

            UI.filterByActiveItems();
        },
        settingsFilterByCompletedBtnHandler() {
            UI.addClickedStyleToSettingsBtn(
                UI.DOM.settings.filterByCompletedItemsBtn
            );
            UI.filterByCompletedItems();
        },
        removeItemBtnHandler(itemID) {
            UI.deleteItem(itemID);
        },
        toggleItemAsDoneBtnHandler(itemID) {
            UI.toggleItemAsDone(itemID);
        },
    },
    initEventListeners() {
        UI.DOM.timerTypes.studyTimerBtn.addEventListener("click", () => {
            UI.eventHandlers.studyTimerBtnHandler();
        });
        UI.DOM.timerTypes.restTimerBtn.addEventListener("click", () => {
            UI.eventHandlers.restTimerBtnHandler();
        });
        UI.DOM.StartTimerBtn.addEventListener("click", () => {
            UI.eventHandlers.startTimerBtnHandler();
        });
        UI.DOM.todoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            UI.eventHandlers.todoFormHandler();
        });

        UI.DOM.todoList.addEventListener("click", (e) => {
            const emitter = e.target;
            const item = emitter.closest(".todo-list-item ");

            if (emitter.closest(UI.classes.settingsContainerID)) {
                if (emitter.closest(UI.classes.clearBtnClass))
                    UI.eventHandlers.settingsClearBtnHandler();

                if (emitter.closest(UI.classes.allItemsBtnClass))
                    UI.eventHandlers.settingsFilterByAllBtnHandler();

                if (emitter.closest(UI.classes.activeItemsBtnClass))
                    UI.eventHandlers.settingsFilterByActiveBtnHandler();

                if (emitter.closest(UI.classes.completedItemsBtnClass))
                    UI.eventHandlers.settingsFilterByCompletedBtnHandler();
                return;
            }
            if (emitter.closest(".todo-check-btn")) {
                // Checks if check-as-done btn was pressed
                UI.eventHandlers.toggleItemAsDoneBtnHandler(item.dataset.id);
                return;
            }
            if (emitter.closest(".todo-cross-btn")) {
                // Checks if delete btn was pressed
                UI.eventHandlers.removeItemBtnHandler(item.dataset.id);
                return;
            }
        });
    },
    initPermissions() {
        if (Notification.permission === "granted") {
            UI.permissions.notifications = true;
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    UI.permissions.notifications = true;
                }
            });
        }
    },
    updateUI() {
        UI.loadItemsIntoUI();
        UI.updateRemainingItems();
    },
    initUI() {
        UI.timer.initTimer();
        UI.initEventListeners();
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
        return JSON.parse(window.localStorage.getItem(key));
    },
};
APP.init();
