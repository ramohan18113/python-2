// =====================================
// API CONFIGURATION
// =====================================

// Automatically use the hostname where frontend is accessed.
// Example:
// localhost:5000
// 192.168.1.10:5000

const API_BASE =
    `http://${window.location.hostname}:api`;


// =====================================
// Helper: API Requests
// =====================================

async function apiRequest(url, options = {}) {

    const response = await fetch(url, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error || "Something went wrong"
        );

    }

    return data;
}


// =====================================
// Helper: HTML Escaping
// =====================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================
// Load Dashboard Statistics
// =====================================

async function loadStats() {

    try {

        const stats = await apiRequest(
            `${API_BASE}/stats`
        );

        document.getElementById("total").textContent =
            stats.total;

        document.getElementById("completed").textContent =
            stats.completed;

        document.getElementById("in_progress").textContent =
            stats.in_progress;

        document.getElementById("pending").textContent =
            stats.pending;

    } catch (error) {

        console.error("Stats error:", error);

        showToast("Unable to load statistics");

    }

}


// =====================================
// Load Tasks
// =====================================

async function loadTasks() {

    const table = document.getElementById("taskTable");

    const status =
        document.getElementById("statusFilter").value;

    const search =
        document.getElementById("searchInput").value;

    table.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                Loading tasks...
            </td>
        </tr>
    `;

    try {

        const params = new URLSearchParams();

        params.append("status", status);

        if (search.trim()) {

            params.append(
                "search",
                search.trim()
            );

        }

        const tasks = await apiRequest(
            `${API_BASE}/tasks?${params.toString()}`
        );

        renderTasks(tasks);

    } catch (error) {

        console.error("Task error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    Unable to load tasks.
                    Check whether the backend is running.
                </td>
            </tr>
        `;

    }

}


// =====================================
// Render Tasks
// =====================================

function renderTasks(tasks) {

    const table = document.getElementById("taskTable");

    if (tasks.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No tasks found.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = tasks.map(task => {

        const initials = task.assigned_to
            ? task.assigned_to
                .split(" ")
                .map(word => word[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()
            : "NA";

        const statusClass = task.status.replaceAll(
            " ",
            "-"
        );

        const dueDate = task.due_date || "—";

        return `

        <tr>

            <td>

                <div class="task-title">
                    ${escapeHTML(task.title)}
                </div>

                <div class="task-description">
                    ${escapeHTML(task.description || "")}
                </div>

            </td>


            <td>
                ${escapeHTML(task.project_name)}
            </td>


            <td>

                <div class="assignee">

                    <div class="small-avatar">
                        ${escapeHTML(initials)}
                    </div>

                    ${escapeHTML(task.assigned_to || "Unassigned")}

                </div>

            </td>


            <td>

                <span class="priority ${escapeHTML(task.priority)}">

                    ${escapeHTML(task.priority)}

                </span>

            </td>


            <td>

                <select
                    class="status-select ${escapeHTML(statusClass)}"
                    onchange="updateTaskStatus(${task.id}, this.value)"
                >

                    <option
                        value="Pending"
                        ${task.status === "Pending" ? "selected" : ""}
                    >
                        Pending
                    </option>

                    <option
                        value="In Progress"
                        ${task.status === "In Progress" ? "selected" : ""}
                    >
                        In Progress
                    </option>

                    <option
                        value="Completed"
                        ${task.status === "Completed" ? "selected" : ""}
                    >
                        Completed
                    </option>

                </select>

            </td>


            <td>
                ${escapeHTML(dueDate)}
            </td>


            <td>

                <button
                    class="delete-button"
                    title="Delete Task"
                    onclick="deleteTask(${task.id})"
                >
                    🗑
                </button>

            </td>

        </tr>

        `;

    }).join("");

}


// =====================================
// Update Task Status
// =====================================

async function updateTaskStatus(taskId, status) {

    try {

        await apiRequest(
            `${API_BASE}/tasks/${taskId}`,
            {
                method: "PUT",

                body: JSON.stringify({
                    status: status
                })
            }
        );

        showToast("Task status updated");

        await loadTasks();

        await loadStats();

    } catch (error) {

        console.error(error);

        showToast("Unable to update task");

    }

}


// =====================================
// Delete Task
// =====================================

async function deleteTask(taskId) {

    const confirmation = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmation) {
        return;
    }

    try {

        await apiRequest(
            `${API_BASE}/tasks/${taskId}`,
            {
                method: "DELETE"
            }
        );

        showToast("Task deleted successfully");

        await loadTasks();

        await loadStats();

    } catch (error) {

        console.error(error);

        showToast("Unable to delete task");

    }

}


// =====================================
// Load Projects
// =====================================

async function loadProjects() {

    const select =
        document.getElementById("project_id");

    try {

        const projects = await apiRequest(
            `${API_BASE}/projects`
        );

        select.innerHTML = `
            <option value="">
                Select Project
            </option>
        `;

        projects.forEach(project => {

            select.innerHTML += `
                <option value="${project.id}">
                    ${escapeHTML(project.name)}
                </option>
            `;

        });

    } catch (error) {

        console.error(error);

        showToast("Unable to load projects");

    }

}


// =====================================
// Modal
// =====================================

function openModal() {

    document.getElementById("taskModal")
        .classList.add("show");

}


function closeModal() {

    document.getElementById("taskModal")
        .classList.remove("show");

    document.getElementById("taskForm")
        .reset();

}


// =====================================
// Create Task
// =====================================

document.getElementById("taskForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const formData = new FormData(this);

        const task = {

            title: formData.get("title"),

            description: formData.get("description"),

            assigned_to: formData.get("assigned_to"),

            priority: formData.get("priority"),

            project_id:
                formData.get("project_id") || null,

            due_date:
                formData.get("due_date") || null,

            status: "Pending"

        };


        try {

            await apiRequest(
                `${API_BASE}/tasks`,
                {
                    method: "POST",

                    body: JSON.stringify(task)
                }
            );

            closeModal();

            showToast("Task created successfully");

            await loadTasks();

            await loadStats();

        } catch (error) {

            console.error(error);

            showToast(
                error.message || "Unable to create task"
            );

        }

    });


// =====================================
// Toast Notification
// =====================================

let toastTimer;

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


// =====================================
// Initialize Application
// =====================================

async function initializeApp() {

    await loadProjects();

    await loadStats();

    await loadTasks();

}


// Start
initializeApp();
