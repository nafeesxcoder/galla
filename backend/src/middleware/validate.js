// ===========================================================================
// REQUEST VALIDATION
// ---------------------------------------------------------------------------
// Nothing reaches a controller unchecked. The parsed, typed result replaces
// req.body / req.query / req.params, so a controller can never accidentally
// read a field that was not validated.
// ===========================================================================

const ApiError = require("../utils/ApiError");

function validate(schemas) {
  return (req, res, next) => {
    try {
      for (const key of ["body", "query", "params"]) {
        if (!schemas[key]) continue;

        const result = schemas[key].safeParse(req[key]);
        if (!result.success) {
          // Turn zod's output into { field: "message" }, which is what the
          // forms on the front end already know how to display.
          const details = {};
          for (const issue of result.error.issues) {
            const path = issue.path.join(".") || key;
            if (!details[path]) details[path] = issue.message;
          }
          throw ApiError.unprocessable("Some fields need fixing", details);
        }

        // Express 5 makes req.query a getter, so assigning to it throws.
        // Writing the parsed value to a separate property works on both.
        if (key === "query") req.validatedQuery = result.data;
        else req[key] = result.data;
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = validate;
