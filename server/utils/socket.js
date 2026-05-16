const { Server } = require("socket.io");

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: true, // Allow any origin that accesses the app (Safe on cPanel)
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ["polling", "websocket"],
      pingTimeout: 60000, 
      pingInterval: 25000,
      allowEIO3: true
    });

    console.log("⚡ Bulletproof Socket.io Engine ready for cPanel.");
    return io;
  },
  getIO: () => {
    if (!io) {
      // Return a dummy object if not initialized to avoid crashes
      console.warn("⚠️ Socket.io not initialized.");
      return { emit: () => {} };
    }
    return io;
  },
};
