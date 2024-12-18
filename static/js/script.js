// Function to get a cookie by name
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
        const [key, value] = cookies[i].split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}

let taskCounter = 0;

// Add task to the UI
function addTaskToUI(task) {
    const taskList = document.getElementById('tasks-list');

    // Create a new task item
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.taskId = task.id;

    // Create task name
    const taskName = document.createElement('span');
    taskName.className = 'task-name';
    taskName.textContent = task.task;
    if (task.completed) {
        taskName.classList.add('completed');
    }

    // Create complete button
    const completeButton = document.createElement('button');
    completeButton.className = `button ${task.completed ? 'mark-incomplete' : 'mark-complete'}`;
    completeButton.textContent = task.completed ? 'Incomplete' : 'Complete';
    completeButton.onclick = () => changeTaskStatus(task.id, taskName, completeButton);

    // Create remove button
    const removeButton = document.createElement('button');
    removeButton.className = 'button';
    removeButton.textContent = 'Remove';
    removeButton.style.backgroundColor = '#6c757d';
    removeButton.style.color = 'white';
    removeButton.onclick = () => removeTask(task.id, taskItem);

    // Add elements to task item
    taskItem.appendChild(taskName);
    taskItem.appendChild(completeButton);
    taskItem.appendChild(removeButton);

    // Add task item to task list
    taskList.appendChild(taskItem);

    // Update task counter
    taskCounter++;
}

// Fetch tasks from the server
function loadTaskList() {
    fetch('/api/tasks')
        .then((response) => response.json())
        .then((tasks) => {
            const taskList = document.getElementById('tasks-list');
            taskList.innerHTML = '';
            tasks.forEach(addTaskToUI);
            taskCounter = tasks.length;
        })
        .catch((err) => console.error('Error fetching tasks:', err));
}

// Change task status
function changeTaskStatus(taskId, taskName, button) {
    const newStatus = !taskName.classList.contains('completed');

    fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, completed: newStatus }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Error updating task status.');
            }
            taskName.classList.toggle('completed', newStatus);
            button.className = `button ${newStatus ? 'mark-incomplete' : 'mark-complete'}`;
            button.textContent = newStatus ? 'Incomplete' : 'Complete';
        })
        .catch((err) => console.error('Error updating task:', err));
}

// Remove task
function removeTask(taskId, taskItem) {
    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Error removing task.');
            }
            taskItem.remove();
            taskCounter--;
        })
        .catch((err) => console.error('Error removing task:', err));
}

// Add new task
function addTask() {
    const taskName = prompt('Enter the new task:');
    if (!taskName) return;

    fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskName }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Error adding task.');
            }
            return response.json();
        })
        .then(addTaskToUI)
        .catch((err) => console.error('Error adding task:', err));
}

// initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Welcome Message
    const username = sessionStorage.getItem('username') || getCookie('username');
    const welcomeMessageElement = document.getElementById('welcome-message');

    if (welcomeMessageElement) {
        welcomeMessageElement.textContent = username
            ? `Welcome back, ${username}!`
            : 'Welcome, Guest!';
    } else {
        console.error('Element with ID "welcome-message" not found.');
    }

    // Load Tasks
    loadTaskList();

    // Add Task Button Listener
    document.getElementById('add-task-button').addEventListener('click', addTask);
});
