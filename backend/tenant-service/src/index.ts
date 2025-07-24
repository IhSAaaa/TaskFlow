import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from '../shared/src/utils/logger';
import tenantRoutes from './routes/tenants';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.TENANT_SERVICE_PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'tenant-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/tenants', tenantRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  logger.info(`Tenant service running on port ${PORT}`);
});

export default app; 