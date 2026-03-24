const parseJsonFields = (fields) => (req, res, next) => {
  try {
    fields.forEach((field) => {
      let value = req.body[field];

      if (!value) return;

      if (Array.isArray(value)) {
        value = value[0];
      }

      if (typeof value === "string") {
        req.body[field] = JSON.parse(value);
      }
    });

    console.log("AFTER PARSE:", req.body);
    next();
  } catch (err) {
    console.log("PARSE ERROR:", err.message);
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format",
    });
  }
};
module.exports = parseJsonFields;
