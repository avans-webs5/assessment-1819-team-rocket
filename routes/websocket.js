const socketioJwt = require("socketio-jwt-decoder");
const secret = require("../config/auth").JWS.secret;

const Room = require("../models/room");

module.exports = function (io) {
    // io.on('connection', function (socket) {
    //     console.log("user connected");
    //     socket.on('my message', (msg) => {
    //
    //
    //         io.emit('chat message', msg);
    //     });
    //
    //     socket.on('disconnect', function () {
    //         console.log('user disconnected');
    //     });
    // });


    io.use(socketioJwt.authorize({
        secret: secret,
        handshake: true
    }));

    io.on('connection', (socket) => {
        if (!socket.decoded_token) {
            disconnectSocket(socket, "Decoded token is undefined");
        }

        console.log("Hello " + socket.decoded_token.id);

        socket.on('my message', (data) => onMessageSend(socket, data));
    });

    // Data: message, roomId
    const onMessageSend = function (socket, data) {
        let roomId = data.roomId;
        let message = data.message;
        let userId = socket.decoded_token.id;
        if (!roomId && !message) {
            disconnectSocket(socket, "roomId: "+ roomId + " message: " + message + " invalid data");
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


    const disconnectSocket = function (socket, message) {
        console.log(message);
        console.log("... disconnecting");
        socket.disconnect();
    };

    return io;
};
