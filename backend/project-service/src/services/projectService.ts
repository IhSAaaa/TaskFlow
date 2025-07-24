import { Pool } from 'pg';
import { logger } from '../../shared/src/utils/logger';
import { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectFilter, 
  ProjectStatus, 
  ProjectMember,
  ProjectRole,
  AddMemberRequest,
  UpdateMemberRequest
} from '../types/project';

export class ProjectService {
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

  async createProject(projectData: CreateProjectRequest, tenantId: string, ownerId: string): Promise<Project> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO projects (
          name, description, status, tenant_id, owner_id, 
          start_date, end_date, tags, budget
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        projectData.name,
        projectData.description,
        ProjectStatus.PLANNING,
        tenantId,
        ownerId,
        projectData.start_date,
        projectData.end_date,
        projectData.tags ? JSON.stringify(projectData.tags) : null,
        projectData.budget
      ];

      const result = await client.query(query, values);
      const project = result.rows[0];

      // Add owner as project member
      await this.addProjectMemberInternal(client, project.id, ownerId, ProjectRole.OWNER, ['*']);

      // Add other members if specified
      if (projectData.members && projectData.members.length > 0) {
        for (const memberId of projectData.members) {
          if (memberId !== ownerId) {
            await this.addProjectMemberInternal(client, project.id, memberId, ProjectRole.MEMBER, ['read', 'write']);
          }
        }
      }

      await client.query('COMMIT');
      
      logger.info(`Project created: ${project.id}`);
      return await this.getProjectById(project.id, tenantId) as Project;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating project:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getProjectById(projectId: string, tenantId: string): Promise<Project | null> {
    const query = `
      SELECT p.*, 
             COALESCE(
               (SELECT COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM tasks WHERE project_id = p.id), 0) * 100
                FROM tasks 
                WHERE project_id = p.id AND status = 'done'), 0
             ) as progress
      FROM projects p
      WHERE p.id = $1 AND p.tenant_id = $2
    `;
    
    const result = await this.pool.query(query, [projectId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const project = result.rows[0];
    const members = await this.getProjectMembers(projectId);
    
    return this.mapProjectFromDb(project, members);
  }

  async updateProject(projectId: string, updateData: UpdateProjectRequest, tenantId: string): Promise<Project | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const existingProject = await this.getProjectById(projectId, tenantId);
      if (!existingProject) {
        throw new Error('Project not found');
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      
      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(updateData.description);
      }
      
      if (updateData.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(updateData.status);
      }
      
      if (updateData.start_date !== undefined) {
        updateFields.push(`start_date = $${paramCount++}`);
        values.push(updateData.start_date);
      }
      
      if (updateData.end_date !== undefined) {
        updateFields.push(`end_date = $${paramCount++}`);
        values.push(updateData.end_date);
      }
      
      if (updateData.tags !== undefined) {
        updateFields.push(`tags = $${paramCount++}`);
        values.push(JSON.stringify(updateData.tags));
      }
      
      if (updateData.budget !== undefined) {
        updateFields.push(`budget = $${paramCount++}`);
        values.push(updateData.budget);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(projectId, tenantId);

      const query = `
        UPDATE projects 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Project not found');
      }

      await client.query('COMMIT');
      
      logger.info(`Project updated: ${projectId}`);
      return await this.getProjectById(projectId, tenantId);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating project:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteProject(projectId: string, tenantId: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete project members first
      await client.query('DELETE FROM project_members WHERE project_id = $1', [projectId]);
      
      // Delete project
      const result = await client.query(
        'DELETE FROM projects WHERE id = $1 AND tenant_id = $2',
        [projectId, tenantId]
      );
      
      await client.query('COMMIT');
      
      if (result.rowCount === 0) {
        return false;
      }

      logger.info(`Project deleted: ${projectId}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error deleting project:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getProjects(filter: ProjectFilter, tenantId: string): Promise<{ projects: Project[], total: number, page: number, limit: number }> {
    const conditions: string[] = ['p.tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (filter.status) {
      conditions.push(`p.status = $${paramCount++}`);
      values.push(filter.status);
    }

    if (filter.owner_id) {
      conditions.push(`p.owner_id = $${paramCount++}`);
      values.push(filter.owner_id);
    }

    if (filter.member_id) {
      conditions.push(`pm.user_id = $${paramCount++}`);
    }

    if (filter.start_date_from) {
      conditions.push(`p.start_date >= $${paramCount++}`);
      values.push(filter.start_date_from);
    }

    if (filter.start_date_to) {
      conditions.push(`p.start_date <= $${paramCount++}`);
      values.push(filter.start_date_to);
    }

    if (filter.end_date_from) {
      conditions.push(`p.end_date >= $${paramCount++}`);
      values.push(filter.end_date_from);
    }

    if (filter.end_date_to) {
      conditions.push(`p.end_date <= $${paramCount++}`);
      values.push(filter.end_date_to);
    }

    if (filter.search) {
      conditions.push(`(p.name ILIKE $${paramCount++} OR p.description ILIKE $${paramCount++})`);
      values.push(`%${filter.search}%`, `%${filter.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const joinClause = filter.member_id ? 'LEFT JOIN project_members pm ON p.id = pm.project_id' : '';

    // Count total
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) 
      FROM projects p 
      ${joinClause} 
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT DISTINCT p.*, 
             COALESCE(
               (SELECT COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM tasks WHERE project_id = p.id), 0) * 100
                FROM tasks 
                WHERE project_id = p.id AND status = 'done'), 0
             ) as progress
      FROM projects p 
      ${joinClause} 
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);
    const result = await this.pool.query(query, values);

    const projects = await Promise.all(
      result.rows.map(async (row) => {
        const members = await this.getProjectMembers(row.id);
        return this.mapProjectFromDb(row, members);
      })
    );

    return {
      projects,
      total,
      page,
      limit
    };
  }

  async addProjectMember(projectId: string, memberData: AddMemberRequest, tenantId: string): Promise<ProjectMember> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if project exists and belongs to tenant
      const project = await this.getProjectById(projectId, tenantId);
      if (!project) {
        throw new Error('Project not found');
      }

      const member = await this.addProjectMemberInternal(
        client, 
        projectId, 
        memberData.user_id, 
        memberData.role, 
        memberData.permissions || ['read']
      );

      await client.query('COMMIT');
      
      logger.info(`Member added to project ${projectId}: ${memberData.user_id}`);
      return member;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error adding project member:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateProjectMember(projectId: string, memberId: string, updateData: UpdateMemberRequest, tenantId: string): Promise<ProjectMember | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if project exists and belongs to tenant
      const project = await this.getProjectById(projectId, tenantId);
      if (!project) {
        throw new Error('Project not found');
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.role !== undefined) {
        updateFields.push(`role = $${paramCount++}`);
        values.push(updateData.role);
      }
      
      if (updateData.permissions !== undefined) {
        updateFields.push(`permissions = $${paramCount++}`);
        values.push(JSON.stringify(updateData.permissions));
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(projectId, memberId);

      const query = `
        UPDATE project_members 
        SET ${updateFields.join(', ')}
        WHERE project_id = $${paramCount++} AND user_id = $${paramCount++}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Project member not found');
      }

      await client.query('COMMIT');
      
      logger.info(`Project member updated: ${memberId} in project ${projectId}`);
      return this.mapProjectMemberFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating project member:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async removeProjectMember(projectId: string, memberId: string, tenantId: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if project exists and belongs to tenant
      const project = await this.getProjectById(projectId, tenantId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Don't allow removing the owner
      if (project.owner_id === memberId) {
        throw new Error('Cannot remove project owner');
      }

      const result = await client.query(
        'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, memberId]
      );
      
      await client.query('COMMIT');
      
      if (result.rowCount === 0) {
        return false;
      }

      logger.info(`Project member removed: ${memberId} from project ${projectId}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error removing project member:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const query = `
      SELECT * FROM project_members 
      WHERE project_id = $1
      ORDER BY joined_at ASC
    `;
    
    const result = await this.pool.query(query, [projectId]);
    
    return result.rows.map(row => this.mapProjectMemberFromDb(row));
  }

  private async addProjectMemberInternal(
    client: any, 
    projectId: string, 
    userId: string, 
    role: ProjectRole, 
    permissions: string[]
  ): Promise<ProjectMember> {
    const query = `
      INSERT INTO project_members (project_id, user_id, role, permissions)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await client.query(query, [projectId, userId, role, JSON.stringify(permissions)]);
    
    return this.mapProjectMemberFromDb(result.rows[0]);
  }

  private mapProjectFromDb(row: any, members: ProjectMember[]): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      tenant_id: row.tenant_id,
      owner_id: row.owner_id,
      start_date: row.start_date,
      end_date: row.end_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tags: row.tags ? JSON.parse(row.tags) : [],
      budget: row.budget,
      progress: row.progress || 0,
      members
    };
  }

  private mapProjectMemberFromDb(row: any): ProjectMember {
    return {
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      role: row.role,
      joined_at: row.joined_at,
      permissions: row.permissions ? JSON.parse(row.permissions) : []
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 