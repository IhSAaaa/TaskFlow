-- TaskFlow Seed Data
-- Initial data for testing and development

-- Insert default tenant
INSERT INTO tenants (
    id, 
    name, 
    domain, 
    subdomain, 
    status, 
    plan, 
    settings, 
    owner_id, 
    max_users, 
    max_projects, 
    max_storage_gb, 
    features
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'TaskFlow Demo',
    'taskflow.local',
    'demo',
    'active',
    'premium',
    '{"theme": "light", "timezone": "UTC", "language": "en"}',
    '550e8400-e29b-41d4-a716-446655440001',
    100,
    50,
    10,
    '{"real_time": true, "file_upload": true, "analytics": true}'
) ON CONFLICT (id) DO NOTHING;

-- Insert default admin user (password: password)
INSERT INTO users (
    id,
    email,
    username,
    first_name,
    last_name,
    password_hash,
    tenant_id,
    status,
    avatar_url,
    phone,
    timezone,
    language
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'admin@taskflow.local',
    'admin',
    'Admin',
    'User',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '550e8400-e29b-41d4-a716-446655440000',
    'active',
    NULL,
    NULL,
    'UTC',
    'en'
) ON CONFLICT (id) DO NOTHING;

-- Insert test user (password: password)
INSERT INTO users (
    id,
    email,
    username,
    first_name,
    last_name,
    password_hash,
    tenant_id,
    status,
    avatar_url,
    phone,
    timezone,
    language
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'user@taskflow.local',
    'user',
    'Test',
    'User',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '550e8400-e29b-41d4-a716-446655440000',
    'active',
    NULL,
    NULL,
    'UTC',
    'en'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample project
INSERT INTO projects (
    id,
    name,
    description,
    status,
    tenant_id,
    owner_id,
    start_date,
    end_date,
    tags,
    budget
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'Sample Project',
    'This is a sample project for testing purposes',
    'active',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    NOW(),
    NOW() + INTERVAL '30 days',
    '["sample", "test", "demo"]',
    10000.00
) ON CONFLICT (id) DO NOTHING;

-- Insert project members
INSERT INTO project_members (
    id,
    project_id,
    user_id,
    role,
    permissions
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'owner',
    '{"read": true, "write": true, "delete": true, "admin": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    'member',
    '{"read": true, "write": true, "delete": false, "admin": false}'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (
    id,
    title,
    description,
    status,
    priority,
    assignee_id,
    project_id,
    tenant_id,
    due_date,
    created_by,
    tags,
    estimated_hours
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440006',
    'Setup Development Environment',
    'Set up the development environment for the project',
    'todo',
    'high',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() + INTERVAL '7 days',
    '550e8400-e29b-41d4-a716-446655440001',
    '["setup", "development"]',
    8.0
),
(
    '550e8400-e29b-41d4-a716-446655440007',
    'Design User Interface',
    'Create wireframes and mockups for the user interface',
    'in_progress',
    'medium',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() + INTERVAL '14 days',
    '550e8400-e29b-41d4-a716-446655440001',
    '["design", "ui", "ux"]',
    16.0
),
(
    '550e8400-e29b-41d4-a716-446655440008',
    'Write Documentation',
    'Create comprehensive documentation for the project',
    'todo',
    'low',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() + INTERVAL '21 days',
    '550e8400-e29b-41d4-a716-446655440001',
    '["documentation", "writing"]',
    12.0
) ON CONFLICT (id) DO NOTHING;

-- Insert notification preferences
INSERT INTO notification_preferences (
    id,
    user_id,
    tenant_id,
    email_notifications,
    push_notifications,
    in_app_notifications,
    notification_types
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    true,
    true,
    '["task_assigned", "task_completed", "project_updated", "mention"]'
),
(
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    false,
    true,
    '["task_assigned", "task_completed"]'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (
    id,
    user_id,
    tenant_id,
    type,
    title,
    message,
    status,
    data
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'task_assigned',
    'Task Assigned',
    'You have been assigned to "Setup Development Environment"',
    'unread',
    '{"task_id": "550e8400-e29b-41d4-a716-446655440006", "project_id": "550e8400-e29b-41d4-a716-446655440003"}'
),
(
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'project_updated',
    'Project Updated',
    'Project "Sample Project" has been updated',
    'unread',
    '{"project_id": "550e8400-e29b-41d4-a716-446655440003"}'
) ON CONFLICT (id) DO NOTHING;

-- Update tenant owner reference
UPDATE tenants 
SET owner_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

echo "✅ Seed data inserted successfully!" 