-- =========================================
-- TaskFlow Initial Database Schema
-- =========================================

-- Create application schema

CREATE SCHEMA IF NOT EXISTS public;

-- =========================================
-- Projects Table
-- =========================================

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    project_id INTEGER REFERENCES projects(id),
    assigned_to VARCHAR(100),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO projects (id, name, description)
VALUES
(1, 'Infrastructure Automation', 'Automating infrastructure deployment'),
(2, 'Monitoring Platform', 'Monitoring and observability'),
(3, 'Cloud Migration', 'Migrating workloads to cloud')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks
(title, description, status, priority, project_id, assigned_to, due_date)
VALUES
(
    'Install Docker',
    'Install Docker Engine on Ubuntu servers',
    'Completed',
    'High',
    1,
    'Arun',
    '2026-11-20'
),
(
    'Create Docker Compose',
    'Deploy multiple containers with Compose',
    'In Progress',
    'High',
    1,
    'Rahul',
    '2026-11-25'
),
(
    'Configure Prometheus',
    'Configure infrastructure monitoring',
    'Pending',
    'Medium',
    2,
    'Priya',
    '2026-11-28'
),
(
    'Setup Grafana Dashboard',
    'Create infrastructure monitoring dashboard',
    'In Progress',
    'Medium',
    2,
    'Arun',
    '2026-11-29'
),
(
    'Migrate PostgreSQL',
    'Migrate database to cloud environment',
    'Pending',
    'High',
    3,
    'Rahul',
    '2026-12-02'
),
(
    'Setup CI/CD Pipeline',
    'Build automated deployment pipeline',
    'Completed',
    'High',
    1,
    'Priya',
    '2026-11-19'
),
(
    'Configure Nginx',
    'Setup reverse proxy for application',
    'Pending',
    'Low',
    1,
    'Arun',
    '2026-12-05'
),
(
    'Implement Health Checks',
    'Add health check endpoints',
    'In Progress',
    'High',
    2,
    'Priya',
    '2026-11-26'
);
