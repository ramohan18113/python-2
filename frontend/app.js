// For the first Docker exercise, publish the backend's
// container port 5000 to host port 5000.
//
// Browser accesses the API using this URL.
// Later, you can replace this with a relative "/api"
// URL and configure Nginx to reverse-proxy requests.

const API_BASE =
    `http://${window.location.hostname}:5000/api`;


const taskForm = document.querySelector("#task-form");

const titleInput = document.querySelector("#title");

const descriptionInput =
    document.querySelector("#description");

const taskList = document.querySelector("#task-list");

const apiStatus = document.querySelector("#api-status");

const formMessage =
    document.querySelector("#form-message");

const refreshButton =
    document.querySelector("#refresh-button");


// --------------------------------------------------
// API REQUEST FUNCTION
// --------------------------------------------------

async function requestApi(path, options = {}) {

    const response = await fetch(`${API_BASE}${path}`, {

        headers: {
            "Content-Type": "application/json"
        },

        ...options

    });


    const payload = await response.json().catch(() => ({}));


    if (!response.ok) {

        throw new Error(
            payload.error || `Request failed (${response.status})`
        );

    }


    return payload;

}


// --------------------------------------------------
// CREATE TASK UI
// --------------------------------------------------

function createTaskElement(task) {

    const li = document.createElement("li");

    li.className = `task ${task.completed ? "completed" : ""}`;


    const content = document.createElement("div");

    content.className = "task-content";


    const title = document.createElement("h3");

    title.textContent = task.title;


    const description = document.createElement("p");

    description.textContent =
        task.description || "No description";


    content.append(title, description);


    const actions = document.createElement("div");

    actions.className = "task-actions";


    // Complete / mark active button

    const completeButton = document.createElement("button");

    completeButton.className = "secondary";

    completeButton.textContent =
        task.completed ? "Mark active" : "Complete";


    completeButton.addEventListener("click", async () => {

        try {

            await requestApi(`/tasks/${task.id}`, {

                method: "PUT",

                body: JSON.stringify({
                    completed: !task.completed
                })

            });

            await loadTasks();

        } catch (error) {

            setStatus(error.message, true);

        }

    });


    // Delete button

    const deleteButton = document.createElement("button");

    deleteButton.className = "danger";

    deleteButton.textContent = "Delete";


    deleteButton.addEventListener("click", async () => {

        try {

            await requestApi(
                `/tasks/${task.id}`,
                { method: "DELETE" }
            );

            await loadTasks();

        } catch (error) {

            setStatus(error.message, true);

        }

    });


    actions.append(completeButton, deleteButton);

    li.append(content, actions);


    return li;

}


// --------------------------------------------------
// STATUS DISPLAY
// --------------------------------------------------

function setStatus(message, isError = false) {

    apiStatus.textContent = message;

    apiStatus.classList.toggle("error", isError);

}


// --------------------------------------------------
// LOAD TASKS
// --------------------------------------------------

async function loadTasks() {

    taskList.replaceChildren();


    try {

        const tasks = await requestApi("/tasks");


        setStatus(`API connected · ${tasks.length} task(s)`);


        if (tasks.length === 0) {

            const empty = document.createElement("li");

            empty.className = "empty";

            empty.textContent =
                "No tasks yet. Add your first task above.";

            taskList.append(empty);

            return;

        }


        tasks.forEach((task) => {

            taskList.append(createTaskElement(task));

        });


    } catch (error) {

        setStatus(
            `Cannot reach API: ${error.message}`,
            true
        );


        const message = document.createElement("li");

        message.className = "empty";

        message.textContent =
            "The API is unavailable. Check the backend container and port.";

        taskList.append(message);

    }

}


// --------------------------------------------------
// CREATE TASK
// --------------------------------------------------

taskForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    formMessage.textContent = "";


    try {

        await requestApi("/tasks", {

            method: "POST",

            body: JSON.stringify({

                title: titleInput.value,

                description: descriptionInput.value

            })

        });


        taskForm.reset();

        formMessage.textContent = "Task created.";

        await loadTasks();


    } catch (error) {

        formMessage.textContent = error.message;

    }

});


// --------------------------------------------------
// REFRESH
// --------------------------------------------------

refreshButton.addEventListener("click", loadTasks);


// --------------------------------------------------
// INITIAL LOAD
// --------------------------------------------------

loadTasks();
