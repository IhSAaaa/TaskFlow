import { Pool } from 'pg';
import { logger } from '../../shared/src/utils/logger';
import { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskFilter, 
  TaskStatus, 
  TaskPriority 
} from '../types/task';

export class TaskService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'taskflow',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });
  }

  async createTask(taskData: CreateTaskRequest, tenantId: string, createdBy: string): Promise<Task> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO tasks (
          title, description, status, priority, assignee_id, project_id, 
          tenant_id, due_date, created_by, tags, estimated_hours, parent_task_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        taskData.title,
        taskData.description,
        TaskStatus.TODO,
        taskData.priority || TaskPriority.MEDIUM,
        taskData.assignee_id,
        taskData.project_id,
        tenantId,
        taskData.due_date,
        createdBy,
        taskData.tags ? JSON.stringify(taskData.tags) : null,
        taskData.estimated_hours,
        taskData.parent_task_id
      ];

      const result = await client.query(query, values);
      const task = result.rows[0];

      await client.query('COMMIT');
      
      logger.info(`Task created: ${task.id}`);
      return this.mapTaskFromDb(task);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating task:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTaskById(taskId: string, tenantId: string): Promise<Task | null> {
    const query = `
      SELECT * FROM tasks 
      WHERE id = $1 AND tenant_id = $2
    `;
    
    const result = await this.pool.query(query, [taskId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapTaskFromDb(result.rows[0]);
  }

  async updateTask(taskId: string, updateData: UpdateTaskRequest, tenantId: string): Promise<Task | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const existingTask = await this.getTaskById(taskId, tenantId);
      if (!existingTask) {
        throw new Error('Task not found');
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.title !== undefined) {
        updateFields.push(`title = $${paramCount++}`);
        values.push(updateData.title);
      }
      
      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(updateData.description);
      }
      
      if (updateData.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(updateData.status);
      }
      
      if (updateData.priority !== undefined) {
        updateFields.push(`priority = $${paramCount++}`);
        values.push(updateData.priority);
      }
      
      if (updateData.assignee_id !== undefined) {
        updateFields.push(`assignee_id = $${paramCount++}`);
        values.push(updateData.assignee_id);
      }
      
      if (updateData.due_date !== undefined) {
        updateFields.push(`due_date = $${paramCount++}`);
        values.push(updateData.due_date);
      }
      
      if (updateData.tags !== undefined) {
        updateFields.push(`tags = $${paramCount++}`);
        values.push(JSON.stringify(updateData.tags));
      }
      
      if (updateData.estimated_hours !== undefined) {
        updateFields.push(`estimated_hours = $${paramCount++}`);
        values.push(updateData.estimated_hours);
      }
      
      if (updateData.actual_hours !== undefined) {
        updateFields.push(`actual_hours = $${paramCount++}`);
        values.push(updateData.actual_hours);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(taskId, tenantId);

      const query = `
        UPDATE tasks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Task not found');
      }

      await client.query('COMMIT');
      
      logger.info(`Task updated: ${taskId}`);
      return this.mapTaskFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating task:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteTask(taskId: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM tasks 
      WHERE id = $1 AND tenant_id = $2
    `;
    
    const result = await this.pool.query(query, [taskId, tenantId]);
    
    if (result.rowCount === 0) {
      return false;
    }

    logger.info(`Task deleted: ${taskId}`);
    return true;
  }

  async assignTask(taskId: string, assigneeId: string, assignedBy: string, tenantId: string): Promise<Task | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if task exists
      const existingTask = await this.getTaskById(taskId, tenantId);
      if (!existingTask) {
        throw new Error('Task not found');
      }

      // Update task assignment
      const updateQuery = `
        UPDATE tasks 
        SET assignee_id = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [assigneeId, taskId, tenantId]);
      
      // Log assignment
      const assignmentQuery = `
        INSERT INTO task_assignments (task_id, assignee_id, assigned_by)
        VALUES ($1, $2, $3)
      `;
      
      await client.query(assignmentQuery, [taskId, assigneeId, assignedBy]);
      
      await client.query('COMMIT');
      
      logger.info(`Task ${taskId} assigned to ${assigneeId}`);
      return this.mapTaskFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error assigning task:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTasks(filter: TaskFilter, tenantId: string): Promise<{ tasks: Task[], total: number, page: number, limit: number }> {
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (filter.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filter.status);
    }

    if (filter.priority) {
      conditions.push(`priority = $${paramCount++}`);
      values.push(filter.priority);
    }

    if (filter.assignee_id) {
      conditions.push(`assignee_id = $${paramCount++}`);
      values.push(filter.assignee_id);
    }

    if (filter.project_id) {
      conditions.push(`project_id = $${paramCount++}`);
      values.push(filter.project_id);
    }

    if (filter.created_by) {
      conditions.push(`created_by = $${paramCount++}`);
      values.push(filter.created_by);
    }

    if (filter.due_date_from) {
      conditions.push(`due_date >= $${paramCount++}`);
      values.push(filter.due_date_from);
    }

    if (filter.due_date_to) {
      conditions.push(`due_date <= $${paramCount++}`);
      values.push(filter.due_date_to);
    }

    if (filter.tags && filter.tags.length > 0) {
      conditions.push(`tags ?| $${paramCount++}`);
      values.push(filter.tags);
    }

    if (filter.search) {
      conditions.push(`(title ILIKE $${paramCount++} OR description ILIKE $${paramCount++})`);
      values.push(`%${filter.search}%`, `%${filter.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM tasks ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM tasks 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);
    const result = await this.pool.query(query, values);

    const tasks = result.rows.map(row => this.mapTaskFromDb(row));

    return {
      tasks,
      total,
      page,
      limit
    };
  }

  async getTasksByProject(projectId: string, tenantId: string): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks 
      WHERE project_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
    `;
    
    const result = await this.pool.query(query, [projectId, tenantId]);
    
    return result.rows.map(row => this.mapTaskFromDb(row));
  }

  async getTasksByAssignee(assigneeId: string, tenantId: string): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks 
      WHERE assignee_id = $1 AND tenant_id = $2
      ORDER BY due_date ASC, priority DESC
    `;
    
    const result = await this.pool.query(query, [assigneeId, tenantId]);
    
    return result.rows.map(row => this.mapTaskFromDb(row));
  }

  async getSubTasks(parentTaskId: string, tenantId: string): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks 
      WHERE parent_task_id = $1 AND tenant_id = $2
      ORDER BY created_at ASC
    `;
    
    const result = await this.pool.query(query, [parentTaskId, tenantId]);
    
    return result.rows.map(row => this.mapTaskFromDb(row));
  }

  private mapTaskFromDb(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignee_id: row.assignee_id,
      project_id: row.project_id,
      tenant_id: row.tenant_id,
      due_date: row.due_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      tags: row.tags ? JSON.parse(row.tags) : [],
      estimated_hours: row.estimated_hours,
      actual_hours: row.actual_hours,
      parent_task_id: row.parent_task_id
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 