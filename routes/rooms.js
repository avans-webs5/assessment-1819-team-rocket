const express = require("express");
const router = express.Router();

const Room = require("../models/room");
const Message = require("../models/message");

module.exports = function (passport, user) {

    function getRooms(req, res) {
        let result = Room.find({})
            .byName(req.query.name)
            .byPage(req.query.pageIndex, req.query.pageSize)
            .byCategories(req.query.category);

        result.then(rooms => {
            return res.status(200).json({rooms, statusCode: 200, message: "OK"});
        }).catch(err => {
            console.error(err);
            return res
                .status(400)
                .json({statusCode: 400, message: "Bad Request"});
        });
    }

    function getRoom(req, res) {
        let result = Room.findOne({id: req.params.id}).populate("users");
        result
            .then(room => {
                if(room){
                    return res.status(200).json({room, statusCode: 200, message: "OK"});
                } else {
                    return res.status(404).json({statusCode: 404, message: "Room Not Found"})
                }
            })
            .catch(err => {
                if (err) {
                    console.error(err);
                    return res
                        .status(400)
                        .json({statusCode: 400, message: "Bad Request"});
                }
            });
    }

    function createRoom(req, res) {
        if (!req.body.name)
            return res.status(400).json({statusCode: 400, message: "Bad Request"});

        const roomId = req.body.name.replace(/\s/g, "_");
        let result = Room.findOne({id: roomId});

        result.then(room => {
            if (!room) {
                let newRoom = {
                    id: roomId.toLowerCase(),
                    name: req.body.name,
                    password: Room.generateHash(req.body.password) || "",
                    picture: req.body.picture || "",
                    blacklist: {
                        enabled: req.body.blacklistEnabled || false,
                        users: req.body.blacklistUsers || []
                    },
                    users: [],
                    messages: [],
                    videos: []
                };

                let newUser = {
                    user: req.user._id,
                    roles: ["owner"]
                };

                newRoom.users.push(newUser);

                Room.create(newRoom, function (err, room) {
                    if (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .json({statusCode: 500, message: "Internal Server Error"});
                    }
                    res.status(201).json({room, statusCode: 201, message: "Created"});
                });
            } else {
                res
                    .status(400)
                    .json({statusCode: 400, message: "Roomname already in use"});
            }
        });
    }

    function updateRoom(req, res) {
        let id = req.params.id;

        if(req.body.password) req.body.password = Room.generateHash(req.body.password);
        if(req.body.name) id = req.body.name.replace(/\s/g, "_");

        let updatedRoom = {
            id: id.toLowerCase(),
            name: req.body.name,
            password: Room.generateHash(req.body.password),
            picture: req.body.picture,
        };

        let result = Room.findOneAndUpdate({id: req.params.id}, updatedRoom);

        result.then(room => {
            return res.status(200).json({room, statusCode: 200, message: "OK"});
        }).catch(err => {
            console.error(err);
            return res
                .status(400)
                .json({statusCode: 400, message: "Bad Request"});
        });
    }

    function deleteRoom(req, res){
        let result = Room.deleteOne({id: req.params.id});
        result.then(() => {
            return res.status(200).json({statusCode: 200, message: "OK"});
        }).catch(err => {
            console.error(err);
            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function getRoomUsers(req, res) {
        let result = Room.findOne({id: req.params.id}).populate("users.user");
        result.then(room => {
            if(room.users && room.users.length > 0){
                return res.status(200).json({users: room.users, statusCode: 200, message: "OK"});
            } else {
                return res.status(404).json({statusCode: 404, message: "Users Not Found"});
            }
        }).catch(err => {
            console.error(err);
            return res.status(400).json({statusCode: 400, message: "Bad Request"});
        });
    }

    function getRoomUser(req, res){
        let result = Room.findOne({id: req.params.id, "users.user": req.params.userId}).populate('users.user');
        result.then(room => {
            if(room.users && room.users.length > 0){
                return res.status(200).json({user: room.users[0], statusCode: 200, message: "OK"});
            } else{
                return res.status(404).json({statusCode: 404, message: "User Not Found"})
            }

        }).catch(err => {
            console.error(err);
            return res.status(400).json({statusCode: 400, message: "Bad Request"});
        });
    }

    function addUserToRoom(req, res) {
        let result = Room.findOne({id: req.params.id});
        result.then(room => {
            if(room.password && !room.validHashedPassword(req.body.password)){
                return res.status(403).json({statusCode: 403, message: "Password incorrect"});
            } else {
                if (req.body.user && !room.containsUser(req.body.user)) {
                    room.users.push({user: req.body.user, roles: ["admin"]});
                    room.save(function (err, updatedRoom) {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
                        }
                        return res.status(200).json({users: updatedRoom.users, statusCode: 200, message: "OK"});
                    });
                } else {
                    return res.status(204).send();
                }
            }
        }).catch(err => {
                console.error(err);
                return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function deleteUserFromRoom(req, res){
        let result = Room.findOne({id: req.params.id});

        result.then(room => {
            if(room){
                room.users.remove(req.params.userId);
                room.save(function (err, updatedRoom) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
                    }
                    return res.status(200).json({ users: updatedRoom.users, statusCode: 200, message: "OK"});
                });
            } else {
                return res.status(404).json({ users: room.users, statusCode: 404, message: "User not found"});
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function getRoomMessages(req, res){
        console.log('hiero');
        let result = Room.findOne({id: req.params.id}).populate({path: 'messages', populate: {path: 'sender', select: 'name', model: 'User'}});

        result.then(room => {
            if(room){
                return res.status(200).json({messages: room.messages || [], statusCode: 200, message: "OK"});
            } else{
                return res.status(404).json({statusCode: 404, message: "Room not found"});
            }
        }).catch(err => {
            console.error(err);
            return res.status(400).json({statusCode: 400, message: "Bad Request"});
        });
    }

    function getRoomMessage(req, res){
        const messagePopulation = {
            path: "messages",
            populate: {
                path: "user",
                select: "name"
            }
        };

        let result = Room.findOne({id: req.params.id, "messages._id": req.params.messageId}).populate(messagePopulation);

        result.then(room => {
            const message = room.getMessageById(req.params.messageId);
            return res.status.status(200).json({message, statusCode: 200, message: "OK"});
        }).catch(err => {
            console.error(err);
            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function updateRoomMessage(req, res){
        let result = Room.findOne({id: req.params.id, "messages._id": req.params.messageId}).populate("messages");

        result.then(room => {
            if (!req.body.line) {
                const updatedMessage = room.updateMessageById(req.params.messageId, req.body.line);
                room.save(function (err, room) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
                    }
                    return res.status.status(200).json({ updatedMessage, statusCode: 200, message: "OK"});
                });
            } else {
                return res.status(400).json({statusCode: 400, message: "Bad Request"});
            }
        }).catch(err => {
            console.error(err);
            return res
                .status(500)
                .json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function deleteRoomMessage(req, res){
        let result = Room.findOne({id: req.params.id, "messages._id": req.params.messageId});
        result.then(room => {
            if (room) {
                if (room.removeMessageById(req.params.messageId)) {
                    room.save(function (err) {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
                        }
                    });
                    return res.status(200).json({statusCode: 200, message: "OK"});
                }
            } else {
                return res
                    .status(404)
                    .json({statusCode: 404, message: "Message Or Room Not Found"});
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function getRoomCategories(req, res){
        let result = Room.findOne({id: req.params.id});
        result.then(room => {
            if(room) res.status(200).json({ categories: room.categories, statusCode: 200, message: "OK" });
            else  res.status(404).json({ statusCode: 404, message: "Room not found" });
        }).catch(err => {
            console.error(err);
            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function addRoomCategory(req, res){
        if(!req.body.category) return res.status(400).json({ statusCode: 400, message: "Category not given" });

        let result = Room.findOne({id: req.params.id});

        result.then(room => {
            if(room) {
                if(!room.categories.includes(req.body.category.toLowerCase())){

                    room.categories.push(req.body.category.toLowerCase());
                    room.save((err, updatedRoom) => {
                        if(err) {
                            console.error(err);
                            res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
                        }
                        else res.status(200).json({ categories: updatedRoom.categories ,statusCode: 200, message: "OK" });
                    });

                } else res.status(204).send();
            }
            else res.status(404).json({ statusCode: 404, message: "Room not found" });
        }).catch(err => {
            console.error(err);
            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function removeRoomCategory(req, res){
        let result = Room.findOne({id: req.params.id});
        result.then(room => {

            if(room) {
                if(room.categories.includes(req.params.categoryId)){
                    room.removeCategoryById(req.params.categoryId);
                    room.save((err) => {
                        if(err) res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
                        res.status(200).json({ statusCode: 200, message: "OK" });
                    });
                } else {
                    res.status(404).json({ statusCode: 404, message: "Category not found" });
                }
            }
            else res.status(404).json({ statusCode: 404, message: "Room not found" });
        }).catch(err => {
            console.error(err);
            return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
        });
    }

    function getUserMessages(req, res){
        let result = Room.findOne({id: req.params.id}).populate('messages');
        result.then(room => {
            let messages = room.getMessagesByUserId(req.params.userId) || [];
            if(messages.length > 0){
                return  res.status(200).json({ messages, statusCode: 200, message: "OK" });
            } else{
                return res.status(404).json({ statusCode: 404, message: "No messages found"});
            }
        }).catch(err => {
            console.error(err);
            res.status(500).json({ statusCode: 500, message: "Internal Server Error"});
        });

    }

    function postUserMessage(req, res){
        let result = Room.findOne({id: req.params.id});
        result.then(room => {
            if(room){
                let newMessage = {
                    sender: req.user.id,
                    line: req.body.line
                };

                let messageResult = Message.create(newMessage);
                messageResult.then(msg => {
                    room.messages.push(msg.id);
                    room.save(err => {
                        if(err){
                            console.error(err);
                            res.status(500).json({ statusCode: 500, message: "Internal Server Error"});
                        } else {
                            res.status(201).json({ msg, statusCode: 201, message: "Message Created"})
                        }
                    });
                }).catch(err => {
                    console.error(err);
                    res.status(500).json({ statusCode: 500, message: "Internal Server Error"})
                });

            }

        }).catch(err => {
            console.error(err);
            res.status(500).json({ statusCode: 500, message: "Internal Server Error"});
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

    /////////////////////////////
    ////:id/messages////////////
    ///////////////////////////

    router.route('/:id/messages')
        .get(passport.authenticate("jwt", {session: false}), user.can("get messages"), getRoomMessages)
        .all(function (req, res) {
            res
                .status(405)
                .json({ statusCode: 405, message: "Method Not Allowed", Allow: "GET" });
        });

    /////////////////////////////
    ////:id/messages/:messageId'
    ///////////////////////////

    router.route('/:id/messages/:messageId')
        .get(getRoomMessage)
        .put(passport.authenticate("jwt", {session: false}), user.can("edit messages"), updateRoomMessage)
        .delete(passport.authenticate("jwt", {session: false}), user.can("edit messages"), deleteRoomMessage)
        .all( function (req, res) {
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
        .delete(removeRoomCategory)
        .all(function (req, res) {
            res
                .status(405)
                .json({statusCode: 405, message: "Method Not Allowed", Allow: "DELETE"});
        });

    return router;
};

/*router.post(
    "/:id/messages",
    passport.authenticate("jwt", {session: false}),
    user.can("edit messages"),
    function (req, res) {
        let result = Room.findOne({id: req.params.id}).populate(
            "messages.user",
            "name"
        );
        result
            .then(room => {
                if (room) {
                    if (req.body.line) {
                        room.messages.push({user: req.user.id, line: req.body.line});

                        room.save(function (err) {
                            if (err) {
                                console.error(err);
                                return res
                                    .status(500)
                                    .json({
                                        statusCode: 500,
                                        message: "Internal Server Error"
                                    });
                            }
                            return res
                                .status(200)
                                .json({
                                    userMessage: {
                                        id: req.user.id,
                                        name: req.user.name,
                                        line: req.body.line
                                    },
                                    statusCode: 200,
                                    message: "OK"
                                });
                        });
                    } else {
                        return res
                            .status(400)
                            .json({statusCode: 400, message: "Bad Request"});
                    }
                } else {
                    return res.status(204).send();
                }
            })
            .catch(err => {
                if (err) {
                    console.error(err);
                    return res
                        .status(500)
                        .json({statusCode: 500, message: "Internal Server Error"});
                }
            });
    }
);*/
