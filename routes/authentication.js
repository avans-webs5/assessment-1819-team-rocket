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
            email: req.user.local.email,
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
            email: req.user.local.email,
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

    app.all('/auth/facebook', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
    });

    app.get('/auth/facebook/callback', passport.authenticate('facebook'), function (req, res) {
        let token = generateTokenResponse(req);
        let user = { 
            id: req.user._id,
            name: req.user.name,
            email: req.user.facebook.email,
            facebook_token: req.user.facebook.token,
            token: token,
            provider_token: { provider: req.user.provider, token: req.user.google.token || req.user.facebook.token },
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

    app.all('/auth/google', function(req, res){
        res.status(405).json({ statusCode : 405, message: "Method Not Allowed", Allow : "GET" });
    });

    app.get('/auth/google/callback', passport.authenticate('google'), function(req, res){
        let token = generateTokenResponse(req);
        let user = { 
            id: req.user._id,
            name: req.user.name,
            email: req.user.google.email,
            token: token,
            provider_token: { provider: req.user.provider, token: req.user.google.token || req.user.facebook.token },
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


    /////////////////////////////////////////////
    //CONNECT//////////////
    ///////////////////////////////////////////

    app.post('/connect/local', passport.authenticate('local-signup', { failureRedirect : '/', failureFlash : true }), function(req, res){
        res.status(200).json({statusCode: 200, message: "OK"});
    });


    function generateTokenResponse(req){
        let payload = { id: req.user._id }
        let token = jwt.sign(payload, secret);

        return token;
    }   
}



    /*The password needs to contain the following:
        - minimal 8 characters
        - atleast 1 number
        - atleast 1 letter
        - atleast 1 unique character !#$%?
    */

/*router.post('/sign-up', function(req, res){
    if(!req.query.name) return res.send(`You didn't enter a valid name!`);
    else if(!req.query.email) return res.send(`You didn't enter a valid email!`);
    else if(!req.query.password) return res.send(`You didn't give a valid password!`);
    
    const passwordRegex = new RegExp('^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!#$%&? "]).*$');
     
    if(!passwordRegex.test(req.query.password)) return res.send(passwordRegex +'The password needs to be atleast 8 characters long and have atleast one number and one special character.');


    const newUser = new User({
        name: req.query.name,
        local: {
            email: req.query.email,
            password: User.generateHash(req.query.password);
        }
    });

    newUser.save().then(response => {
        res.status(201).json({
            message: "User successfully created!",
            result: response
        });
    }).catch(err => { 
        res.status(500).json({
            error: err
        });
    });

});*/

