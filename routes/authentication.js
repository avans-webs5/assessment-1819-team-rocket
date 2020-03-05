
module.exports = function(app, passport){

    app.get('/login', function(req, res){
        res.send('Hello login!');
    });
    
    app.get('/logout', function(req, res){
        req.logOut();
        res.redirect('/');
    });
    
    app.get('/signup', function(req, res){
        res.send(req.flash('error'));
    });
    
    app.post('/signup', passport.authenticate('local-signup', {
        succesRedirect: '/users',
        failureRedirect: '/signup',
        failureFlash: true
    }));
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

