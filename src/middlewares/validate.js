'use strict';

/**
 * Zod schema validation middleware factory.
 * Validates req.body against the provided Zod schema.
 * On failure, returns 400 with structured error messages.
 *
 * Usage: router.post('/route', validate(myZodSchema), handler)
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace req.body with the parsed (and coerced) data
    req.body = result.data;
    next();
  };
}

/**
 * Validate req.query against a Zod schema.
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors,
      });
    }

    req.query = result.data;
    next();
  };
}

module.exports = { validate, validateQuery };
