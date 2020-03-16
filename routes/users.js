const express = require('express');
const router = express.Router();

const User = require('../models/user');
    
router.get('/', function(req, res) {
        User.find({}, function(err, users){
                if(err) throw err

                let validatedUsers = [];

                users.forEach(function(user){
                        let validUser = {
                                id: user._id,
                                name: user.name,
                                email: user.local.email || user.google.email || user.facebook.email,
                                created: user.created
                        }
                        validatedUsers.push(validUser);
                });
                
                res.json(validatedUsers);
        });
});

module.exports = router;