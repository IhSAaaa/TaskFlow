import { Router } from 'express';
import { TenantController } from '../controllers/tenantController';

const router = Router();
const tenantController = new TenantController();

// CRUD operations
router.post('/', tenantController.createTenant);
router.get('/', tenantController.getTenants);
router.get('/domain/:domain', tenantController.getTenantByDomain);
router.get('/:tenantId', tenantController.getTenant);
router.put('/:tenantId', tenantController.updateTenant);
router.delete('/:tenantId', tenantController.deleteTenant);

// Tenant management
router.get('/:tenantId/usage', tenantController.getTenantUsage);
router.put('/:tenantId/settings', tenantController.updateTenantSettings);
router.put('/:tenantId/activate', tenantController.activateTenant);
router.put('/:tenantId/suspend', tenantController.suspendTenant);
router.put('/:tenantId/upgrade-plan', tenantController.upgradeTenantPlan);

export default router; 