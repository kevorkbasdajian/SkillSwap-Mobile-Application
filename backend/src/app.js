// This file is the main express server

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config/env");

//Importing routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const skillRoutes = require("./routes/skillRoutes");
const friendRoutes = require("./routes/friendRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();

//Security middleware
app.use(helmet());

//CORS configuration
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);

//Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups", groupRoutes);

//Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "SkillSwap API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

//Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(config.env === "development" && { stack: err.stack }),
  });
});

module.exports = app;

/*DOCUMENTATION
1- we import the needed libraries. cors allows other servers to communicate.
helmet ensures security by setting HTTP headers.
config file streamlines the environment variables needed.
2- setup the 'app' express server.
3- using json to allow and accept json data sent by the frontend.
4-urlencoded is to read and change the variables that are part of the link such as key=value&key2=value2.
5- Health check endpoint responds to GET requests to check if the API is working.
6- 404 handler is to respond to request paths that do not exist.
7- Custom error handler called whenever next(err) or error is thrown. returns
the error message or internal server error and if in development mode the error stack.
8- Routes section: register the individual routes and assign them unique paths.
*/
