import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.engine import URL
from dotenv import load_dotenv


# Load .env file for local development.
# In containers, environment variables can be supplied directly.
load_dotenv()


app = Flask(__name__)

CORS(app)


# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "tasktracker")
DB_USER = os.getenv("DB_USER", "taskuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "taskpassword")

database_url = URL.create(
    drivername="postgresql+psycopg2",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=int(DB_PORT),
    database=DB_NAME,
)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


db = SQLAlchemy(app)


# --------------------------------------------------
# DATABASE MODEL
# --------------------------------------------------

class Task(db.Model):

    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    completed = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp(),
        nullable=False
    )


    def to_dict(self):

        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "completed": self.completed,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():

    try:

        db.session.execute(text("SELECT 1"))

        return jsonify({
            "status": "healthy",
            "application": "Task Tracker",
            "database": "connected"
        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({
            "status": "unhealthy",
            "application": "Task Tracker",
            "database": "disconnected",
            "error": str(error)
        }), 503


# --------------------------------------------------
# GET ALL TASKS
# --------------------------------------------------

@app.route("/api/tasks", methods=["GET"])
def get_tasks():

    tasks = Task.query.order_by(
        Task.created_at.desc()
    ).all()

    return jsonify([
        task.to_dict()
        for task in tasks
    ]), 200


# --------------------------------------------------
# CREATE A TASK
# --------------------------------------------------

@app.route("/api/tasks", methods=["POST"])
def create_task():

    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()

    description = data.get("description", "").strip()


    if not title:

        return jsonify({
            "error": "Task title is required"
        }), 400


    task = Task(
        title=title,
        description=description,
        completed=False
    )


    db.session.add(task)

    db.session.commit()


    return jsonify(task.to_dict()), 201


# --------------------------------------------------
# UPDATE TASK
# --------------------------------------------------

@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    task = db.session.get(Task, task_id)


    if task is None:

        return jsonify({
            "error": "Task not found"
        }), 404


    data = request.get_json(silent=True) or {}


    if "title" in data:

        title = data["title"].strip()

        if not title:

            return jsonify({
                "error": "Task title cannot be empty"
            }), 400

        task.title = title


    if "description" in data:

        task.description = data["description"].strip()


    if "completed" in data:

        task.completed = bool(data["completed"])


    db.session.commit()


    return jsonify(task.to_dict()), 200


# --------------------------------------------------
# DELETE TASK
# --------------------------------------------------

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    task = db.session.get(Task, task_id)


    if task is None:

        return jsonify({
            "error": "Task not found"
        }), 404


    db.session.delete(task)

    db.session.commit()


    return jsonify({
        "message": "Task deleted successfully"
    }), 200


# --------------------------------------------------
# APPLICATION STARTUP
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
