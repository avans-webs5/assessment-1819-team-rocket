

module.exports = function (app, passport, user, io) {

    require("./routes/authentication", user.can("access login page"))(
        app,
        passport
    );

    app.use(
        "/users",
        passport.authenticate("jwt", {session: false}),
        user.can("access userinfo page"),
        require("./routes/users")
    );

    app.use(
        "/rooms",
        passport.authenticate("jwt", {session: false}),
        user.can("get room info"),
        require("./routes/rooms")(passport, user)
    );

    require("./routes/websocket")(io);

    /*function isLoggedIn(req, res, next) {

          // if user is authenticated in the session, carry on
          if (req.isAuthenticated())
              return next();

          // if they aren't redirect them to the home page
          res.redirect('/');
      }*/
};
