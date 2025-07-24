import Joi from 'joi';

// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  phone: /^\+?[\d\s\-\(\)]{10,15}$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Common validation messages
const messages = {
  'string.email': 'Please provide a valid email address',
  'string.min': '{{#label}} must be at least {{#limit}} characters long',
  'string.max': '{{#label}} must not exceed {{#limit}} characters',
  'string.pattern.base': '{{#label}} format is invalid',
  'any.required': '{{#label}} is required',
  'any.only': '{{#label}} must be one of {{#valids}}',
  'date.base': '{{#label}} must be a valid date',
  'date.greater': '{{#label}} must be greater than {{#limit}}',
  'number.base': '{{#label}} must be a number',
  'number.min': '{{#label}} must be at least {{#limit}}',
  'number.max': '{{#label}} must not exceed {{#limit}}',
  'array.min': '{{#label}} must have at least {{#limit}} items',
  'array.max': '{{#label}} must not exceed {{#limit}} items'
};

// Auth validation schemas
export const authSchemas = {
  login: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required'
      })
  }),

  register: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    username: Joi.string()
      .pattern(patterns.username)
      .min(3)
      .max(20)
      .required()
      .messages({
        'string.pattern.base': 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        'any.required': 'Username is required'
      }),
    first_name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
        'any.required': 'First name is required'
      }),
    last_name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
        'any.required': 'Last name is required'
      }),
    password: Joi.string()
      .pattern(patterns.password)
      .min(8)
      .max(128)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'any.required': 'Password is required'
      }),
    tenant_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Tenant ID must be a valid UUID'
      })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  })
};

// User validation schemas
export const userSchemas = {
  updateProfile: Joi.object({
    first_name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters'
      }),
    last_name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters'
      }),
    phone: Joi.string()
      .pattern(patterns.phone)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    timezone: Joi.string()
      .valid('UTC', 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura')
      .optional()
      .messages({
        'any.only': 'Please select a valid timezone'
      }),
    language: Joi.string()
      .valid('en', 'id')
      .optional()
      .messages({
        'any.only': 'Please select a valid language'
      }),
    avatar_url: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Please provide a valid URL for avatar'
      })
  }),

  searchUsers: Joi.object({
    q: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Search query must be at least 2 characters long',
        'string.max': 'Search query must not exceed 100 characters',
        'any.required': 'Search query is required'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 50'
      })
  })
};

// Task validation schemas
export const taskSchemas = {
  createTask: Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .required()
      .messages({
        'string.min': 'Task title must be at least 3 characters long',
        'string.max': 'Task title must not exceed 200 characters',
        'any.required': 'Task title is required'
      }),
    description: Joi.string()
      .max(2000)
      .optional()
      .messages({
        'string.max': 'Task description must not exceed 2000 characters'
      }),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .default('medium')
      .messages({
        'any.only': 'Priority must be one of: low, medium, high, urgent'
      }),
    assignee_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Assignee ID must be a valid UUID'
      }),
    project_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Project ID must be a valid UUID',
        'any.required': 'Project ID is required'
      }),
    due_date: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.base': 'Due date must be a valid date',
        'date.greater': 'Due date must be in the future'
      }),
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Tags must not exceed 10 items',
        'string.min': 'Tag must be at least 1 character long',
        'string.max': 'Tag must not exceed 50 characters'
      }),
    estimated_hours: Joi.number()
      .min(0.1)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'Estimated hours must be a number',
        'number.min': 'Estimated hours must be at least 0.1',
        'number.max': 'Estimated hours must not exceed 1000'
      }),
    parent_task_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Parent task ID must be a valid UUID'
      })
  }),

  updateTask: Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Task title must be at least 3 characters long',
        'string.max': 'Task title must not exceed 200 characters'
      }),
    description: Joi.string()
      .max(2000)
      .optional()
      .messages({
        'string.max': 'Task description must not exceed 2000 characters'
      }),
    status: Joi.string()
      .valid('todo', 'in_progress', 'review', 'done', 'cancelled')
      .optional()
      .messages({
        'any.only': 'Status must be one of: todo, in_progress, review, done, cancelled'
      }),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .optional()
      .messages({
        'any.only': 'Priority must be one of: low, medium, high, urgent'
      }),
    assignee_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Assignee ID must be a valid UUID'
      }),
    due_date: Joi.date()
      .optional()
      .messages({
        'date.base': 'Due date must be a valid date'
      }),
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Tags must not exceed 10 items',
        'string.min': 'Tag must be at least 1 character long',
        'string.max': 'Tag must not exceed 50 characters'
      }),
    estimated_hours: Joi.number()
      .min(0.1)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'Estimated hours must be a number',
        'number.min': 'Estimated hours must be at least 0.1',
        'number.max': 'Estimated hours must not exceed 1000'
      }),
    actual_hours: Joi.number()
      .min(0)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'Actual hours must be a number',
        'number.min': 'Actual hours must be at least 0',
        'number.max': 'Actual hours must not exceed 1000'
      })
  }),

  taskFilters: Joi.object({
    status: Joi.string()
      .valid('todo', 'in_progress', 'review', 'done', 'cancelled')
      .optional()
      .messages({
        'any.only': 'Status must be one of: todo, in_progress, review, done, cancelled'
      }),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .optional()
      .messages({
        'any.only': 'Priority must be one of: low, medium, high, urgent'
      }),
    assignee_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Assignee ID must be a valid UUID'
      }),
    project_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Project ID must be a valid UUID'
      }),
    due_date_from: Joi.date()
      .optional()
      .messages({
        'date.base': 'Due date from must be a valid date'
      }),
    due_date_to: Joi.date()
      .min(Joi.ref('due_date_from'))
      .optional()
      .messages({
        'date.base': 'Due date to must be a valid date',
        'date.min': 'Due date to must be after due date from'
      }),
    search: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Search term must be at least 2 characters long',
        'string.max': 'Search term must not exceed 100 characters'
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      })
  }),

  assignTask: Joi.object({
    assignee_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Assignee ID must be a valid UUID',
        'any.required': 'Assignee ID is required'
      })
  })
};

// Project validation schemas
export const projectSchemas = {
  createProject: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Project name must be at least 3 characters long',
        'string.max': 'Project name must not exceed 100 characters',
        'any.required': 'Project name is required'
      }),
    description: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Project description must not exceed 1000 characters'
      }),
    start_date: Joi.date()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date'
      }),
    end_date: Joi.date()
      .min(Joi.ref('start_date'))
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date'
      }),
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Tags must not exceed 10 items',
        'string.min': 'Tag must be at least 1 character long',
        'string.max': 'Tag must not exceed 50 characters'
      }),
    budget: Joi.number()
      .min(0)
      .max(1000000000)
      .optional()
      .messages({
        'number.base': 'Budget must be a number',
        'number.min': 'Budget must be at least 0',
        'number.max': 'Budget must not exceed 1,000,000,000'
      }),
    members: Joi.array()
      .items(Joi.string().uuid())
      .max(50)
      .optional()
      .messages({
        'array.max': 'Members must not exceed 50 users',
        'string.guid': 'Member ID must be a valid UUID'
      })
  }),

  updateProject: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Project name must be at least 3 characters long',
        'string.max': 'Project name must not exceed 100 characters'
      }),
    description: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Project description must not exceed 1000 characters'
      }),
    status: Joi.string()
      .valid('planning', 'active', 'on_hold', 'completed', 'cancelled')
      .optional()
      .messages({
        'any.only': 'Status must be one of: planning, active, on_hold, completed, cancelled'
      }),
    start_date: Joi.date()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date'
      }),
    end_date: Joi.date()
      .min(Joi.ref('start_date'))
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date'
      }),
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Tags must not exceed 10 items',
        'string.min': 'Tag must be at least 1 character long',
        'string.max': 'Tag must not exceed 50 characters'
      }),
    budget: Joi.number()
      .min(0)
      .max(1000000000)
      .optional()
      .messages({
        'number.base': 'Budget must be a number',
        'number.min': 'Budget must be at least 0',
        'number.max': 'Budget must not exceed 1,000,000,000'
      })
  }),

  projectFilters: Joi.object({
    status: Joi.string()
      .valid('planning', 'active', 'on_hold', 'completed', 'cancelled')
      .optional()
      .messages({
        'any.only': 'Status must be one of: planning, active, on_hold, completed, cancelled'
      }),
    owner_id: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Owner ID must be a valid UUID'
      }),
    search: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Search term must be at least 2 characters long',
        'string.max': 'Search term must not exceed 100 characters'
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      })
  }),

  addProjectMember: Joi.object({
    user_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'User ID must be a valid UUID',
        'any.required': 'User ID is required'
      }),
    role: Joi.string()
      .valid('owner', 'admin', 'member', 'viewer')
      .default('member')
      .messages({
        'any.only': 'Role must be one of: owner, admin, member, viewer'
      }),
    permissions: Joi.array()
      .items(Joi.string().valid('read', 'write', 'delete', 'admin'))
      .optional()
      .messages({
        'any.only': 'Permissions must be one of: read, write, delete, admin'
      })
  })
};

// Notification validation schemas
export const notificationSchemas = {
  notificationFilters: Joi.object({
    status: Joi.string()
      .valid('unread', 'read')
      .optional()
      .messages({
        'any.only': 'Status must be one of: unread, read'
      }),
    type: Joi.string()
      .valid('task_assigned', 'task_completed', 'task_due_soon', 'task_overdue', 'project_invitation', 'project_update', 'comment_added', 'system_alert')
      .optional()
      .messages({
        'any.only': 'Type must be a valid notification type'
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      })
  }),

  updatePreferences: Joi.object({
    email_enabled: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Email enabled must be a boolean'
      }),
    push_enabled: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Push enabled must be a boolean'
      }),
    in_app_enabled: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'In-app enabled must be a boolean'
      }),
    task_assigned: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Task assigned must be a boolean'
      }),
    task_completed: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Task completed must be a boolean'
      }),
    task_due_soon: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Task due soon must be a boolean'
      }),
    task_overdue: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Task overdue must be a boolean'
      }),
    project_invitation: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Project invitation must be a boolean'
      }),
    project_update: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Project update must be a boolean'
      }),
    comment_added: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Comment added must be a boolean'
      }),
    system_alert: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'System alert must be a boolean'
      })
  })
};

// Common validation schemas
export const commonSchemas = {
  idParam: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'ID must be a valid UUID',
        'any.required': 'ID is required'
      })
  }),

  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      })
  })
};

// Export all schemas
export const validationSchemas = {
  auth: authSchemas,
  user: userSchemas,
  task: taskSchemas,
  project: projectSchemas,
  notification: notificationSchemas,
  common: commonSchemas
}; 