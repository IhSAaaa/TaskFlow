import { Request, Response } from 'express';
import { logger } from '../../shared/src/utils/logger';
import { ProjectService } from '../services/projectService';
import { CreateProjectRequest, UpdateProjectRequest, ProjectFilter, AddMemberRequest, UpdateMemberRequest } from '../types/project';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectData: CreateProjectRequest = req.body;
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

      const project = await this.projectService.createProject(projectData, tenantId, userId);

      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in createProject:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project'
      });
    }
  };

  getProject = async (req: Request, res: Response): Promise<void> => {
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

      const project = await this.projectService.getProjectById(projectId, tenantId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
        return;
      }

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in getProject:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project'
      });
    }
  };

  updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const updateData: UpdateProjectRequest = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const project = await this.projectService.updateProject(projectId, updateData, tenantId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
        return;
      }

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      logger.error('Error in updateProject:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project'
      });
    }
  };

  deleteProject = async (req: Request, res: Response): Promise<void> => {
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

      const deleted = await this.projectService.deleteProject(projectId, tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteProject:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project'
      });
    }
  };

  getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const filter: ProjectFilter = {
        status: req.query.status as any,
        owner_id: req.query.owner_id as string,
        member_id: req.query.member_id as string,
        start_date_from: req.query.start_date_from ? new Date(req.query.start_date_from as string) : undefined,
        start_date_to: req.query.start_date_to ? new Date(req.query.start_date_to as string) : undefined,
        end_date_from: req.query.end_date_from ? new Date(req.query.end_date_from as string) : undefined,
        end_date_to: req.query.end_date_to ? new Date(req.query.end_date_to as string) : undefined,
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

      const result = await this.projectService.getProjects(filter, tenantId);

      res.json({
        success: true,
        data: result.projects,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      logger.error('Error in getProjects:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get projects'
      });
    }
  };

  addProjectMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const memberData: AddMemberRequest = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const member = await this.projectService.addProjectMember(projectId, memberData, tenantId);

      res.status(201).json({
        success: true,
        data: member,
        message: 'Member added to project successfully'
      });
    } catch (error) {
      logger.error('Error in addProjectMember:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add project member'
      });
    }
  };

  updateProjectMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId, memberId } = req.params;
      const updateData: UpdateMemberRequest = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const member = await this.projectService.updateProjectMember(projectId, memberId, updateData, tenantId);

      if (!member) {
        res.status(404).json({
          success: false,
          error: 'Project member not found'
        });
        return;
      }

      res.json({
        success: true,
        data: member,
        message: 'Project member updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateProjectMember:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project member'
      });
    }
  };

  removeProjectMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId, memberId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const removed = await this.projectService.removeProjectMember(projectId, memberId, tenantId);

      if (!removed) {
        res.status(404).json({
          success: false,
          error: 'Project member not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Project member removed successfully'
      });
    } catch (error) {
      logger.error('Error in removeProjectMember:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove project member'
      });
    }
  };

  getProjectMembers = async (req: Request, res: Response): Promise<void> => {
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

      // Verify project exists and belongs to tenant
      const project = await this.projectService.getProjectById(projectId, tenantId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
        return;
      }

      const members = await this.projectService.getProjectMembers(projectId);

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      logger.error('Error in getProjectMembers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project members'
      });
    }
  };
} 