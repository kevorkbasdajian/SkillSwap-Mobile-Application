//This file is the server. It makes the app listen at the port we specified.

const http = require("http");
const app = require("./app");
const config = require("./config/env");
const { initializeSocket } = require("./config/socket");

const PORT = config.port;

//Create HTTP server
const server = http.createServer(app);

//Initialize Socket.io
const io = initializeSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`SkillSwap API running on port ${PORT}`);
  console.log(`Environment : ${config.env}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Socket.io initialized`);
});
app.listen(PORT, () => {
  console.log(`SkillSwap API running on port ${PORT}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

/*
 We import the app and set it to listen at the port specified in the .env file
 We create a backend server and initialize the socket.io on it.
*/
