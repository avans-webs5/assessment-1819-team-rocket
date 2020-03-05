const express   = require('express');
const mongoose  = require('mongoose');
const passport  = require('passport');

const port = process.env.port || 3000

const cookieParser  = require('cookie-parser');
const bodyParser    = require('body-parser');
const session       = require('express-session');

//Data acces layer

mongoose.connect('mongodb://localhost:27017/chatroom-socketio', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log('Database connected!');
}).catch(err => {
    console.log(err);
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//Password js

app.use(session({secret: 'ilovestormstormisthebestoftheworld!'}));
app.use(passpo)

//Routes
app.use('/', require('./routes/authentication'));

app.use(function (err, req, res, next) {
    console.error(err.message);
    if (!err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).send(err.message);
});

app.listen(port);