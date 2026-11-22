CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    completed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO tasks (title, description, completed)
VALUES
    (
        'Learn Docker images',
        'Understand base images, layers, and build context.',
        FALSE
    ),
    (
        'Containerize the backend',
        'Write a Dockerfile for the Flask API.',
        FALSE
    ),
    (
        'Containerize the frontend',
        'Serve static files using a web server container.',
        FALSE
    )
ON CONFLICT DO NOTHING;
