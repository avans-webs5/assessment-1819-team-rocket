const socketioJwt = require("socketio-jwt-decoder");
const secret = require("../config/auth").JWS.secret;

const Room = require("../models/room");

module.exports = function (io) {
    io.use(socketioJwt.authorize({
        secret: secret,
        handshake: true
    }));

    const chatNsp = io.of("/chat");
    chatNsp.use(socketioJwt.authorize({
        secret: secret,
        handshake: true
    }));

    chatNsp.on('connection', (socket) => {
        if (!socket.decoded_token) {
            disconnectSocket(socket, "Decoded token is undefined");
            return;
        }

        console.log("Hello " + socket.decoded_token.id);

        socket.on('join room', (data) => joinRoom(socket, data));
        // socket.on('my message', (data) => onMessageSend(socket, data));
        socket.on('send message', (data) => {
            chatNsp.in(data.roomId).emit('received message', {userId: data.name, message: data.msg});
        });
    });

    // Data: message, roomId
    const onMessageSend = function (socket, data) {
        let roomId = data.roomId;
        let message = data.message;
        let userId = socket.decoded_token.id;
        if (!roomId && !message) {
            disconnectSocket(socket, "roomId: " + roomId + " message: " + message + " invalid data");
        }

        let result = Room.findOne({id: roomId}).populate(
            "messages.user",
            "name"
        );

        result
            .then(room => {
                if (room) {
                    room.messages.push({user: userId, line: message});

                    room.save(function (err) {
                        if (err) {
                            console.error(err);
                            disconnectSocket(socket, "Couldn't save the message");
                        }

                        io.emit('chat message', message);
                    });
                }
            })
            .catch(err => {
                if (err) {
                    console.error(err);
                    disconnectSocket(socket, "Couldn't find the room");
                }
            });
    };

    // Data: roomId
    const joinRoom = function (socket, data) {
        const roomId = data.roomId;
        const rooms = socket.adapter.rooms;
        if(rooms.length > 0)
        {
            rooms.forEach(value => {
                socket.leave(value);
            });
        }

        socket.join(roomId, function () {
            chatNsp.in(roomId).emit('joined room', 'hello');
        });
    };

    const disconnectSocket = function (socket, message) {
        console.log(message);
        console.log("... disconnecting");
        socket.disconnect();
    };

    return io;
};
