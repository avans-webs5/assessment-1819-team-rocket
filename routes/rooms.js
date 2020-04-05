const express = require("express");
const router = express.Router();
const YouTube = require('simple-youtube-api');
const youtube = new YouTube('AIzaSyDD5bpQqcWno1Ukswe3ZqA_1fXF-w9Ht9I');

const Room = require("../models/room");
const Message = require("../models/message");

module.exports = function (passport, user) {

    function getRooms(req, res) {
        console.log(req.query);
        let result = Room.find({})
            .byName(req.query.name)
            .byIdUsers(req.query.user)
            .byPage(req.query.pageIndex, req.query.pageSize)
            .byCategories(req.query.category);

        result.then(rooms => {
            return res.status(200).json({
                rooms,
                statusCode: 200,
                message: "OK",
                pageIndex: {page: req.query.pageIndex || 0, items: req.query.pageSize || rooms.length}
            });
        }).catch(err => {
            console.error(err);
            return res
                .status(400)
                .send("Bad Request");
        });
    }

    function getRoom(req, res) {
        let result = Room.findOne({id: req.params.id});
        result
            .then(room => {
                if (room) {
                    console.log(room);
                    return res.status(200).json({room, statusCode: 200, message: "OK"});
                } else {
                    return res.status(404).send("Room Not Found")
                }
            })
            .catch(err => {
                if (err) {
                    console.error(err);
                    return res
                        .status(400)
                        .send("Bad Request");
                }
            });
    }

    function createRoom(req, res) {
        if (!req.body.name)
            return res.status(400).send("Bad Request");

        const roomId = req.body.name.replace(/\s/g, "_");
        let result = Room.findOne({id: roomId});

        result.then(room => {
            if (!room) {
                let newRoom = {
                    id: roomId.toLowerCase(),
                    name: req.body.name,
                    categories: req.body.categories,
                    password: Room.generateHash(req.body.password) || "",
                    picture: req.body.picture || "",
                    blacklist: {
                        enabled: req.body.blacklistEnabled || false,
                        users: req.body.blacklistUsers || []
                    },
                    users: [],
                    messages: [],
                    videos: [],
                    roomState: {
                        isPaused: true
                    }
                };

                let newUser = {
                    user: req.user.id,
                    roles: ["owner"]
                };

                newRoom.users.push(newUser);

                Room.create(newRoom, function (err, room) {
                    if (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .send("Internal Server Error");
                    }
                    res.status(201).json({room, statusCode: 201, message: "Created"});
                });
            } else {
                res
                    .status(400)
                    .send("Room name already in use");
            }
        });
    }

    function updateRoom(req, res) {

        console.log(req.body);
        if (req.body.name) req.body.id = req.body.name.replace(/\s/g, "_");
        if (req.body.password) req.body.password = Room.generateHash(req.body.password);
        let result = Room.findOneAndUpdate({id: req.params.id}, req.body, {new: true});

        result.then(room => {
            if (room) {
                return res.status(200).json({room, statusCode: 200, message: "OK"});
            } else {
                return res.status(404).send("Room not found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function deleteRoom(req, res) {
        let result = Room.deleteOne({id: req.params.id});
        result.then(() => {
            return res.status(200).json({statusCode: 200, message: "OK"});
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function getRoomUsers(req, res) {
        let result = Room.findOne({id: req.params.id})
            .populate("allUsers");
        result.then(room => {
            if (room) {
                if (room.users && room.users.length > 0) {
                    return res.status(200).json({users: room.users, statusCode: 200, message: "OK"});
                } else {
                    return res.status(404).send("Users Not Found");
                }
            } else {
                return res.status(404).send("Room Not Found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).json("Internal Server Error");
        });
    }

    function getRoomUser(req, res) {
        let userId = req.params.userId.replace("_", "#");
        let result = Room.findOne({id: req.params.id, "users.user": userId}).populate('allUsers');
        result.then(room => {
            if (room) {
                if (room.users && room.users.length > 0) {
                    return res.status(200).json({user: room.users[0], statusCode: 200, message: "OK"});
                } else {
                    return res.status(404).send("User Not Found")
                }
            } else {
                return res.status(404).send("Room Not Found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function addUserToRoom(req, res) {
        let result = Room.findOne({id: req.params.id});

        result.then(room => {
            if (!room) {
                return res.status(999).send("Room Not Found");
            }
            if (room.password && (!room.validHashedPassword(req.body.password) && !room.containsUser(req.user.id))) {
                return res.status(403).send("Password incorrect");
            } else {

                if (req.user && !room.containsUser(req.user.id)) {

                    room.users.push({user: req.user.id, roles: ["guest"]});
                    room.save(function (err, updatedRoom) {
                        if (err) {
                            console.error(err);
                            return res.status(500).send("Internal Server Error");
                        }
                        return res.status(200).json({users: updatedRoom.users, statusCode: 200, message: "OK"});
                    });
                } else {
                    return res.status(202).send();
                }
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function deleteUserFromRoom(req, res) {
        let userId = req.params.userId.replace("_", "#");
        let result = Room.findOne({id: req.params.id});

        result.then(room => {
            if (room) {
                let userFound = false;
                for (user of room.users) {
                    if (user.user.toString() === userId) {
                        room.users.remove(user);
                        userFound = true;
                    }
                }
                if (!userFound) return res.status(404).send("User Not Found");

                room.save(function (err, updatedRoom) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Internal Server Error");
                    }
                    return res.status(200).json({users: updatedRoom.users, statusCode: 200, message: "OK"});
                });
            } else {
                return res.status(404).send("User not found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function getMessages(req, res) {
        let result = Room.findOne({id: req.params.id}).populate({
            path: 'messages',
            populate: {path: 'sender', select: 'name', model: 'User'}
        });

        result.then(room => {
            if (room) {
                return res.status(200).json({messages: room.messages || [], statusCode: 200, message: "OK"});
            } else {
                return res.status(404).send("Room not found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(400).send("Bad Request");
        });
    }

    function getMessage(req, res) {
        const messagePopulation = {
            path: "messages", populate: {path: "user", select: "name"}
        };

        let result = Room.findOne({id: req.params.id}).populate(messagePopulation);

        result.then(room => {
            const userMessage = room.getMessageById(req.params.messageId);

            if (userMessage) return res.status(200).json({userMessage, statusCode: 200, message: "OK"});
            else return res.status(404).send("Message Not Found");
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function updateRoomMessage(req, res) {
        let result = Room.findOne({id: req.params.id}).populate("messages");

        result.then(room => {
            if (req.body.line) {
                const updatedMessage = room.updateMessageById(req.params.messageId, req.body.line);
                room.save(function (err, room) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Internal Server Error");
                    }
                    return res.status(200).json({updatedMessage, statusCode: 200, message: "OK"});
                });
            } else {
                return res.status(400).send("No Message Given");
            }
        }).catch(err => {
            console.error(err);
            return res
                .status(500)
                .json("Internal Server Error");
        });
    }

    function deleteRoomMessage(req, res) {
        let result = Room.findOne({id: req.params.id});
        result.then(room => {
            if (room) {
                if (room.removeMessageById(req.params.messageId)) {
                    room.save(function (err) {
                        if (err) {
                            console.error(err);
                            return res.status(500).json("Internal Server Error");
                        }
                    });
                    return res.status(200).json({statusCode: 200, message: "OK"});
                }
                return res.status(404).send("Message Not Found");
            } else {
                return res
                    .status(404)
                    .send("Room Not Found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function getRoomCategories(req, res) {
        let result = Room.findOne({id: req.params.id});
        result.then(room => {
            if (room) res.status(200).json({categories: room.categories, statusCode: 200, message: "OK"});
            else res.status(404).send("Room not found");
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function getRoomCategory(req, res) {
        let result = Room.findOne({id: req.params.id});
        result.then(room => {
            if (room) {
                if (!room.categories.includes(req.params.categoryId)) {
                    res.status(404).send("Category not found");
                } else {
                    res.status(200).json({category: req.params.categoryId, statusCode: 200, message: "OK"});
                }
            } else res.status(404).send("Room not found");
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function addRoomCategory(req, res) {
        if (!req.body.category) return res.status(400).send("Category not given");

        let result = Room.findOne({id: req.params.id});

        result.then(room => {
            if (room) {
                if (!room.categories.includes(req.body.category.toLowerCase())) {

                    room.categories.push(req.body.category.toLowerCase());
                    room.save((err, updatedRoom) => {
                        if (err) {
                            console.error(err);
                            res.status(500).send("Internal Server Error");
                        } else res.status(200).json({
                            categories: updatedRoom.categories,
                            statusCode: 200,
                            message: "OK"
                        });
                    });

                } else res.status(204).send();
            } else res.status(404).send("Room not found");
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function removeRoomCategory(req, res) {
        let result = Room.findOne({id: req.params.id});
        result.then(room => {

            if (room) {
                if (room.categories.includes(req.params.categoryId)) {
                    room.removeCategoryById(req.params.categoryId);
                    room.save((err) => {
                        if (err) res.status(500).send("Internal Server Error");
                        res.status(200).json({statusCode: 200, message: "OK"});
                    });
                } else {
                    res.status(404).send("Category not found");
                }
            } else res.status(404).send("Room not found");
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function getUserMessages(req, res) {
        let userId = req.params.userId.replace("_", "#");
        let result = Room.findOne({id: req.params.id}).populate('messages');

        result.then(room => {
            let messages = room.getMessagesByUserId(userId) || [];
            if (messages.length > 0) {
                return res.status(200).json({messages, statusCode: 200, message: "OK"});
            } else {
                return res.status(404).send("No messages found");
            }
        }).catch(err => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });

    }

    function postUserMessage(req, res) {
        let result = Room.findOne({id: req.params.id});
        result.then(room => {
            if (room) {
                let newMessage = {
                    sender: req.user.id,
                    line: req.body.line
                };

                let messageResult = Message.create(newMessage);
                messageResult.then(msg => {
                    room.messages.push(msg.id);
                    room.save(err => {
                        if (err) {
                            console.error(err);
                            res.status(500).send("Internal Server Error");
                        } else {
                            res.status(201).json({msg, statusCode: 201, message: "Message Created"})
                        }
                    });
                }).catch(err => {
                    console.error(err);
                    res.status(500).send("Internal Server Error")
                });

            }

        }).catch(err => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
    }

    function getUserRoles(req, res) {
        let result = Room.findOne({id: req.params.id, 'users.user': req.params.userId}).select("users.roles");
        result.then(user => {
            if (user) {
                console.log(user);
                return res.status(200).json({roles: user.users[0].roles, statusCode: 200, message: "OK"});
            } else {
                return res.status(404).send("Room Not Found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function addRoleToUser(req, res) {
        if (!req.body.role) {
            return res.status(400).send("Not A Valid Role");
        }

        let result = Room.findOne({id: req.params.id, 'users.user': req.params.userId}).select("users.roles");
        result.then(room => {
            if (room) {
                if (room.users[0].roles.includes(req.body.role)) return res.status(202).send();
                room.users[0].roles.push(req.body.role);
                room.users[0].roles.remove("guest");

                room.save(err => {
                    if (err) return res.status(500).send("Internal Server Error");
                    return res.status(200).json({roles: room.users[0].roles, statusCode: 200, message: "OK"})
                });

            } else {
                return res.status(404).send("Room Not Found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function getUserRole(req, res) {
        let result = Room.findOne({id: req.params.id, 'users.user': req.params.userId}).select("users.roles");
        result.then(user => {
            if (user) {
                console.log(user);
                if (user.roles.include(req.params.role)) {
                    return res.status(200).json({role: req.params.role, statusCode: 200, message: "OK"});
                } else {
                    return res.status(404).send("Role Not Found");
                }

            } else {
                return res.status(404).send("Room Not Found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function removeRoleFromUser(req, res) {
        if (req.params.roleId === "guest") return res.status(400).send("Can Not Remove Guest Role");

        let result = Room.findOne({
            id: req.params.id,
            'users.user': req.params.userId,
            'users.roles': req.params.roleId
        }).select("users.roles");
        result.then(room => {
            if (room) {
                room.users[0].roles.remove(req.params.roleId);
                if (room.users[0].roles.length < 1) room.users[0].roles.push("guest");

                room.save(err => {
                    if (err) return res.status(500).send("Internal Server Error");
                    return res.status(200).json({roles: room.users[0].roles, statusCode: 200, message: "OK"})
                });
            } else {
                return res.status(404).send("Room Or Roles Not Found")
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function updateRoleFromUser(req, res) {
        if (!req.body.role) {
            return res.status(400).send("Not A Valid Role")
        }

        let result = Room.findOne({
            id: req.params.id,
            'users.user': req.params.userId,
            'users.roles': req.params.roleId
        }).select("users.roles");
        result.then(room => {
            if (room) {
                room.users[0].roles.remove(req.params.roleId);
                room.users[0].roles.push(req.body.role);

                room.save(err => {
                    if (err) return res.status(500).send("Internal Server Error");
                    return res.status(200).json({roles: room.users[0].roles, statusCode: 200, message: "OK"})
                });

            } else {
                return res.status(404).send("Room Or Roles Not Found")
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function getVideoInformation(req, res) {
        let result = Room.findOne({id: req.params.id});

        result.then(room => {
            if (room) {
                let clip = room.queue[req.params.videoPosition];
                if (room.queue.length > 0 && clip) {

                    youtube.getVideo(decodeURIComponent(clip.link))
                        .then(v => {
                            let video = {
                                title: v.title,
                                description: v.description,
                                duration: v.duration.hours + ':' + v.duration.minutes + ':' + v.duration.seconds,
                                link: clip.link,
                                position: clip.position,
                                timestamp: clip.timestamp,
                            };
                            return res.status(200).json({video, statusCode: 200, message: "OK"})
                        }).catch(err => {
                        console.error(err);
                        return res.status(500).send("Internal Server Error");
                    });

                } else {
                    return res.status(404).send("Video Not Found");
                }
            } else {
                return res.status(404).send("Room Not Found");
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        });
    }

    function getVideosFromQueue(req, res) {
        let result = Room.findOne({id: req.params.id});
        result.then(room => {
            if (room) {
                if (room.queue.length > 0) {
                    return res.status(200).json({videos: room.queue, statusCode: 200, message: "OK"})

                } else {
                    return res.status(404).send("Videos Not Found");
                }
            } else {
                return res.status(404).send("Room Not Found");
            }
        });
    }

    router.route("/")
        .get(getRooms)
        .post(passport.authenticate("jwt", {session: false}), user.can("join room"), createRoom)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, POST"});
        });

    /////////////////////////////
    ////:id/////////////////////
    ///////////////////////////

    router.route("/:id")
        .get(getRoom)
        .put(passport.authenticate("jwt", {session: false}), user.can("edit room"), updateRoom)
        .delete(passport.authenticate("jwt", {session: false}), user.can("edit room"), deleteRoom)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, PUT, DELETE"});
        });

    /////////////////////////////
    ////:id/users///////////////
    ///////////////////////////

    router.route("/:id/users")
        .get(getRoomUsers)
        .post(passport.authenticate("jwt", {session: false}), user.can("join room"), addUserToRoom)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, POST"});
        });

    /////////////////////////////
    ////:id/users/:userId'//////
    ///////////////////////////

    router.route("/:id/users/:userId")
        .get(getRoomUser)
        .delete(passport.authenticate("jwt", {session: false}), user.can("leave room"), deleteUserFromRoom)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, DELETE"});
        });

    ///////////////////////////////
    ////:id/users/:userId/Messages
    /////////////////////////////

    router.route("/:id/users/:userId/messages")
        .get(getUserMessages)
        .post(passport.authenticate("jwt", {session: false}), user.can("edit messages"), postUserMessage)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, POST"});
        });

    ///////////////////////////////
    ////:id/users/:userId/Messages/:messageId
    /////////////////////////////

    router.route("/:id/users/:userId/messages/:messageId")
        .get(getMessage)
        .put(passport.authenticate("jwt", {session: false}), user.can("edit messages"), updateRoomMessage)
        .delete(passport.authenticate("jwt", {session: false}), user.can("edit messages"), deleteRoomMessage)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, PUT, DELETE"});
        });

    ///////////////////////////////
    ////:id/users/:userId/roles
    /////////////////////////////

    router.route("/:id/users/:userId/roles")
        .get(getUserRoles)
        .post(passport.authenticate("jwt", {session: false}), user.can("edit roles"), addRoleToUser)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, POST"});
        });

    ////////////////////////////////////
    ////:id/users/:userId/roles/:roleId
    //////////////////////////////////

    router.route("/:id/users/:userId/roles/:roleId")
        .get(getUserRole)
        .put(passport.authenticate("jwt", {session: false}), user.can("edit roles"), updateRoleFromUser)
        .delete(passport.authenticate("jwt", {session: false}), user.can("edit roles"), removeRoleFromUser)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, POST"});
        });

    /////////////////////////////
    ////:id/messages////////////
    ///////////////////////////

    router.route('/:id/messages')
        .get(passport.authenticate("jwt", {session: false}), user.can("get messages"), getMessages)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET"});
        });

    /////////////////////////////
    ////:id/messages/:messageId'
    ///////////////////////////

    router.route('/:id/messages/:messageId')
        .get(getMessage)
        .put(passport.authenticate("jwt", {session: false}), user.can("edit messages"), updateRoomMessage)
        .delete(passport.authenticate("jwt", {session: false}), user.can("edit messages"), deleteRoomMessage)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, PUT, DELETE"});
        });

    /////////////////////////////
    ////:id/categories'/////////
    ///////////////////////////

    router.route('/:id/categories')
        .get(getRoomCategories)
        .post(addRoomCategory)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, POST"});
        });

    /////////////////////////////
    ////:id/category/categoryId'
    ///////////////////////////

    router.route('/:id/categories/:categoryId')
        .get(getRoomCategory)
        .delete(removeRoomCategory)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, DELETE"});
        });

    /////////////////////////////
    ////:id/videos/'////////////
    ///////////////////////////

    //Only allow get because the rest is handle in the socket
    router.route('/:id/videos')
        .get(getVideosFromQueue)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET"});
        });

    /////////////////////////////
    ////:id/videos/videoPosition
    ///////////////////////////

    //Only allow get because the rest is handle in the socket
    router.route('/:id/videos/:videoPosition')
        .get(getVideoInformation)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "GET"});
        });

    return router;
};
