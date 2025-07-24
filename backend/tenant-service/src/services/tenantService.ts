import { Pool } from 'pg';
import { logger } from '../../shared/src/utils/logger';
import { 
  Tenant, 
  CreateTenantRequest, 
  UpdateTenantRequest, 
  TenantFilter, 
  TenantStatus, 
  TenantPlan,
  TenantSettings,
  TenantUsage,
  TenantBilling
} from '../types/tenant';

export class TenantService {
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

  async createTenant(tenantData: CreateTenantRequest): Promise<Tenant> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Set default settings based on plan
      const defaultSettings = this.getDefaultSettings(tenantData.plan || TenantPlan.FREE);
      const settings = { ...defaultSettings, ...tenantData.settings };
      
      const query = `
        INSERT INTO tenants (
          name, domain, subdomain, status, plan, settings, owner_id,
          max_users, max_projects, max_storage_gb, features
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const planLimits = this.getPlanLimits(tenantData.plan || TenantPlan.FREE);
      
      const values = [
        tenantData.name,
        tenantData.domain,
        tenantData.subdomain,
        TenantStatus.PENDING,
        tenantData.plan || TenantPlan.FREE,
        JSON.stringify(settings),
        tenantData.owner_id,
        planLimits.maxUsers,
        planLimits.maxProjects,
        planLimits.maxStorage,
        JSON.stringify(planLimits.features)
      ];

      const result = await client.query(query, values);
      const tenant = result.rows[0];

      await client.query('COMMIT');
      
      logger.info(`Tenant created: ${tenant.id}`);
      return this.mapTenantFromDb(tenant);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    const query = `
      SELECT * FROM tenants 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapTenantFromDb(result.rows[0]);
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const query = `
      SELECT * FROM tenants 
      WHERE domain = $1 OR subdomain = $1
    `;
    
    const result = await this.pool.query(query, [domain]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapTenantFromDb(result.rows[0]);
  }

  async updateTenant(tenantId: string, updateData: UpdateTenantRequest): Promise<Tenant | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const existingTenant = await this.getTenantById(tenantId);
      if (!existingTenant) {
        throw new Error('Tenant not found');
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      
      if (updateData.domain !== undefined) {
        updateFields.push(`domain = $${paramCount++}`);
        values.push(updateData.domain);
      }
      
      if (updateData.subdomain !== undefined) {
        updateFields.push(`subdomain = $${paramCount++}`);
        values.push(updateData.subdomain);
      }
      
      if (updateData.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(updateData.status);
      }
      
      if (updateData.plan !== undefined) {
        updateFields.push(`plan = $${paramCount++}`);
        values.push(updateData.plan);
        
        // Update limits based on new plan
        const planLimits = this.getPlanLimits(updateData.plan);
        updateFields.push(`max_users = $${paramCount++}`);
        values.push(planLimits.maxUsers);
        updateFields.push(`max_projects = $${paramCount++}`);
        values.push(planLimits.maxProjects);
        updateFields.push(`max_storage_gb = $${paramCount++}`);
        values.push(planLimits.maxStorage);
        updateFields.push(`features = $${paramCount++}`);
        values.push(JSON.stringify(planLimits.features));
      }
      
      if (updateData.settings !== undefined) {
        const currentSettings = existingTenant.settings;
        const newSettings = { ...currentSettings, ...updateData.settings };
        updateFields.push(`settings = $${paramCount++}`);
        values.push(JSON.stringify(newSettings));
      }
      
      if (updateData.max_users !== undefined) {
        updateFields.push(`max_users = $${paramCount++}`);
        values.push(updateData.max_users);
      }
      
      if (updateData.max_projects !== undefined) {
        updateFields.push(`max_projects = $${paramCount++}`);
        values.push(updateData.max_projects);
      }
      
      if (updateData.max_storage_gb !== undefined) {
        updateFields.push(`max_storage_gb = $${paramCount++}`);
        values.push(updateData.max_storage_gb);
      }
      
      if (updateData.features !== undefined) {
        updateFields.push(`features = $${paramCount++}`);
        values.push(JSON.stringify(updateData.features));
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(tenantId);

      const query = `
        UPDATE tenants 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      await client.query('COMMIT');
      
      logger.info(`Tenant updated: ${tenantId}`);
      return this.mapTenantFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Soft delete - mark as cancelled
      const result = await client.query(
        'UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2',
        [TenantStatus.CANCELLED, tenantId]
      );
      
      await client.query('COMMIT');
      
      if (result.rowCount === 0) {
        return false;
      }

      logger.info(`Tenant deleted: ${tenantId}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error deleting tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTenants(filter: TenantFilter): Promise<{ tenants: Tenant[], total: number, page: number, limit: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filter.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filter.status);
    }

    if (filter.plan) {
      conditions.push(`plan = $${paramCount++}`);
      values.push(filter.plan);
    }

    if (filter.owner_id) {
      conditions.push(`owner_id = $${paramCount++}`);
      values.push(filter.owner_id);
    }

    if (filter.search) {
      conditions.push(`(name ILIKE $${paramCount++} OR domain ILIKE $${paramCount++} OR subdomain ILIKE $${paramCount++})`);
      values.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM tenants ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM tenants 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);
    const result = await this.pool.query(query, values);

    const tenants = result.rows.map(row => this.mapTenantFromDb(row));

    return {
      tenants,
      total,
      page,
      limit
    };
  }

  async getTenantUsage(tenantId: string): Promise<TenantUsage | null> {
    const query = `
      SELECT 
        t.id as tenant_id,
        COALESCE((SELECT COUNT(*) FROM users WHERE tenant_id = t.id), 0) as current_users,
        COALESCE((SELECT COUNT(*) FROM projects WHERE tenant_id = t.id), 0) as current_projects,
        COALESCE((SELECT SUM(file_size_gb) FROM files WHERE tenant_id = t.id), 0) as current_storage_gb,
        NOW() as last_updated
      FROM tenants t
      WHERE t.id = $1
    `;
    
    const result = await this.pool.query(query, [tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return {
      tenant_id: result.rows[0].tenant_id,
      current_users: parseInt(result.rows[0].current_users),
      current_projects: parseInt(result.rows[0].current_projects),
      current_storage_gb: parseFloat(result.rows[0].current_storage_gb) || 0,
      last_updated: result.rows[0].last_updated
    };
  }

  async updateTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<Tenant | null> {
    const existingTenant = await this.getTenantById(tenantId);
    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    const updatedSettings = { ...existingTenant.settings, ...settings };
    
    return await this.updateTenant(tenantId, { settings: updatedSettings });
  }

  async activateTenant(tenantId: string): Promise<Tenant | null> {
    return await this.updateTenant(tenantId, { status: TenantStatus.ACTIVE });
  }

  async suspendTenant(tenantId: string): Promise<Tenant | null> {
    return await this.updateTenant(tenantId, { status: TenantStatus.SUSPENDED });
  }

  async upgradeTenantPlan(tenantId: string, newPlan: TenantPlan): Promise<Tenant | null> {
    const planLimits = this.getPlanLimits(newPlan);
    
    return await this.updateTenant(tenantId, {
      plan: newPlan,
      max_users: planLimits.maxUsers,
      max_projects: planLimits.maxProjects,
      max_storage_gb: planLimits.maxStorage,
      features: planLimits.features
    });
  }

  private getDefaultSettings(plan: TenantPlan): TenantSettings {
    const baseSettings: TenantSettings = {
      theme: {
        primary_color: '#3B82F6',
        secondary_color: '#1F2937',
        logo_url: undefined,
        favicon_url: undefined
      },
      features: {
        task_management: true,
        project_management: true,
        time_tracking: plan !== TenantPlan.FREE,
        reporting: plan !== TenantPlan.FREE,
        integrations: plan === TenantPlan.PROFESSIONAL || plan === TenantPlan.ENTERPRISE,
        api_access: plan === TenantPlan.ENTERPRISE
      },
      notifications: {
        email_enabled: true,
        push_enabled: true,
        sms_enabled: plan !== TenantPlan.FREE
      },
      security: {
        two_factor_required: plan === TenantPlan.ENTERPRISE,
        session_timeout_minutes: 480,
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_special_chars: false
        }
      },
      integrations: {
        slack_enabled: plan !== TenantPlan.FREE,
        github_enabled: plan === TenantPlan.PROFESSIONAL || plan === TenantPlan.ENTERPRISE,
        jira_enabled: plan === TenantPlan.ENTERPRISE,
        trello_enabled: plan === TenantPlan.ENTERPRISE
      }
    };

    return baseSettings;
  }

  private getPlanLimits(plan: TenantPlan): {
    maxUsers: number;
    maxProjects: number;
    maxStorage: number;
    features: string[];
  } {
    switch (plan) {
      case TenantPlan.FREE:
        return {
          maxUsers: 5,
          maxProjects: 3,
          maxStorage: 1,
          features: ['task_management', 'project_management']
        };
      case TenantPlan.BASIC:
        return {
          maxUsers: 25,
          maxProjects: 10,
          maxStorage: 10,
          features: ['task_management', 'project_management', 'time_tracking', 'reporting']
        };
      case TenantPlan.PROFESSIONAL:
        return {
          maxUsers: 100,
          maxProjects: 50,
          maxStorage: 100,
          features: ['task_management', 'project_management', 'time_tracking', 'reporting', 'integrations', 'slack', 'github']
        };
      case TenantPlan.ENTERPRISE:
        return {
          maxUsers: -1, // Unlimited
          maxProjects: -1, // Unlimited
          maxStorage: 1000,
          features: ['task_management', 'project_management', 'time_tracking', 'reporting', 'integrations', 'api_access', 'slack', 'github', 'jira', 'trello']
        };
      default:
        return this.getPlanLimits(TenantPlan.FREE);
    }
  }

  private mapTenantFromDb(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      subdomain: row.subdomain,
      status: row.status,
      plan: row.plan,
      settings: row.settings ? JSON.parse(row.settings) : this.getDefaultSettings(row.plan),
      created_at: row.created_at,
      updated_at: row.updated_at,
      owner_id: row.owner_id,
      max_users: row.max_users,
      max_projects: row.max_projects,
      max_storage_gb: row.max_storage_gb,
      features: row.features ? JSON.parse(row.features) : []
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 