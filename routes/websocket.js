const socketioJwt   = require("socketio-jwt-decoder");
const secret = require("../config/auth").JWS.secret;

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
        console.log("Hello " + socket.decoded_token.id);

        socket.on('my message', (msg) => {
            io.emit('chat message', msg);
        });
    });

    return io;
};
