import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

// Test database configuration
export const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'taskflow_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
};

// Test utilities class
export class TestUtils {
  private static pool: Pool;

  static async initializeTestDb(): Promise<Pool> {
    if (!this.pool) {
      this.pool = new Pool(testDbConfig);
      
      // Test connection
      try {
        await this.pool.query('SELECT NOW()');
        logger.info('Test database connected successfully');
      } catch (error) {
        logger.error('Failed to connect to test database:', error);
        throw error;
      }
    }
    
    return this.pool;
  }

  static async cleanupTestDb(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null as any;
    }
  }

  static async clearTables(): Promise<void> {
    const pool = await this.initializeTestDb();
    
    const tables = [
      'task_assignments',
      'task_comments',
      'notifications',
      'notification_preferences',
      'tasks',
      'project_members',
      'projects',
      'users',
      'tenants'
    ];

    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      } catch (error) {
        logger.warn(`Failed to clear table ${table}:`, error);
      }
    }
  }

  // Generate test data
  static generateTestTenant(overrides: any = {}): any {
    return {
      id: uuidv4(),
      name: `Test Tenant ${Date.now()}`,
      domain: `test-${Date.now()}.taskflow.com`,
      subdomain: `test-${Date.now()}`,
      status: 'active',
      plan: 'professional',
      owner_id: uuidv4(),
      max_users: 100,
      max_projects: 50,
      max_storage_gb: 100,
      features: ['task_management', 'project_management'],
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static generateTestUser(overrides: any = {}): any {
    return {
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      first_name: 'Test',
      last_name: 'User',
      password_hash: '$2b$10$hashedpassword',
      tenant_id: uuidv4(),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static generateTestProject(overrides: any = {}): any {
    return {
      id: uuidv4(),
      name: `Test Project ${Date.now()}`,
      description: 'Test project description',
      status: 'active',
      tenant_id: uuidv4(),
      owner_id: uuidv4(),
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static generateTestTask(overrides: any = {}): any {
    return {
      id: uuidv4(),
      title: `Test Task ${Date.now()}`,
      description: 'Test task description',
      status: 'todo',
      priority: 'medium',
      assignee_id: uuidv4(),
      project_id: uuidv4(),
      tenant_id: uuidv4(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      created_by: uuidv4(),
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static generateTestNotification(overrides: any = {}): any {
    return {
      id: uuidv4(),
      user_id: uuidv4(),
      tenant_id: uuidv4(),
      title: `Test Notification ${Date.now()}`,
      message: 'Test notification message',
      type: 'task_assigned',
      status: 'unread',
      created_at: new Date(),
      ...overrides
    };
  }

  // Insert test data helpers
  static async insertTestTenant(pool: Pool, tenantData: any): Promise<any> {
    const query = `
      INSERT INTO tenants (
        id, name, domain, subdomain, status, plan, owner_id,
        max_users, max_projects, max_storage_gb, features, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      tenantData.id,
      tenantData.name,
      tenantData.domain,
      tenantData.subdomain,
      tenantData.status,
      tenantData.plan,
      tenantData.owner_id,
      tenantData.max_users,
      tenantData.max_projects,
      tenantData.max_storage_gb,
      JSON.stringify(tenantData.features),
      tenantData.created_at,
      tenantData.updated_at
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async insertTestUser(pool: Pool, userData: any): Promise<any> {
    const query = `
      INSERT INTO users (
        id, email, username, first_name, last_name, password_hash,
        tenant_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      userData.id,
      userData.email,
      userData.username,
      userData.first_name,
      userData.last_name,
      userData.password_hash,
      userData.tenant_id,
      userData.status,
      userData.created_at,
      userData.updated_at
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async insertTestProject(pool: Pool, projectData: any): Promise<any> {
    const query = `
      INSERT INTO projects (
        id, name, description, status, tenant_id, owner_id,
        start_date, end_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      projectData.id,
      projectData.name,
      projectData.description,
      projectData.status,
      projectData.tenant_id,
      projectData.owner_id,
      projectData.start_date,
      projectData.end_date,
      projectData.created_at,
      projectData.updated_at
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async insertTestTask(pool: Pool, taskData: any): Promise<any> {
    const query = `
      INSERT INTO tasks (
        id, title, description, status, priority, assignee_id,
        project_id, tenant_id, due_date, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      taskData.id,
      taskData.title,
      taskData.description,
      taskData.status,
      taskData.priority,
      taskData.assignee_id,
      taskData.project_id,
      taskData.tenant_id,
      taskData.due_date,
      taskData.created_by,
      taskData.created_at,
      taskData.updated_at
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async insertTestNotification(pool: Pool, notificationData: any): Promise<any> {
    const query = `
      INSERT INTO notifications (
        id, user_id, tenant_id, title, message, type, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      notificationData.id,
      notificationData.user_id,
      notificationData.tenant_id,
      notificationData.title,
      notificationData.message,
      notificationData.type,
      notificationData.status,
      notificationData.created_at
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // HTTP request helpers
  static createTestRequest(overrides: any = {}): any {
    return {
      body: {},
      query: {},
      params: {},
      headers: {
        'x-tenant-id': uuidv4(),
        'x-user-id': uuidv4(),
        'content-type': 'application/json'
      },
      ip: '127.0.0.1',
      method: 'GET',
      url: '/test',
      ...overrides
    };
  }

  static createTestResponse(): any {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      getHeader: jest.fn(),
      headers: {}
    };
    
    return res;
  }

  // Assertion helpers
  static expectSuccessResponse(res: any, expectedData?: any) {
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expectedData || expect.anything()
      })
    );
  }

  static expectErrorResponse(res: any, statusCode: number, errorMessage?: string) {
    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.any(String)
      })
    );
    
    if (errorMessage) {
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: errorMessage
        })
      );
    }
  }

  static expectValidationError(res: any, fieldName?: string) {
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: fieldName || expect.any(String),
            message: expect.any(String)
          })
        ])
      })
    );
  }
} 