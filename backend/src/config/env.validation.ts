import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  API_PREFIX: Joi.string().trim().default('api'),
  CORS_ORIGIN: Joi.string().trim().min(1).default('http://localhost:3000'),
  CORS_CREDENTIALS: Joi.boolean().default(false),
  MONGODB_URI: Joi.string()
    .trim()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required()
    .messages({
      'string.pattern.base': 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"'
    }),
  MONGODB_DB: Joi.string().trim().default('iceberg')
});
