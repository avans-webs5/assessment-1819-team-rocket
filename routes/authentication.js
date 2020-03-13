const jwt = require('jsonwebtoken');

module.exports = function(app, passport){

    app.get('/login', function(req, res){
        res.send(req.flash('login-error'));
    });

    app.post('/login', passport.authenticate('local-login', {
        succesRedirect:'/users',
        failureRedirect: '/login',
        failureFlash: true
    }), function(req, res){

        let payload = { id: req.user._id }
        let token = jwt.sign(payload, 'ilovestormstormisthebestoftheworld!');
        res.json({message: "ok", token: token});
    });
    
    app.get('/signup', function(req, res){
        res.send(req.flash('error'));
    });

    app.post('/signup', passport.authenticate('local-signup', {
        succesRedirect: '/login',
        failureRedirect: '/signup',
        failureFlash: true
    }), function(req, res){
        let payload = { id: req.user._id }
        let token = jwt.sign(payload, 'ilovestormstormisthebestoftheworld!');
        res.json({message: "ok", token: token});
    });

    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: ['email', 'public_profile']
    }));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/users',
        failureRedirect: '/'
    }));

    app.get('/auth/google', passport.authenticate('google', {
        response_type: 'code',
        scope: ['email', 'profile']
    }));

    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/users',
        failureRedirect: '/'
    }));

    app.get('/logout', function(req, res){
        req.logOut();
        res.redirect('/');
    });


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

