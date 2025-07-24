import { User } from '../../shared/src/types';
import { logger } from '../../shared/src/utils/logger';
import { db } from '../../shared/src/utils/database';

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export class UserService {
  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex}`);
        values.push(data.firstName);
        paramIndex++;
      }

      if (data.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex}`);
        values.push(data.lastName);
        paramIndex++;
      }

      if (data.email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        values.push(data.email);
        paramIndex++;
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(userId);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  async searchUsers(query: string, tenantId: string): Promise<User[]> {
    try {
      const result = await db.query(
        `SELECT * FROM users 
         WHERE tenant_id = $1 
         AND (first_name ILIKE $2 OR last_name ILIKE $2 OR email ILIKE $2)
         ORDER BY first_name, last_name
         LIMIT 50`,
        [tenantId, `%${query}%`]
      );

      return result.rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }));
    } catch (error) {
      logger.error('Search users error:', error);
      throw error;
    }
  }

  async getUsersByProject(projectId: string): Promise<User[]> {
    try {
      const result = await db.query(
        `SELECT u.* FROM users u
         INNER JOIN project_members pm ON u.id = pm.user_id
         WHERE pm.project_id = $1
         ORDER BY u.first_name, u.last_name`,
        [projectId]
      );

      return result.rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }));
    } catch (error) {
      logger.error('Get users by project error:', error);
      throw error;
    }
  }
} 