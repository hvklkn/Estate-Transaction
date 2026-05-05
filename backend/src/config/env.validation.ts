import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  API_PREFIX: Joi.string().trim().default('api'),
  CORS_ORIGIN: Joi.string().trim().min(1).default('http://localhost:3000'),
  CORS_CREDENTIALS: Joi.boolean().default(false),
  PUBLIC_REGISTRATION_ENABLED: Joi.boolean().default(true),
  MONGODB_URI: Joi.string()
    .trim()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required()
    .messages({
      'string.pattern.base': 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"'
    }),
  MONGODB_DB: Joi.string().trim().default('iceberg'),
  SUPER_ADMIN_EMAIL: Joi.string().trim().email({ tlds: { allow: false } }).allow('').optional(),
  SUPER_ADMIN_PASSWORD: Joi.string().min(8).allow('').optional(),
  SUPER_ADMIN_NAME: Joi.string().trim().min(2).default('Super Admin'),
  SUPER_ADMIN_ORGANIZATION_NAME: Joi.string().trim().min(2).default('Iceberg Admin'),
  SUPER_ADMIN_ORGANIZATION_SLUG: Joi.string().trim().min(2).default('iceberg-admin'),
  RESEND_API_KEY: Joi.string().trim().allow('').optional(),
  RESEND_FROM_EMAIL: Joi.string().trim().email({ tlds: { allow: false } }).allow('').optional(),
  RESEND_FROM_NAME: Joi.string().trim().allow('').optional()
});
