const socketioJwt = require("socketio-jwt-decoder");
const secret = require("../config/auth").JWS.secret;

const Room = require("../models/room");
const Message = require("../models/message");

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

        socket.on('disconnect', () => {
            console.log("disconnect user");

            const userId = socket.decoded_token.id;

            let result = Room.find({'currentOnlineUsers.userId': userId});
            result.then(rooms => {
                if(rooms) {
                    for (const room of rooms)
                    {
                        let index = room.currentOnlineUsers.findIndex(element => element.userId === userId);
                        room.currentOnlineUsers.splice(index, 1);

                        room.save(err => {
                            if(err) {
                                console.log("couldn't remove this fucker");
                            }
                            else
                            {
                                chatNsp.in(room.id).emit('send user info', { users: room.currentOnlineUsers });
                            }
                        })
                    }
                }
            })
        });

        console.log("Hello " + socket.decoded_token.id);

        socket.on('join room', (data) => joinRoom(socket, data));
        socket.on('send message', (data) => onMessageSend(socket, data));
        socket.on('add url', (data) => addUrlToRoom(socket, data));
        socket.on('update queue', (data) => swapQueueForRoom(socket, data));
        socket.on('video paused', (data) => pauseVideoForSocket(socket, data));
        socket.on('video resume', (data) => resumeVideoForSocket(socket, data));
        socket.on('latest timestamp', () => {
            socket.to(getRoomOfSocket(socket)).emit('requestCurTimestamp')
        });
        socket.on('sendCurTimestamp', data => {
            saveCurrentSaveData(socket, data)
        });
        socket.on('nextVideo', () => {
            nextVideoOfQueue(socket)
        });
        socket.on('removeVideo', (data) => {
            removeVideo(socket, data);
        });
        socket.on('send user info', (data) => {
            const roomId = getRoomOfSocket(socket);
            const userId = socket.decoded_token.id;

            let result = Room.findOne({id: roomId});
            result.then(room => {
                if (room) {
                    const username = data.userInfo.userName;
                    const countyCode = data.userInfo.countryCode;

                    let userFound = false;
                    for (let i = 0; i < room.currentOnlineUsers.length; i++) {
                        if (room.currentOnlineUsers[i].userName === username) {
                            userFound = true;
                            break;
                        }
                    }

                    if(!userFound) {
                        room.currentOnlineUsers.push({userName: username, countryCode: countyCode, userId: userId});
                    }

                    room.save(err => {
                        if (err) {
                            disconnectSocket(socket, "something went wrong while saving");
                        }
                    });

                    chatNsp.in(roomId).emit('send user info', { users: room.currentOnlineUsers });
                }
            });
        });
    });

    // Data: msg, roomId
    const onMessageSend = function (socket, data) {
        let roomId = data.roomId;
        let message = data.msg;
        let userId = socket.decoded_token.id;
        if (!roomId && !message) {
            disconnectSocket(socket, "roomId: " + roomId + " message: " + message + " invalid data");
        }

        let newMessage = {
            sender: userId,
            line: message,
        };

        let result = Room.findOne({id: roomId});


        result.then(room => {
            if (room) {
                let messageResult = Message.create(newMessage);
                messageResult.then(msg => {
                    room.messages.push(msg.id);
                    room.save(err => {
                        if (err) {
                            disconnectSocket(socket, err);
                        }
                    });

                    chatNsp.in(roomId).emit('received message', {userId: data.name, message: data.msg});
                })
                    .catch(err => {
                        if (err) {
                            console.error(err);
                            disconnectSocket(socket, "Couldn't find the room");
                        }
                    });
            }
        }).catch(err => {
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
        if (rooms.length > 0) {
            rooms.forEach(value => {
                socket.leave(value);
            });
        }

        socket.join(roomId, function () {
            chatNsp.to(roomId).emit('joined room', 'hello');
        });
    };

    function addUrlToRoom(socket, data) {
        const link = data.link;
        let roomId = getRoomOfSocket(socket);

        const result = Room.findOne({id: roomId});
        result.then(room => {
            if (room) {
                room.queue.push({link: link, timestamp: Date.now(), position: room.queue.length});

                // If array length = 1; immediately play video.
                if (room.queue.length === 1) {
                    room.roomState.isPaused = false;
                    room.roomState.videostamp = Date.now();
                    chatNsp.in(roomId).emit('videoAddedPlay', {link: link});
                } else {
                    chatNsp.in(roomId).emit('videoAdded', {link: link});
                }

                room.save(err => {
                    if (err) {
                        disconnectSocket(socket, err);
                    }
                });
            } else {
                disconnectSocket(socket, "room not found")
            }
        });
    }

    function removeVideo(socket, data) {
        const position = data.position;
        let roomId = getRoomOfSocket(socket);

        const result = Room.findOne({id: roomId});
        result.then(room => {
            if (room) {
                room.queue.splice(position, 1);

                for (let queueItem of room.queue) {
                    if (Number(queueItem.position) >= position) {
                        queueItem.position--;
                    }
                }

                room.save(err => {
                    if (err) {
                        disconnectSocket(socket, err);
                    } else {
                        chatNsp.in(roomId).emit('removeVideo', {position: position});
                    }
                });
            } else {
                disconnectSocket(socket, "room not found")
            }
        });
    }

    function swapQueueForRoom(socket, data) {
        const from = data.from;
        const to = data.to;

        let roomId = getRoomOfSocket(socket);

        const result = Room.findOne({id: roomId});
        result.then(room => {
            if (room) {
                let foundTo;
                let foundFrom;
                for (let i = 0; i < room.queue.length; i++) {
                    if (room.queue[i].position === to) {
                        foundTo = i;
                    }

                    if (room.queue[i].position === from) {
                        foundFrom = i;
                    }
                }
                room.queue[foundFrom].position = to;
                room.queue[foundTo].position = from;

                room.save(err => {
                    if (err) {
                        disconnectSocket(socket, "something went wrong when reordering.");
                    } else {
                        chatNsp.in(roomId).emit('queue updated', {from: from, to: to});
                    }
                });

            } else {
                disconnectSocket(socket, "room not found")
            }
        });
    }

    function resumeVideoForSocket(socket, data) {
        const roomId = getRoomOfSocket(socket);

        const result = Room.findOne({id: roomId});
        result.then(room => {
            if (room) {
                if (room.roomState.isPaused) {
                    room.roomState.isPaused = false;
                    room.roomState.pausedAt = 0.0;

                    room.save(err => {
                        if (err) {
                            disconnectSocket(socket, "something went wrong while saving room");
                        }
                    });

                    chatNsp.in(roomId).emit('resume video');
                }
            } else {
                disconnectSocket(socket, "room does not exist");
            }
        })
    }

    function saveCurrentSaveData(socket, data) {
        socket.to(getRoomOfSocket(socket)).emit('resume video', {timestamp: data.timestamp});
    }

    function pauseVideoForSocket(socket, data) {
        const roomId = getRoomOfSocket(socket);

        const result = Room.findOne({id: roomId});
        result.then(room => {
            if (room) {
                // if already paused then let the client know where it was paused first.
                if (!room.roomState.isPaused) {
                    room.roomState.isPaused = true;
                    room.roomState.pausedAt = data.pausedAt;

                    room.save(err => {
                        if (err) {
                            disconnectSocket(socket, "something went wrong while pausing.");
                        }
                    });
                }

                chatNsp.in(roomId).emit('pause video', {pausedAt: room.roomState.pausedAt});
            } else {
                disconnectSocket(socket, "room does not exist");
            }
        })
    }

    function nextVideoOfQueue(socket) {
        const roomId = getRoomOfSocket(socket);

        const result = Room.findOne({id: roomId});
        result.then(room => {
            if (room) {
                for (let queueItem of room.queue) {
                    if (Number(queueItem.position) <= 0) {
                        let index = room.queue.indexOf(queueItem);
                        room.queue.splice(index, 1);
                    }
                }
                for (let queueItem of room.queue) {
                    queueItem.position--;
                }

                room.save(err => {
                    if (err) {
                        disconnectSocket(socket, "couldn't save the room")
                    }
                });

                chatNsp.in(roomId).emit('nextVideo');
            } else {
                disconnectSocket(socket, "couldn't find the room");
            }
        })
    }

    const disconnectSocket = function (socket, message) {
        console.log(message + "... disconnecting");
        socket.disconnect();
    };

    function getRoomOfSocket(socket) {
        return Object.keys(socket.rooms).filter(function (item) {
            return item !== socket.id;
        });
    }


    return io;
};
