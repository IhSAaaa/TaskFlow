import { Request, Response } from 'express';
import { logger } from '../../shared/src/utils/logger';
import { TenantService } from '../services/tenantService';
import { CreateTenantRequest, UpdateTenantRequest, TenantFilter, TenantPlan } from '../types/tenant';

export class TenantController {
  private tenantService: TenantService;

  constructor() {
    this.tenantService = new TenantService();
  }

  createTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantData: CreateTenantRequest = req.body;

      if (!tenantData.name || !tenantData.domain || !tenantData.owner_id) {
        res.status(400).json({
          success: false,
          error: 'Name, domain, and owner_id are required'
        });
        return;
      }

      const tenant = await this.tenantService.createTenant(tenantData);

      res.status(201).json({
        success: true,
        data: tenant
      });
    } catch (error) {
      logger.error('Error in createTenant:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create tenant'
      });
    }
  };

  getTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;

      const tenant = await this.tenantService.getTenantById(tenantId);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      logger.error('Error in getTenant:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tenant'
      });
    }
  };

  getTenantByDomain = async (req: Request, res: Response): Promise<void> => {
    try {
      const { domain } = req.params;

      const tenant = await this.tenantService.getTenantByDomain(domain);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      logger.error('Error in getTenantByDomain:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tenant by domain'
      });
    }
  };

  updateTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const updateData: UpdateTenantRequest = req.body;

      const tenant = await this.tenantService.updateTenant(tenantId, updateData);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      logger.error('Error in updateTenant:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update tenant'
      });
    }
  };

  deleteTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;

      const deleted = await this.tenantService.deleteTenant(tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteTenant:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete tenant'
      });
    }
  };

  getTenants = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: TenantFilter = {
        status: req.query.status as any,
        plan: req.query.plan as any,
        owner_id: req.query.owner_id as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await this.tenantService.getTenants(filter);

      res.json({
        success: true,
        data: result.tenants,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      logger.error('Error in getTenants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tenants'
      });
    }
  };

  getTenantUsage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;

      const usage = await this.tenantService.getTenantUsage(tenantId);

      if (!usage) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: usage
      });
    } catch (error) {
      logger.error('Error in getTenantUsage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tenant usage'
      });
    }
  };

  updateTenantSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const settings = req.body;

      const tenant = await this.tenantService.updateTenantSettings(tenantId, settings);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: tenant,
        message: 'Tenant settings updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateTenantSettings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update tenant settings'
      });
    }
  };

  activateTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;

      const tenant = await this.tenantService.activateTenant(tenantId);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: tenant,
        message: 'Tenant activated successfully'
      });
    } catch (error) {
      logger.error('Error in activateTenant:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate tenant'
      });
    }
  };

  suspendTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;

      const tenant = await this.tenantService.suspendTenant(tenantId);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: tenant,
        message: 'Tenant suspended successfully'
      });
    } catch (error) {
      logger.error('Error in suspendTenant:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to suspend tenant'
      });
    }
  };

  upgradeTenantPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const { plan } = req.body;

      if (!plan || !Object.values(TenantPlan).includes(plan)) {
        res.status(400).json({
          success: false,
          error: 'Valid plan is required'
        });
        return;
      }

      const tenant = await this.tenantService.upgradeTenantPlan(tenantId, plan);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: tenant,
        message: `Tenant plan upgraded to ${plan} successfully`
      });
    } catch (error) {
      logger.error('Error in upgradeTenantPlan:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upgrade tenant plan'
      });
    }
  };
} 