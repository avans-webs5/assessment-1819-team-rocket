module.exports = function(app, passport, user) {
    
    require('./authentication', user.can('access login page'))(app,passport);
    app.use('/users', passport.authenticate('jwt', {session: false}), user.can('access userinfo page'), require('./users'));
    app.use('/rooms', passport.authenticate('jwt', {session: false}), user.can('get room info'), require('./rooms')(passport, user));


    /*function isLoggedIn(req, res, next) {

        // if user is authenticated in the session, carry on 
        if (req.isAuthenticated())
            return next();
    
        // if they aren't redirect them to the home page
        res.redirect('/');
    }*/
}
