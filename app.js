const express = require("express");
const mongoose = require("mongoose");

const passport = require("passport");
const connectRoles = require("connect-roles");

const port = process.env.port || 3000;

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const flash = require("connect-flash");
const session = require("express-session");
const morgan = require("morgan");

const database = require("./config/database");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const secret = require("./config/auth").JWS.secret;

// Enable CORS with (origin: *) in development mode
if (process.env.NODE_ENV === "development") {
    const cors = require("cors");
    app.use(cors());
}

//Data acces layer
mongoose.connect(database.connection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true
}).then(() => {
     console.log("Database connected!");
}).catch(err => {
    console.log(err);
});

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(cookieParser(secret));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(flash());


//Password js
app.use(session({secret: secret, resave: true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

require("./config/passport")(passport);

//Connect-Roles

const user = new connectRoles({
    failureHandler: function (req, res, action) {
        res.status(403).json({
            statusCode: 403,
            message: "Access Denied - You don't have permission to: " + action
        });
    }
});

app.use(user.middleware());

require("./config/roles")(user);

//Routes
require("./routes")(app, passport, user, io);

app.use(function (err, req, res, next) {
    try {
        let error = JSON.parse(err.message);
        res.status(error.statusCode).send(error);
    } catch (e) {
        if (!err.name === "ValidatorError") err.statusCode = 400;
        else if (!err.statusCode) err.statusCode = 500;

        console.error(err.message);
        res.status(err.statusCode).send(err.message);
    }
});

http.listen(port);
console.log("I am using port " + port);

module.exports = app;
