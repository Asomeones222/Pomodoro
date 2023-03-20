const todoItemCompletedClass = "todo-list-item--completed";

export const createTODOItem = function (todoText) {
    const todoItemHTML = `<li class="todo-list-item todo-check">
          <button class="todo-check-btn btn"></button>
          <span>${todoText.trim()}</span>
          <button class="todo-cross-btn btn"></button>
        </li>`.trim();
    return todoItemHTML;
};

export const toggleTODOItemDone = function (todoItemElement) {
    todoItemElement.classList.toggle(todoItemCompletedClass);
};
