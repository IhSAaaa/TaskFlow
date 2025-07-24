import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'name', 'title').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// Task validation schemas
export const taskSchemas = {
  createTask: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    assignee_id: Joi.string().uuid().optional(),
    project_id: Joi.string().uuid().required(),
    due_date: Joi.date().iso().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    estimated_hours: Joi.number().positive().max(999.99).optional(),
    parent_task_id: Joi.string().uuid().optional()
  }),

  updateTask: Joi.object({
    title: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    status: Joi.string().valid('todo', 'in_progress', 'review', 'done', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    assignee_id: Joi.string().uuid().optional(),
    due_date: Joi.date().iso().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    estimated_hours: Joi.number().positive().max(999.99).optional(),
    actual_hours: Joi.number().positive().max(999.99).optional()
  }),

  taskFilter: Joi.object({
    status: Joi.string().valid('todo', 'in_progress', 'review', 'done', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    assignee_id: Joi.string().uuid().optional(),
    project_id: Joi.string().uuid().optional(),
    due_date_from: Joi.date().iso().optional(),
    due_date_to: Joi.date().iso().optional(),
    search: Joi.string().max(100).optional(),
    ...commonSchemas.pagination
  })
};

// Project validation schemas
export const projectSchemas = {
  createProject: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    budget: Joi.number().positive().max(999999999.99).optional(),
    members: Joi.array().items(Joi.string().uuid()).optional()
  }),

  updateProject: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').optional(),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    budget: Joi.number().positive().max(999999999.99).optional()
  }),

  projectFilter: Joi.object({
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').optional(),
    owner_id: Joi.string().uuid().optional(),
    search: Joi.string().max(100).optional(),
    ...commonSchemas.pagination
  }),

  addMember: Joi.object({
    user_id: Joi.string().uuid().required(),
    role: Joi.string().valid('owner', 'admin', 'member', 'viewer').default('member'),
    permissions: Joi.array().items(Joi.string()).optional()
  })
};

// Notification validation schemas
export const notificationSchemas = {
  createNotification: Joi.object({
    user_id: Joi.string().uuid().required(),
    title: Joi.string().min(1).max(255).required(),
    message: Joi.string().min(1).max(1000).required(),
    type: Joi.string().valid('task_assigned', 'task_completed', 'task_due_soon', 'task_overdue', 'project_invitation', 'project_update', 'comment_added', 'system_alert').required(),
    data: Joi.object().optional(),
    expires_at: Joi.date().iso().optional()
  }),

  notificationFilter: Joi.object({
    user_id: Joi.string().uuid().optional(),
    status: Joi.string().valid('unread', 'read').optional(),
    type: Joi.string().valid('task_assigned', 'task_completed', 'task_due_soon', 'task_overdue', 'project_invitation', 'project_update', 'comment_added', 'system_alert').optional(),
    ...commonSchemas.pagination
  })
};

// Tenant validation schemas
export const tenantSchemas = {
  createTenant: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    domain: Joi.string().domain().required(),
    subdomain: Joi.string().alphanum().min(3).max(63).optional(),
    plan: Joi.string().valid('free', 'basic', 'professional', 'enterprise').default('free'),
    owner_id: Joi.string().uuid().required(),
    settings: Joi.object().optional()
  }),

  updateTenant: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    domain: Joi.string().domain().optional(),
    subdomain: Joi.string().alphanum().min(3).max(63).optional(),
    plan: Joi.string().valid('free', 'basic', 'professional', 'enterprise').optional(),
    settings: Joi.object().optional()
  }),

  tenantFilter: Joi.object({
    status: Joi.string().valid('pending', 'active', 'suspended', 'cancelled').optional(),
    plan: Joi.string().valid('free', 'basic', 'professional', 'enterprise').optional(),
    search: Joi.string().max(100).optional(),
    ...commonSchemas.pagination
  })
};

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn(`Validation error for ${req.method} ${req.path}:`, errorDetails);
      
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      });
      return;
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn(`Query validation error for ${req.method} ${req.path}:`, errorDetails);
      
      res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errorDetails
      });
      return;
    }

    // Replace req.query with validated data
    req.query = value;
    next();
  };
};

// Params validation middleware
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn(`Params validation error for ${req.method} ${req.path}:`, errorDetails);
      
      res.status(400).json({
        success: false,
        error: 'Parameter validation failed',
        details: errorDetails
      });
      return;
    }

    // Replace req.params with validated data
    req.params = value;
    next();
  };
}; 