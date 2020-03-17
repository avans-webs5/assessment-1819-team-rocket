const jwt       = require('jsonwebtoken');
const secret    = require('../config/auth').JWS.secret

module.exports = function(app, passport){

    app.all('/', function(req, res){
        let error = req.flash('error');
        if(error == '') {
            return res.status(401).json({ statusCode : 401, message : "Unauthorized access!" });
        }
        res.status(400).json(JSON.parse(error));
    });


    /////////////////////////////////////////////
    //LOGIN/////////////////////////////////////
    ///////////////////////////////////////////

    app.post('/login', passport.authenticate('local-login', { failureRedirect : '/', failureFlash: true }), function(req, res){
        let token = generateTokenResponse(req);
        let user = { 
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            token: token,
            created: req.user.created
        };

        res.status(200).json({ user: user, statusCode: 200, message: "OK" });
    });

    app.all('/login', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "POST" });
    });

    /////////////////////////////////////////////
    //SIGNUP////////////////////////////////////
    ///////////////////////////////////////////

    app.post('/signup', passport.authenticate('local-signup',  { failureRedirect : '/', failureFlash: true }), function(req, res){
        let token = generateTokenResponse(req);
        let user = { 
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            token: token,
            created: req.user.created
        };

        res.status(201).json({ user: user, statusCode: 201, message: "Created" });
    });

    app.all('/signup', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "POST" });
    });

    /////////////////////////////////////////////
    //LOGIN: FACEBOOK///////////////////////////
    ///////////////////////////////////////////


    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: ['email', 'public_profile']
    }));


    app.delete('/auth/facebook', passport.authenticate('jwt'), function(req, res){
        let user = req.user;
        
        if(!user.removeProvider("facebook")) { return res.status(400).json({statusCode: 400, message: "Cannot remove provider"}); }

        user.save(function(err) {
            if(err) throw err;
            res.status(200).json({statusCode: 200, message: "OK"});
        });
    });

    app.all('/auth/facebook', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET, DELETE" });
    });

    app.get('/auth/facebook/callback', passport.authenticate('facebook'), function (req, res) {
        let token = generateTokenResponse(req);
        let user = { 
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            token: token,
            provider_tokens: req.user.providers,
            created: req.user.created
        };

        res.status(200).json({user: user, statusCode: 200, message: "OK"});
    });

    app.all('/auth/facebook/callback', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
    });

    /////////////////////////////////////////////
    //LOGIN: GOOGLE/////////////////////////////
    ///////////////////////////////////////////

    app.get('/auth/google', passport.authenticate('google', {
        response_type: 'code',
        scope: ['email', 'profile']
    }));

    app.delete('/auth/google', passport.authenticate('jwt'), function(req, res){
        let user = req.user;
        
        if(!user.removeProvider("google")) { return res.status(400).json({statusCode: 400, message: "Can not remove provider"}); }
        
        user.save(function(err) {
            if(err) throw err;
            res.status(200).json({statusCode: 200, message: "OK"});
        });
    });

    app.all('/auth/google', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
    });

    app.get('/auth/google/callback', passport.authenticate('google'), function(req, res){
        let token = generateTokenResponse(req);
        let user = { 
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            token: token,
            provider_tokens: req.user.providers,
            created: req.user.created
        };

        res.status(200).json({user: user, statusCode: 200, message: "OK"});
    });

    app.all('/auth/google/callback', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
    });

    /////////////////////////////////////////////
    //LOGOUT////////////////////////////////////
    ///////////////////////////////////////////

    app.get('/logout', function(req, res){
        req.logOut();
        res.redirect('/');
    });

    app.all('/logout', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
    });

/*
    /////////////////////////////////////////////
    //CONNECT: LOCAL////////////////////////////
    ///////////////////////////////////////////

    app.post('/connect/local', passport.authenticate('local-signup', { failureRedirect : '/', failureFlash : true }), function(req, res){
        res.status(200).json({statusCode: 200, message: "OK"});
    });

    app.all('/connect/local', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "POST" });
    });

    /////////////////////////////////////////////
    //CONNECT: FACEBOOK/////////////////////////
    ///////////////////////////////////////////

    app.get('/connect/facebook', passport.authorize('facebook', { scope : ['public_profile', 'email'] }));


    app.all('/connect/facebook', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
    });

    app.get('/connect/facebook/callback',passport.authorize('facebook', {failureRedirect : '/'}), function(req, res){
        res.status(200).json({statusCode: 200, message: "OK"});
    });


    /////////////////////////////////////////////
    //CONNECT: GOOGLE///////////////////////////
    ///////////////////////////////////////////

    app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

    app.all('/connect/google', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
    });

    app.get('/connect/google/callback', passport.authorize('google', { failureRedirect : '/' }), function(req, res){
        res.status(200).json({statusCode: 200, message: "OK"});
    });    
*/

    function generateTokenResponse(req){
        let payload = { id: req.user._id }
        let token = jwt.sign(payload, secret);

        return token;
    }   
}


