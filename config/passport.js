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
            User.findOne({ 'email': email }, function(err, user){
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
                    newUser.email = email;
                    newUser.password = newUser.generateHash(password);
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
            User.findOne({'email': email}, function(err, user){
                if(err) { 
                    console.log(err);
                    done(err); 
                }
    
                if(!user)
                    return done(null, false,  req.flash('error', '{ "statusCode" : 400, "message" : "User not found!"}'));
                
                if(!password) return done(null, false, req.flash('error', '{ "statusCode" : 400, "message" : "No local account stored!"}'));
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
        profileFields: ['id', 'displayName', 'email'],
        passReqToCallback: true
    },
    function(req, token, refreshToken, profile, done){
        process.nextTick(function(){
            if(!req.user){
                User.findOne({ 'email' : profile.emails[0].value}, function(err, user){
                    if(err){
                        console.log(err);
                        return done(err);
                    }
                        
                    if(user){

                        //RELINK ACCOUNT
                        if (!user.hasProvider("facebook")) {

                            let provider = {
                                id:  profile.id,
                                token: token,
                                provider: "facebook",
                            };

                            user.providers.push(provider);

                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {

                        //CREATE NEW ACCOUNT
                        let newUser = new User();
                        newUser.name = profile.displayName;
                        newUser.email = profile.emails[0].value;
    
                        let provider = {
                            id: profile.id,
                            token: token,
                            provider: "facebook",
                        }

                        newUser.providers.push(provider);

                        newUser.save(function(err){
                            if(err)
                                throw err;
    
                                return done(null, newUser);
                        })
                    }
                });
            } else {

                let provider = {
                    id: profile.id,
                    token: token,
                    provider: "facebook",
                };
                //LINK TO EXISTING ACCOUNT
                let user = req.user;
                user.providers.push(provider);

                user.save(function(err){
                    if(err)
                        throw err;

                    return done(null, user);
                });
            }
        });
    }));

    // =========================================================================
    // GOOGLE===================================================================
    // =========================================================================

    passport.use(new googleStrategy({
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback: true
    },
    function(req, token, refreshToken, profile, done){

        if(!req.user){
            process.nextTick(function(){
                User.findOne({'email': profile.emails[0].value}, function(err, user){
                    if(err){
                        console.log(err);
                        return done(err);
                    }

                    if(user) {

                        if (!user.hasProvider("google")) {
                            let provider = {
                                id:  profile.id,
                                token: token,
                                provider: "google",
                            };

                            user.providers.push(provider);

                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user);

                    } else {
                        let newUser = new User();

                        newUser.name = profile.displayName;
                        newUser.profile_picture = profile.photos[0].value;
                        newUser.email = profile.emails[0].value;

                        let provider = {
                            id:  profile.id,
                            token: token,
                            provider: "google",
                        };

                        newUser.providers.push(provider);

                        newUser.save(function(err){
                            if(err) throw err;
                            return done(null, newUser);
                        });
                    }   
                });
            });
        } else {

            let user = req.user;
            let provider = user.getProvider("google");  
                    
            if(provider == undefined) {
                provider = {
                    id:  profile.id,
                    token: token,
                    provider: "google",
                };
                user.providers.push(provider);
            } else {
                provider.token = token
            }

            user.save(function(err){
                if(err)
                    throw err;

                return done(null, user);
            });
        }
    }));

    // =========================================================================
    // JWT======================================================================
    // =========================================================================

    passport.use(new jwtStrategy({
        jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: configAuth.JWS.secret
    }, function(payload, done){
        process.nextTick(function(){
            User.findOne({_id: payload.id}, function(err, user){
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