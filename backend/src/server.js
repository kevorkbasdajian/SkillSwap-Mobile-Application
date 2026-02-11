//This file is the server. It makes the app listen at the port we specified.

const app = require("./app");
const config = require("./config/env");

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 SkillSwap API running on port ${PORT}`);
  console.log(`📝 Environment: ${config.env}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

/*
 We import the app and set it to listen at the port specified in the .env file
*/
