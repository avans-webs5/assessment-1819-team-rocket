const localStrategy     = require('passport-local').Strategy;
const facebookStrategy  = require('passport-facebook').Strategy;
const googleStrategy    = require('passport-google-oauth20').Strategy;

const passportJWT       = require('passport-jwt');
const extractJWT        = passportJWT.ExtractJwt;
const jwtStrategy       = passportJWT.Strategy;

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
                    return done(null, false, req.flash('error', '{ "statusCode" : 400, "message" : "That email is already taken." }'));
                } else {
                    let username = email.slice(0, email.lastIndexOf("@"));
                    let newUser = new User();
   
                    if(!newUser.validPassword(password)) {
                        return done(null, false, req.flash('error', ' { "statusCode" : 400, "message" : "The password needs to contain minimal 8 characters, atleast 1 number, atleast 1 letter and atleast 1 unique character !#$%?" }'));
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
                    return done(null, false,  req.flash('error', '{ "statusCode" : 400, "message" : "User not found!"}'));
                
                if(!user.validHashedPassword(password)) return done(null, false, req.flash('error', '{ "statusCode" : 400, "message" : "Password is incorrect!"}'));
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
        callbackURL: configAuth.facebookAuth.callbackURL,
        profileFields: ['id', 'displayName', 'email']
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
                    newUser.name = profile.displayName
                    newUser.facebook.email = profile.emails[0].value

                    newUser.save(function(err){
                        if(err)
                            throw err;

                            return done(null, newUser);
                    })
                }
            });
        });
    }));

    // =========================================================================
    // GOOGLE===================================================================
    // =========================================================================

    passport.use(new googleStrategy({
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
    },
    function(token, refreshToken, profile, done){
        process.nextTick(function(){
            User.findOne({'google.id': profile.id}, function(err, user){
                if(err)
                    return done(err);
                if(user) {
                    return done(user);
                } else {
                    let newUser = new User();

                    newUser.google.id = profile.id;
                    newUser.google.token = token;
                    newUser.name = profile.displayName;
                    newUser.google.email = profile.emails[0].value;

                    newUser.save(function(err){
                        if(err) throw err;
                        return done(null, newUser);
                    });
                }   
            });
        });
    }));

    // =========================================================================
    // JWT======================================================================
    // =========================================================================

    //TODO: Maak secret globaal zodat als je hem veranderd het mee veranderd als het ge-encrypt wordt
    passport.use(new jwtStrategy({
        jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: configAuth.JWS.secret
    }, function(payload, done){
        process.nextTick(function(){
            User.findOne({_id: payload.id}, function(err, user){
                console.log(payload);
                if (err) {
                    return done(err, false);
                }
                if (user) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        });
    }));
}