const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages.js');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users.js');

//set static folder
app.use(express.static(path.join(__dirname, 'public')));


//Run when a client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        //welcome currnet user
        socket.emit('message', formatMessage('Jaarvis', 'Welcome to Starky!'));
       
        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage('Jaarvis', `Sir ${user.username} has joined the chat`));
  
          //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room:user.room,
            users: getRoomUsers(user.room)
        });
    });
   
    //Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit(
            'message',
            formatMessage(user.username, msg));
    });

       //Runs when client disconnects
       socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage('Jaarvis', `Sir, ${user.username}  has left the chat`));
            

            //Send users and room info
            io.to(user.room).emit('roomUsers', {
                room:user.room,
                users: getRoomUsers(user.room)
            });
        };

    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));