const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

var username = {};

io.on('connection', socket => {

  console.log(socket.id, "connected");

  socket.on('message', message => {
    console.log(message);
  });

  socket.on('set-username', message => {
    username[socket.id] = message;
    console.log('ID', socket.id, "set", message);
  });

  socket.on('create', function (room) {
    socket.join(room);
    var statusReturn = {
      status: "Waiting",
      room: room,
      join: {
        socketId: "",
        username: ""
      },
      create: {
        socketId: socket.id,
        username: username[socket.id] || "PLAYER1"
      }
    };
    io.to(room).emit('status', statusReturn);
  });

  socket.on('join', function (room) {
    
    socket.join(room);
    var statusReturn = {
      status: "Start",
      room: room,
      join: {
        socketId: "",
        username: ""
      },
      create: {
        socketId: "",
        username: ""
      }
    };

    const clients = io.sockets.adapter.rooms.get(room);
    for (var socketId of clients) {
      if (socketId === socket.id) {
        statusReturn.join.socketId = socketId;
        statusReturn.join.username = username[socketId] || "";
      } else {
        statusReturn.create.socketId = socketId;
        statusReturn.create.username = username[socketId] || "";
      }
    }

    if (statusReturn.create.username === "") {
      statusReturn.status = "Not-found"
    }

    io.to(room).emit('status', statusReturn);
  });

  socket.on('playgame', message => {
    io.to(message["roomCode"]).emit('play-game', message);
  });

  socket.on('disconnect', () => {
    // remove nickName
    delete username[socket.id];
    console.log('User', socket.id, 'disconnected');
  });

});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = server