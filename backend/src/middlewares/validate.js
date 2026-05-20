// This file is to validate by using any schema
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // return all errors, not only the first one
      stripUnknown: true, // remove unknown fields
    });
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }
    req.validatedData = value;
    next();
  };
};
module.exports = validate;

/*
1- This function returns a middleware function that checks data against a schema
2- If errors exist, we return an array of errors, indicating where is the error coming from
and what is the message of the error.
3- Otherwise, we assign the validatedData of the req to be the value returned from schema.validate
*/
