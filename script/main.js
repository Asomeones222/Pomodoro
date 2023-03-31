"use strict";
const APP = {
    _items: [],
    storageKey: "pomodoro-items",
    pref: { colorScheme: null },
    prefKey: "pomodoro-pref",
    timer: {
        running: false,
        timerInterval: null,
        _currentTime: 0,
        elapsedTime: 0,
        // _isStudySession: true,
        sessions: {
            // enum
            Study: { name: "Study", time: 25 * 60, satThroughCount: 0 },
            Rest: { name: "Rest", time: 5 * 60, satThroughCount: 0 },
            Break: {
                name: "Break",
                time: 15 * 60,
                satThroughCount: 0,
                isTurn() {
                    if (
                        APP.timer.sessions.Rest.satThroughCount % 3 === 0 &&
                        APP.timer.sessions.Rest.satThroughCount &&
                        !this._concludedJustBefore
                    ) {
                        this._concludedJustBefore = true;
                        return true;
                    }
                    this._concludedJustBefore = false;
                    return false;
                },
                _concludedJustBefore: false,
            },
            noSession: { time: 0, satThroughCount: 0 },
            isStudySession() {
                return APP.timer.currentSession === APP.timer.sessions.Study;
            },
            isRestSession() {
                return APP.timer.currentSession === APP.timer.sessions.Rest;
            },
            isBreakSession() {
                return APP.timer.currentSession === APP.timer.sessions.Break;
            },
        },
        _currentSession: null,
        get currentSession() {
            return APP.timer._currentSession;
        },
        set currentSession(x) {
            APP.timer._currentSession = x;
            APP.timer.resetTimer();
        },
        startStudySession() {
            APP.timer.currentSession = APP.timer.sessions.Study;
            APP.timer.startTimer();
        },
        startRestSession() {
            APP.timer.currentSession = APP.timer.sessions.Rest;
            APP.timer.startTimer();
        },
        startBreakSession() {
            APP.timer.currentSession = APP.timer.sessions.Break;
            APP.timer.startTimer();
        },
        get currentTime() {
            return APP.timer.currentSession.time;
        },

        getCurrentTime() {
            return APP.timer.currentTime - APP.timer.elapsedTime;
        },
        initTimer() {
            APP.timer.currentSession = APP.timer.sessions.Study;
        },
        keepCountOfSessions() {},
        startTimer() {
            APP.timer.running = true;
            APP.timer.currentSession.satThroughCount += 1;
            APP.timer.timerInterval = setInterval(() => {
                APP.timer.elapsedTime++;
                if (APP.timer.getCurrentTime() < 0) {
                    APP.timer.pauseTimer();
                    APP.timer.timerConcluded();
                }
            }, 1000);
        },
        pauseTimer() {
            clearInterval(APP.timer.timerInterval);
            APP.timer.running = false;
        },
        timerConcluded() {},
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
    importPref() {
        const preferences = Model.query(APP.prefKey);
        if (preferences) APP.pref = preferences;
    },
    exportPref() {
        Model.save(APP.prefKey, APP.pref);
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
        APP.importPref();
        APP.timer.initTimer();
        UI.initUI();
    },
};

const UI = {
    colorScheme: null,
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
        quote: {
            quoteContainerElement: document.getElementById("quote-container"),
            quoteTextElement: document.getElementById("quote-text"),
            quoteeElement: document.getElementById("quotee"),
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
        halt: {
            haltSwitchingThemeFor: 500,
            switchingThemeHalted: false,
            haltStartBtnFor: 200,
            startBtnHalted: false,
        },
        formatTime(timeInSeconds) {
            const minutes = Math.trunc(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            return {
                minutes: `${minutes}`.padStart(2, 0),
                seconds: `${seconds}`.padStart(2, 0),
            };
        },
    },
    setPref() {
        UI.colorScheme = APP.pref?.colorScheme;
    },
    prefersDarkMode() {
        return (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        );
    },
    initTheme() {
        if (UI.colorScheme !== null) {
            UI.setTheme(UI.colorScheme);
            return;
        }
        // If no settings are stored set user preferred mode
        if (UI.prefersDarkMode()) UI.setTheme(1);
        else UI.setTheme(0);
    },
    setDarkTheme() {
        const cssDarkThemeFileNode = document.querySelector("#dark-mode");
        cssDarkThemeFileNode.disabled = false;
    },
    setLightTheme() {
        const cssDarkThemeFileNode = document.querySelector("#dark-mode");
        cssDarkThemeFileNode.disabled = true;
    },
    setTheme(colorScheme) {
        // colorScheme ===  0 -> light colorScheme=== 1 -> dark
        if (colorScheme === 1) UI.setDarkTheme();
        else UI.setLightTheme();
        UI.colorScheme = colorScheme;
        APP.pref.colorScheme = colorScheme;
        APP.exportPref();
    },
    switchTheme() {
        if (UI.colorScheme === 0) UI.setTheme(1);
        else UI.setTheme(0);
    },
    highlightStudyBtn() {
        UI.DOM.timerTypes.timerTypesBtnContainer.classList.remove(
            UI.classes.timerTypeHighlightClass
        );
    },
    highlightRestBtn() {
        UI.DOM.timerTypes.timerTypesBtnContainer.classList.add(
            UI.classes.timerTypeHighlightClass
        );
    },
    timer: {
        timerInterval: 0,
        startTimer() {
            APP.timer.startTimer();
            UI.timer.updateTimer();
            UI.DOM.StartTimerBtn.textContent = "Pause";
        },
        switchSession() {
            if (
                APP.timer.sessions.isBreakSession() ||
                APP.timer.sessions.isRestSession()
            ) {
                APP.timer.currentSession = APP.timer.sessions.Study;
                return;
            }
            if (APP.timer.sessions.Break.isTurn()) {
                APP.timer.currentSession = APP.timer.sessions.Break;
                return;
            } else APP.timer.currentSession = APP.timer.sessions.Rest;

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
        startStudySession() {
            APP.timer.startStudySession();
            UI.timer.resetTimer();
        },
        startRestSession() {
            APP.timer.startRestSession();
            UI.timer.resetTimer();
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
            const timerConcludedAudio = new Audio("../sounds/sfx-2.wav");
            timerConcludedAudio.play();

            UI.timer.switchSession();
            if (APP.timer.sessions.isStudySession()) {
                new Notification("Time to study!");
                UI.highlightStudyBtn();
            } else if (APP.timer.sessions.isRestSession()) {
                new Notification("Time to rest!");
                UI.highlightRestBtn();
            } else if (APP.timer.sessions.isBreakSession()) {
                new Notification("Time for a break!");
                UI.highlightRestBtn();
            }
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
    filterMethod: () => true,
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
    async fetchQuote() {
        try {
            const quote = await (
                await fetch("https://api.quotable.io/random")
            ).json();
            console.log(quote);
            UI.DOM.quote.quoteTextElement.textContent = quote.content;
            UI.DOM.quote.quoteeElement.textContent = quote.author;
        } catch (err) {
            console.log(err);
        } finally {
            UI.DOM.quote.quoteContainerElement.style.filter = "opacity(1)";
        }
    },
    eventHandlers: {
        switchThemeBtnHandler() {
            UI.switchTheme();
        },
        studyTimerBtnHandler() {
            if (APP.timer.sessions.isStudySession()) return;
            UI.highlightStudyBtn();
            UI.timer.startStudySession();
        },
        restTimerBtnHandler() {
            if (APP.timer.sessions.isRestSession()) return;
            UI.highlightRestBtn();
            UI.timer.startRestSession();
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
        document.querySelector("#mode-btn").addEventListener("click", () => {
            // Prevents flashes when switching theme quickly using for example keyboard when tabbing over the button
            if (UI.helpers.halt.switchingThemeHalted) return;
            UI.helpers.halt.switchingThemeHalted = true;
            setTimeout(() => {
                UI.helpers.halt.switchingThemeHalted = false;
            }, UI.helpers.halt.haltSwitchingThemeFor);

            UI.eventHandlers.switchThemeBtnHandler();
        });
        UI.DOM.timerTypes.studyTimerBtn.addEventListener("click", () => {
            UI.eventHandlers.studyTimerBtnHandler();
        });
        UI.DOM.timerTypes.restTimerBtn.addEventListener("click", () => {
            UI.eventHandlers.restTimerBtnHandler();
        });
        UI.DOM.StartTimerBtn.addEventListener("click", () => {
            if (UI.helpers.halt.startBtnHalted) return;
            UI.helpers.halt.startBtnHalted = true;
            setTimeout(() => {
                UI.helpers.halt.startBtnHalted = false;
            }, UI.helpers.halt.haltStartBtnFor);

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
        UI.setPref();
        UI.initTheme();
        UI.timer.initTimer();
        UI.initEventListeners();
        // UI.fetchQuote();
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
