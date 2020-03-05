const express       = require('express');
const mongoose      = require('mongoose');
const passport      = require('passport');

const port          = process.env.port || 3000

const bodyParser    = require('body-parser');
const cookieParser  = require('cookie-parser');

const flash         = require('connect-flash');
const session       = require('express-session');
const morgan        = require('morgan');

const app           = express();

const secret = 'ilovestormstormisthebestoftheworld!'

//Data acces layer

mongoose.connect('mongodb://localhost:27017/chatroom-socketio', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log('Database connected!');
}).catch(err => {
    console.log(err);
});


app.use(morgan('dev'));
app.use(flash());

app.use(cookieParser(secret));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//Password js

app.use(session({secret: secret}));
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

//Routes
require('./routes/routes')(app, passport);

app.use(function (err, req, res, next) {
    console.error(err.message);
    if (!err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).send(err.message);
});

app.listen(port);
console.log('I am using port ' + port);