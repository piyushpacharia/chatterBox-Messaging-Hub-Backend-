const dotenv = require("dotenv");
dotenv.config()
let io;
function initializeSocket(server) {
  io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.CORS_ORIGIN,
    },
  });
  io.on("connection", (socket) => {
    console.log("connected to socket.io");

    socket.on("setup-user", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });

    socket.on("join-chat", (room) => {
      socket.join(room);
      console.log("user joined the room : " + room);
    });

    socket.on("new-message", (data) => {
      io.to(data.messageId).emit("new-message", data.message);
    });
    socket.on("new-group-message", (data) => {
      io.to(data.groupId).emit("new-group-message", data.message);
      console.log(data);
      console.log(data.message);
    });
    socket.on("pending-request", (data) => {
      io.to(data.friends).emit("pending-request", data);
    });
    socket.on("accept-friend-request", (data) => {
      io.to(data.friends).emit("accept-friend-request", data);
    });
    socket.on("unfriend-friend", (data) => {
      io.to(data.connectionId).emit("unfriend-friend", data);
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });
}
function getSocket() {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }
  return io;
}

module.exports = { initializeSocket, getSocket };
