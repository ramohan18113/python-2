import os
from datetime import date

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

CORS(app)

# ---------------------------------------
# Database Configuration
# ---------------------------------------

#DB_HOST = os.getenv("DB_HOST", "localhost")
#DB_PORT = os.getenv("DB_PORT", "5432")
#DB_NAME = os.getenv("DB_NAME", "taskflow_db")
#DB_USER = os.getenv("DB_USER", "taskflow_user")
#DB_PASSWORD = os.getenv("DB_PASSWORD", "taskflow_password")

DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "taskflow")
DB_USER = os.getenv("DB_USER", "taskflow_app")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ---------------------------------------
# Database Models
# ---------------------------------------

class Project(db.Model):

    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(db.Text)


class Task(db.Model):

    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(db.Text)

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Pending"
    )

    priority = db.Column(
        db.String(20),
        nullable=False,
        default="Medium"
    )

    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id")
    )

    assigned_to = db.Column(db.String(100))

    due_date = db.Column(db.Date)

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    project = db.relationship("Project")


# ---------------------------------------
# Serialization
# ---------------------------------------

def serialize_task(task):

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "project_id": task.project_id,
        "project_name": (
            task.project.name
            if task.project
            else "Unknown"
        ),
        "assigned_to": task.assigned_to,
        "due_date": (
            task.due_date.isoformat()
            if task.due_date
            else None
        )
    }


# ---------------------------------------
# Health Check
# ---------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():

    try:

        db.session.execute(
            db.text("SELECT 1")
        )

        return jsonify({
            "status": "healthy",
            "application": "TaskFlow",
            "database": "connected"
        }), 200

    except Exception as error:

        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(error)
        }), 500


# ---------------------------------------
# Statistics
# ---------------------------------------

@app.route("/api/stats", methods=["GET"])
def get_stats():

    total = Task.query.count()

    completed = Task.query.filter_by(
        status="Completed"
    ).count()

    in_progress = Task.query.filter_by(
        status="In Progress"
    ).count()

    pending = Task.query.filter_by(
        status="Pending"
    ).count()

    high_priority = Task.query.filter_by(
        priority="High"
    ).count()

    return jsonify({
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "pending": pending,
        "high_priority": high_priority
    })


# ---------------------------------------
# Get Tasks
# Supports filtering and searching
# ---------------------------------------

@app.route("/api/tasks", methods=["GET"])
def get_tasks():

    status = request.args.get("status")
    search = request.args.get("search")

    query = Task.query

    if status and status != "All":

        query = query.filter(
            Task.status == status
        )

    if search:

        query = query.filter(
            Task.title.ilike(f"%{search}%")
        )

    tasks = query.order_by(
        Task.id.desc()
    ).all()

    return jsonify([
        serialize_task(task)
        for task in tasks
    ])


# ---------------------------------------
# Create Task
# ---------------------------------------

@app.route("/api/tasks", methods=["POST"])
def create_task():

    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()

    if not title:

        return jsonify({
            "error": "Task title is required"
        }), 400

    due_date = None

    if data.get("due_date"):

        try:

            due_date = date.fromisoformat(
                data["due_date"]
            )

        except ValueError:

            return jsonify({
                "error": "Invalid due date"
            }), 400

    task = Task(
        title=title,
        description=data.get("description", ""),
        status=data.get("status", "Pending"),
        priority=data.get("priority", "Medium"),
        project_id=data.get("project_id") or None,
        assigned_to=data.get("assigned_to", ""),
        due_date=due_date
    )

    db.session.add(task)
    db.session.commit()

    return jsonify(
        serialize_task(task)
    ), 201


# ---------------------------------------
# Update Task
# ---------------------------------------

@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    task = db.session.get(
        Task,
        task_id
    )

    if task is None:

        return jsonify({
            "error": "Task not found"
        }), 404

    data = request.get_json(silent=True) or {}

    if "title" in data:

        task.title = data["title"]

    if "description" in data:

        task.description = data["description"]

    if "status" in data:

        task.status = data["status"]

    if "priority" in data:

        task.priority = data["priority"]

    if "assigned_to" in data:

        task.assigned_to = data["assigned_to"]

    if "project_id" in data:

        task.project_id = data["project_id"] or None

    if "due_date" in data:

        if data["due_date"]:

            try:

                task.due_date = date.fromisoformat(
                    data["due_date"]
                )

            except ValueError:

                return jsonify({
                    "error": "Invalid due date"
                }), 400

        else:

            task.due_date = None

    db.session.commit()

    return jsonify(
        serialize_task(task)
    )


# ---------------------------------------
# Delete Task
# ---------------------------------------

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    task = db.session.get(
        Task,
        task_id
    )

    if task is None:

        return jsonify({
            "error": "Task not found"
        }), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        "message": "Task deleted successfully"
    })


# ---------------------------------------
# Get Projects
# ---------------------------------------

@app.route("/api/projects", methods=["GET"])
def get_projects():

    projects = Project.query.order_by(
        Project.id
    ).all()

    return jsonify([
        {
            "id": project.id,
            "name": project.name,
            "description": project.description
        }
        for project in projects
    ])


# ---------------------------------------
# Start Application
# ---------------------------------------

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
