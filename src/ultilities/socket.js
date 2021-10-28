const io = require("socket.io-client");

class Socket {
  constructor() {};
  connect = async (namespace, token) => {
    return new Promise((resolve, reject) => {
      const socket = io(`${process.env.SOCKET_SERVER || "http://localhost:3002"}/${namespace}`, {
        auth: { token },
        transports: ["polling"],
      });
    
      socket.on("connect", () => {
        return resolve(socket);
      });
  
      socket.on("connect_error", (err) => {
        return reject(err);
      });
  
    })
  }
}

module.exports = Socket;