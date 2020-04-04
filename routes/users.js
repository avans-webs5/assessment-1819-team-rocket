const express = require("express");
const router = express.Router();

const User = require("../models/user");

function postUser(req, res) {
    if (req.body.email && req.body.password) {

        let discriminator =  Math.random().toString().substr(2, 4);
        let username = req.body.email.slice(0, req.body.email.lastIndexOf("@"));
        let newUser = new User();
        newUser.id = username +  "#" + discriminator;
        newUser.name = username;
        newUser.discriminator = discriminator;
        newUser.email = req.body.email;
        newUser.password = newUser.generateHash(req.body.password);
        newUser.profile_picture = req.body.profilePicture;

        newUser.save(err => {
            if (err) errorHandler(res, err);
            else res.status(200).json({newUser, statusCode: 200, message: "OK"});
        });
    } else {
        return res.status(400).json({statusCode: 400, message: "Bad Request"});
    }
}

function getUsers(req, res) {

    let result = User.find({})
        .byName(req.query.name)
        .byEmail(req.query.email)
        .byRole(req.query.role)
        .byPage(req.query.pageIndex, req.query.pageSize);

    result.then(users => {
        let validatedUsers = [];

        users.forEach(user => {
            let validUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                providers: user.providers,
                role: user.role,
                created: user.created
            };
            validatedUsers.push(validUser);
        });

        if (validatedUsers.length > 0) {
            res.status(200).json({validatedUsers, statusCode: 200, message: "OK", pageIndex: { page: req.query.pageIndex || 0, items: req.query.pageSize || validatedUsers.length }});
        }

        res.status(204);
    }).catch(err => {
        console.error(err);
        res.status(500).json({statusCode: 500, message: err});
    });
}

function getUser(req, res){
    let userId = req.params.id.replace("_", "#");
    let result = User.findOne({ id: userId });

    result.then(user => {
        if(user){
            return res.status(200).json({user, statusCode: 200, message: "OK"});
        } else {
            return res.status(404).json({statusCode: 404, message: "User Not Found"});
        }
    }).catch(err => {
        console.error(err);
        return res.status(400).json({statusCode: 400, message: "Not a valid id"});
    });
}

function updateUser(req, res){
    let userId = req.params.id.replace("_", "#");
    let result = User.findOne({id: userId});

    result.then(oldUser => {
        if (oldUser) {
            oldUser.id = (req.body.name) ? req.body.name +  "#" + oldUser.discriminator: oldUser.id;
            oldUser.name = req.body.name || oldUser.name;
            oldUser.email = req.body.email || oldUser.email;
            oldUser.password = oldUser.generateHash(req.body.password) || oldUser.password;
            oldUser.profile_picture = req.body.profilePicture || oldUser.profile_picture;

            oldUser.save((err, user) => {
                if(err) return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
                else return res.status(200).json({user, statusCode: 200, message: "OK"});
            });
        } else {
            return res.status(404).json({statusCode: 404, message: "User Not Found"});
        }
    }).catch(err => {
        console.error(err);
        return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
    });
}

function deleteUser(req, res){
    let userId = req.params.id.replace("_", "#");

    let result = User.findOneAndDelete({id: userId});
    result.then(user => {
        if(user){
            return res.status(200).json({statusCode: 200, message: "OK"});
        } else {
            return res.status(404).json({statusCode: 404, message: "User Not Found"});
        }
    }).catch(err => {
        console.log(err);
        return res.status(500).json({statusCode: 500, message: "Internal Server Error"});
    });
}

function errorHandler(res, err) {
    //Catches duplicates in database
    if (err.code === 11000) {
        res.status(400).json({statusCode: 400, message: "User Already Exists"});
    } else if (err.name === 'ValidationError') {
        res.status(400).json({statusCode: 400, message: err.message})
    } else {
        res.status(500).json({statusCode: 500, message: err});
    }
}

router.route("/")
    .get(getUsers)
    .post(postUser)
    .all((req, res) => {
        res.status(405).json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, POST"});
    });

router.route("/:id")
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser)
    .all(function(req, res){
        res.status(405).json({statusCode: 405, message: "Method Not Allowed", Allow: "GET, PUT, DELETE"});
    });

module.exports = router;
