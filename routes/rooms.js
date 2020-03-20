const express = require('express');
const router = express.Router();

const Room = require('../models/room');

router.get('/', function(req, res){
    Room.find({}, function(err, rooms){
        if(err) { 
            console.error(err);
            res.status(500).json({ statusCode : 500, message: "Internal Server Error" })  
        }
        res.status(200).json(rooms);
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

module.exports = router;