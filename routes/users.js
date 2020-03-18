const express = require('express');
const router = express.Router();

const User = require('../models/user');
    
router.get('/', function(req, res) {

        let result = User.find({})
        .byName(req.query.sortByName)
        .byEmail(req.query.sortByEmail)
        .byRole(req.query.sortByRole)

        result.then(users => {
                let validatedUsers = [];
                users.forEach(function(user){
                        let validUser = {
                                id: user._id,
                                name: user.name,
                                email: user.email,
                                providers: user.providers,
                                role: user.role,
                                created: user.created
                        }
                        validatedUsers.push(validUser);
                });
                
                res.json(validatedUsers);
        }).catch(err => {
                res.status(500).json({ statusCode : 500, message: err, })
        });
});

router.all('/', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
});

router.get('/:id(\d+)', function(req, res){
        console.log(req.params.id);

        User.findOne({_id: req.params.id}, function(err, user){
                if(err) {
                        console.log(err);
                        return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
                }

                if(!user){
                        return res.status(404).json({ statusCode : 404, message: "User Not Found" });   
                } else {
                        return res.status(200).json(user);
                }

        });
});

router.get('/:name', function(req, res){
        User.findOne({name: req.params.name}, function(err, user){
                if(err) {
                        console.log(err);
                        return res.status(500).json({ statusCode : 500, message: "Internal Server Error" });
                }

                if(!user){
                        return res.status(404).json({ statusCode : 404, message: "User Not Found" });   
                } else {
                        return res.status(200).json(user);
                }

        }).collation( { locale: 'en', strength: 1 });
});


module.exports = router;