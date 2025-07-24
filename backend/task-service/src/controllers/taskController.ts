import { Request, Response } from 'express';
import { logger } from '../../shared/src/utils/logger';
import { TaskService } from '../services/taskService';
import { CreateTaskRequest, UpdateTaskRequest, TaskFilter } from '../types/task';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskData: CreateTaskRequest = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const task = await this.taskService.createTask(taskData, tenantId, userId);

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Error in createTask:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create task'
      });
    }
  };

  getTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const task = await this.taskService.getTaskById(taskId, tenantId);

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Error in getTask:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get task'
      });
    }
  };

  updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const updateData: UpdateTaskRequest = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const task = await this.taskService.updateTask(taskId, updateData, tenantId);

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Error in updateTask:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task'
      });
    }
  };

  deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const deleted = await this.taskService.deleteTask(taskId, tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteTask:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete task'
      });
    }
  };

  getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const filter: TaskFilter = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        assignee_id: req.query.assignee_id as string,
        project_id: req.query.project_id as string,
        created_by: req.query.created_by as string,
        due_date_from: req.query.due_date_from ? new Date(req.query.due_date_from as string) : undefined,
        due_date_to: req.query.due_date_to ? new Date(req.query.due_date_to as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const result = await this.taskService.getTasks(filter, tenantId);

      res.json({
        success: true,
        data: result.tasks,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      logger.error('Error in getTasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tasks'
      });
    }
  };

  assignTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { assignee_id } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;
      const assignedBy = req.headers['x-user-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!assignedBy) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      if (!assignee_id) {
        res.status(400).json({
          success: false,
          error: 'Assignee ID is required'
        });
        return;
      }

      const task = await this.taskService.assignTask(taskId, assignee_id, assignedBy, tenantId);

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        data: task,
        message: 'Task assigned successfully'
      });
    } catch (error) {
      logger.error('Error in assignTask:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign task'
      });
    }
  };

  getTasksByProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const tasks = await this.taskService.getTasksByProject(projectId, tenantId);

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      logger.error('Error in getTasksByProject:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project tasks'
      });
    }
  };

  getTasksByAssignee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assigneeId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const tasks = await this.taskService.getTasksByAssignee(assigneeId, tenantId);

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      logger.error('Error in getTasksByAssignee:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get assignee tasks'
      });
    }
  };

  getSubTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const subtasks = await this.taskService.getSubTasks(taskId, tenantId);

      res.json({
        success: true,
        data: subtasks
      });
    } catch (error) {
      logger.error('Error in getSubTasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get subtasks'
      });
    }
  };
} 