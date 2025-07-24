import { Request, Response } from 'express';
import { logger } from '../../shared/src/utils/logger';
import { UserService } from '../services/userService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const user = await this.userService.getUserById(userId);

      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      logger.error('Get profile error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get profile'
      });
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { firstName, lastName, email } = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const updatedUser = await this.userService.updateUser(userId, {
        firstName,
        lastName,
        email
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      logger.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      logger.error('Get user by ID error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get user'
      });
    }
  };

  searchUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, tenantId } = req.query;
      const users = await this.userService.searchUsers(q as string, tenantId as string);

      res.json({
        success: true,
        data: users
      });
    } catch (error: any) {
      logger.error('Search users error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to search users'
      });
    }
  };

  getUsersByProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const users = await this.userService.getUsersByProject(projectId);

      res.json({
        success: true,
        data: users
      });
    } catch (error: any) {
      logger.error('Get users by project error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get users by project'
      });
    }
  };
} 