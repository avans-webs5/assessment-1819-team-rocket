const express = require('express');
const router = express.Router();

const Room = require('../models/room');

router.get('/', function(req, res){
    let result = Room.find({})
    .byName(req.query.name);

    result.then(rooms => {

        if(rooms.length > 0){ return res.status(200).json({ rooms, statusCode : 200, message: "OK" });
        } else { return res.status(404).json({ statusCode : 404, message: "Room not found" }); }

    }).catch(err => {
        console.error(err);
        return res.status(400).json({ statusCode : 400, message: "Bad Request" });
    });
});

router.post('/', function(req, res){
    let newRoom = {
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
            return res.status(400).json({ statusCode : 400, message: "Bad Request" })  
        }

        res.status(201).json({room, statusCode : 201, message: "Created" })
    });
});

router.all('/', function(req, res){
    res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET, POST" })  
});


router.get('/:id', function(req, res){
    Room.findById(req.params.id, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" })  
        }

        return res.status(200).json({ room, statusCode : 200, message: "OK" });
    });
});

router.get('/:id', function(req, res){
    Room.findByIdAndUpdate(req.params.id, req,body, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }

        return res.status(200).json({ room, statusCode : 200, message: "OK" });
    });
});

router.delete('/:id', function(req, res){
    Room.findByIdAndDelete(req.params.id, req,body, function(err, room){
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

router.get('/:id/users', function(req, res){
    Room.findById(req.params.id, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }
        let users = room.users;
        return res.status(200).json({ users, statusCode : 200, message: "OK" });
    });
});

router.post('/:id/users', function(req, res){
    Room.findById(req.params.id, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }
        let users = room.users;
        return res.status(200).json({ users, statusCode : 200, message: "OK" });
    });
});


router.get('/:id/users', function(req, res){
    Room.findById(req.params.id, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }

        let users = room.users;
        return res.status(200).json({ users, statusCode : 200, message: "OK" });
    });
});

router.all('/:id/users', function(req, res){
    res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" })  
});

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


router.get('/:id/messages', function(req, res){
    Room.findById(req.params.id, function(err, room){
        if(err) {
            console.error(err);
            return res.status(400).json({ statusCode : 400, message: "Bad Request" });
        }

        let messages = room.messages;
        return res.status(200).json({ messages, statusCode : 200, message: "OK" });
    });
});

router.post('/:id/messages', function(req, res){
    Room.findById(req.params.id, function(err, room){
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
                    return res.status(400).json({ statusCode : 400, message: "Bad Request" });
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

module.exports = router;