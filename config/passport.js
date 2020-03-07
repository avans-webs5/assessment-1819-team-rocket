const localStrategy     = require('passport-local').Strategy;
const facebookStrategy  = require('passport')

const User          = require('../models/user');
const configAuth    = require('./auth');

module.exports = function(passport){

    // =========================================================================
    // LOCAL ===================================================================
    // =========================================================================

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
        passReqToCallback: true,
    },
    function(req, email, password, done){
        process.nextTick(function() {
            User.findOne({ 'local.email': email }, function(err, user){
                if(err) return done(err);
                
                if(user){
                    return done(null, false, req.flash('error', 'That email is already taken.'));
                } else {
                    let username = email.slice(0, email.lastIndexOf("@"));
                    let newUser = new User();
   
                    if(!newUser.validPassword(password)) {
                        return done(null, false, req.flash('error', 'The password needs to contain minimal 8 characters, atleast 1 number, atleast 1 letter and atleast 1 unique character !#$%?'));
                    }

                    newUser.name = username;
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.save(function(err) {
                        if(err) throw err;
                        return done(null, newUser);
                    });
                }
            });
        });
    }));

    passport.use('local-login', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, email, password, done){
        process.nextTick(function() {
            User.findOne({'local.email': email}, function(err, user){
                if(err) { 
                    console.log(err);
                    done(err); 
                }
    
                if(!user)
                    return done(null, false, req.flash('login-error', 'No user found.'));
                
                if(!user.validHashedPassword(password)) return done(null, false, req.flash('login-error', 'Password is incorrect.'));
                return done(null, user);
            });
        });
    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================

    passport.use(new facebookStrategy({
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL
    },
    function(token, refreshToken, profile, done){
        process.nextTick(function(){
            User.findOne({ 'facebook.id' : profile.id}, function(err, user){
                if(err)
                    return done(err);

                if(user){
                    return done(null, user);
                } else {
                    let newUser = new User();

                    newUser.facebook.id = profile.id;
                    newUser.facebook.token = token;
                    newUser.facebook.name = profile.name;
                    newUser.facebook.email = profile.email;

                    newUser.save(function(err){
                        if(err)
                            throw err;

                            return done(null, newUser);
                    })
                }
            });
        });
    }));
}