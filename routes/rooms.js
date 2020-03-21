const express = require('express');
const router = express.Router();

const Room = require('../models/room');

router.get('/', function(req, res){
    let result = Room.find({})
    .byName(req.query.name)
    .byCategories(req.query.category);


    result.then(rooms => {
        return res.status(200).json({ rooms, statusCode : 200, message: "OK" });
    }).catch(err => {
        console.error(err);
        return res.status(400).json({ statusCode : 400, message: "Bad Request" });
    });
});

router.post('/', function(req, res){
    const roomId = req.body.name.replace(/\s/g, '_');
    let result = Room.findOne({id: roomId});

    result.then(room => {
        console.log(room);
        if(!room){

            let newRoom = {
                id: roomId.toLowerCase(),
                name: req.body.name,
                password: req.body.password || '',
                picture: req.body.picture || '',
                blacklist: { enabled: req.body.blacklistEnabled || false, users: req.body.blacklistUsers || [] },
                messages: [],
                videos: [],
            }
    
            Room.create(newRoom, function(err, room){
                if(err){
                    console.error(err);
                    return res.status(500).json({ statusCode : 500, message: "Internal Server Error" })  
                }
    
                res.status(201).json({room, statusCode : 201, message: "Created" });
            });
        } else {
            res.status(400).json({statusCode : 400, message: "Roomname already in use" })
        }
    });

});

router.all('/', function(req, res){
    res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET, POST" })  
});

/////////////////////////////
////:id/////////////////////
///////////////////////////

router.get('/:id', function(req, res){
    let result = Room.find({id: req.params.id}).populate('users');
    result.then(room => {

        return res.status(200).json({ room, statusCode : 200, message: "OK" });
    }).catch(err => {
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }
    });
});

router.put('/:id', function(req, res){
    Room.findOneAndUpdate({id: req.params.id}, req,body, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }

        return res.status(200).json({ room, statusCode : 200, message: "OK" });
    });
});

router.delete('/:id', function(req, res){
    Room.findOneAndDelete({id: req.params.id}, req,body, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }

        return res.status(200).json({ room, statusCode : 200, message: "OK" });
    });
});

router.all('/:id', function(req, res){
    res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET, PUT, DELETE" })  
});

/////////////////////////////
////:id/users///////////////
///////////////////////////

router.get('/:id/users', function(req, res){
    Room.findOne({id: req.params.id}, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }
        return res.status(200).json({ users: room.users, statusCode : 200, message: "OK" });
    }).populate('users');
});

router.post('/:id/users', function(req, res){
    let result = Room.findOne({id: req.params.id}).populate('users');

    result.then(room => {
        if(!room.containsUser(req.body.userId)) {
            
            room.users.push(req.body.userId);
            room.save();
        }
        
        return res.status(200).json({ users: room.users, statusCode : 200, message: "OK" });

    }).catch(err => {
        console.error(err);
        return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
    });
});

router.delete('/:id/users', function(req, res){
    let result = Room.findOne({id: req.params.id});

    result.then(room => {
        
        if (!req.body.userId){ return res.status(400).json({ users: room.users, statusCode : 400, message: "Bad Request" });
        } else if(room.containsUser(req.body.userId)) {
            
            room.users.remove(req.body.userId);
            room.save().catch(err => {
                console.error(err);
                return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
            });

            return res.status(200).json({ users: room.users, statusCode : 200, message: "OK" });
        } 

        return res.status(404).json({ users: room.users, statusCode : 404, message: "User not found" });
     
    }).catch(err => {
        console.error(err);
        return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
    });
});

router.all('/:id/users', function(req, res){
    res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET, POST, DELETE" })  
});

/////////////////////////////
////:id/users/:userId'//////
///////////////////////////


router.get('/:id/users/:userId', function(req, res){
    Room.findOne({'id': req.params.id, 'message.user.id': req.params.userId}, function(err, user){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }

        return res.status(200).json({ user, statusCode : 200, message: "OK" });
    });
});

router.all('/:id/users/:userId', function(req, res){
    res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" })  
});

/////////////////////////////
////:id/messages////////////
///////////////////////////


router.get('/:id/messages', function(req, res){
    let result = Room.find({id: req.params.id})
    .populate('messages.user', 'name');

    result.then(room => {
            return res.status(200).json({ messages: room.getMessagesByName(req.query.username), statusCode : 200, message: "OK" });
    }).catch(err => {
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }
    });
});

router.post('/:id/messages', function(req, res){
    Room.find({id: req.params.id}, function(err, room){
        if(err) {
            console.error(err);
            return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
        }
        
        if(req.body.user && req.body.line){
        
            const userMessage = req.body;
            room.messages.push(req.body);

            room.save(function(err){
                if(err){
                    console.error(err);
                    return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
                }

                return res.status(200).json({ userMessage, statusCode : 200, message: "OK" });
            });
        } else {
            console.log(req.body);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }
    });
});

router.all('/:id/messages', function(req, res){
    res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET, POST" })  
});

/////////////////////////////
////:id/messages/:messageId'
///////////////////////////

router.get('/:id/messages/:messageId', function(req, res){
    Room.findOne({'id': req.params.id, 'messages._id': req.params.messageId }, function(err, room){
        if(err){
            console.error(err);
            return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
        }

        const message = room.getMessageById(req.params.messageId);
        return res.status.status(200).json({ message, statusCode : 200, message: "OK" })   
    });
});


router.put('/:id/messages/:messageId', function(req, res){
    Room.findOne({'id': req.params.id, 'messages._id': req.params.messageId}, function(err, room){
        if(room){
            if(err){
                console.error(err);
                return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
            }
            
            if(!req.body.line){
                room.updateMessageById(req.params.messageId, req.body.line);
                room.save(function(err, room){
                    if(err){
                        console.error(err);
                        return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
                    }
                    return res.status.status(200).json({ message, statusCode : 200, message: "OK" })           
                });
            } else {
                return res.status(400).json({ statusCode : 400, message: "Bad Request" });
            }
        } else {
            return res.status(404).json({ statusCode : 404, message: "Message Or Room Not Found" });
        }
    });
});

router.delete('/:id/messages/:messageId', function(req, res){
    Room.findOne({'id': req.params.id, 'messages._id': req.params.messageId }, function(err, room){
        if(room){
            if(err){
                console.error(err);
                return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
            }
            if(room.removeMessageById(req.params.messageId)){
    
                room.save(function(err) {
                    if(err){
                        console.error(err);
                        return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
                    }
                });
                return res.status(200).json({ statusCode : 200, message: "OK" });
            }
        } else {
            return res.status(404).json({ statusCode : 404, message: "Message Or Room Not Found" });
        }
    });
});

router.all('/:id/messages/:messageId', function(req, res){
    res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET, PUT, DELETE" })  
});

module.exports = router;