// This file is a structured Socket.IO setup

//Needed to create the websocket server
const { Server } = require("socket.io");

const { verifyToken } = require("../utils/jwt");
const config = require("./env");

let io;

//Takes HTTP server as input, attaches Socket.io to i, configures it, and returns the io instance.
const initializeSOcket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  /*Connection Handler (when connection happens, execute the callback function)
  - io.on() means listen to an event on the server.
  - io.use() is for middleware, like authentication, validation etc...
  - "connection" : reserved event name, fires when a new client connects.
  */

  /* Each connected user gets:
    - own socket instance
    - own event listeners
    - own data storage
 */

  io.on("connection", (socket) => {
    console.log(`User connect: ${socket.userId}`);

    //Join user's personal room
    socket.join(`user:${socket.userId}`);

    //Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }
  return io;
};

module.exports = { initializeSOcket, getIO };

/*
1- initializeSocket: Takes the backend http server, attaches socket.io to it, and configures it.
2- 2nd step is authentication of the user through verifying the token provided, and attaching the userId and userEmail to the socket.
3- 3rd step is to listen for connection, and once detected is to create a room for the connected user, and join it to the server. Next
that socket should listen for the event of disconnection.
4- getIo: returns the instance of the server.
*/
