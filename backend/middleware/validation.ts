import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { logger } from '../utils/logger';

export const validate = (schema: Schema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[property];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      logger.warn('Validation error:', {
        path: req.path,
        method: req.method,
        errors: errorDetails,
        userId: req.user?.id,
        tenantId: req.tenantId
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// Specific validation middleware for different request types
export const validateBody = (schema: Schema) => validate(schema, 'body');
export const validateQuery = (schema: Schema) => validate(schema, 'query');
export const validateParams = (schema: Schema) => validate(schema, 'params');

// Custom validation for file uploads
export const validateFileUpload = (maxSize: number = 10 * 1024 * 1024, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File size must not exceed ${maxSize / (1024 * 1024)}MB`
      });
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

// Validation for array of files
export const validateMultipleFiles = (maxFiles: number = 5, maxSize: number = 10 * 1024 * 1024, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    if (req.files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${maxFiles} files allowed`
      });
    }

    for (const file of req.files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File ${file.originalname} size must not exceed ${maxSize / (1024 * 1024)}MB`
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `File ${file.originalname} type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        });
      }
    }

    next();
  };
};

// Custom validation for date ranges
export const validateDateRange = (startDateField: string, endDateField: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startDate = req.body[startDateField];
    const endDate = req.body[endDateField];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: `${endDateField} must be after ${startDateField}`
        });
      }
    }

    next();
  };
};

// Validation for numeric ranges
export const validateNumericRange = (minField: string, maxField: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const min = req.body[minField];
    const max = req.body[maxField];

    if (min !== undefined && max !== undefined) {
      if (min >= max) {
        return res.status(400).json({
          success: false,
          error: `${maxField} must be greater than ${minField}`
        });
      }
    }

    next();
  };
};

// Validation for required fields based on conditions
export const validateConditionalFields = (conditions: Array<{
  field: string;
  required: string[];
  message?: string;
}>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const condition of conditions) {
      const fieldValue = req.body[condition.field];
      
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        for (const requiredField of condition.required) {
          if (!req.body[requiredField]) {
            return res.status(400).json({
              success: false,
              error: condition.message || `${requiredField} is required when ${condition.field} is provided`
            });
          }
        }
      }
    }

    next();
  };
};

// Validation for unique constraints
export const validateUnique = (model: any, field: string, excludeId?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = req.body[field];
      if (!value) {
        return next();
      }

      const query: any = { [field]: value };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existing = await model.findOne(query);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `${field} already exists`
        });
      }

      next();
    } catch (error) {
      logger.error('Unique validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Validation error occurred'
      });
    }
  };
};

// Validation for existence of referenced records
export const validateReference = (model: any, field: string, errorMessage?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = req.body[field];
      if (!value) {
        return next();
      }

      const existing = await model.findById(value);
      if (!existing) {
        return res.status(400).json({
          success: false,
          error: errorMessage || `Referenced ${field} does not exist`
        });
      }

      next();
    } catch (error) {
      logger.error('Reference validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Validation error occurred'
      });
    }
  };
};

// Validation for business rules
export const validateBusinessRule = (rule: (req: Request) => Promise<boolean | string>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rule(req);
      
      if (result === true) {
        return next();
      }
      
      if (typeof result === 'string') {
        return res.status(400).json({
          success: false,
          error: result
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Business rule validation failed'
      });
    } catch (error) {
      logger.error('Business rule validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Validation error occurred'
      });
    }
  };
};

// Export all validation middleware
export const validationMiddleware = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateFileUpload,
  validateMultipleFiles,
  validateDateRange,
  validateNumericRange,
  validateConditionalFields,
  validateUnique,
  validateReference,
  validateBusinessRule
}; 