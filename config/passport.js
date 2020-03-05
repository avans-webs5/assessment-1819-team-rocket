const localStrategy = require('passport-local').Strategy;
const User          = require('../models/user');

module.exports = function(passport){
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });

    passport.use('local-signup', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: 'true',
    },
    function(req, email, password, done){
        process.nextTick(function() {
            User.findOne({ 'local.email': email }, function(err, user){
                if(err) return done(err);
                
                if(user){
                    return done(null, false, req.flash('error', 'That email is already taken.'));
                } else {
                    const passwordRegex = new RegExp('^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!#$%&? "]).*$');

                    let username = email.slice(0, email.lastIndexOf("@"));
                    let newUser = new User();

                    if(!passwordRegex.test(req.query.password)) {
                        return done(null, false, req.flash('error', 'The password needs to be atleast 8 characters long and have atleast one number and one special character.'));
                    }

                    newUser.name = username;
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.save(function(err) {
                        if(err) throw err;
                        return done(null, newUser);
                    })
                }
            })
        })
    }))
}