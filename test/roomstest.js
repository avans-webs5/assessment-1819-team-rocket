const request = require('supertest');
const mongoose = require('mongoose');
const database = require('../config/database');
const User = require('../models/user');

const app = require('express')();
const secret = require('../config/auth').JWS.secret;

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(cookieParser(secret));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use('/rooms', require('../routes/rooms'));

function getRequest(route, statusCode, done) {
    request(app)
        .get(route)
        .expect(statusCode)
        .end(function (err, res) {
            if (err) done(err);
            else done(null, res);

        });
}

function postRequest(route, statusCode, data, done) {
    request(app)
        .post(route)
        .send(data)
        .set('Accept', 'application/json')
        .expect(statusCode)
        .end(function (err, res) {
            if (err) return done(err);
            else done(null, res);
        });
}

function deleteRequest(route, statusCode, done) {
    request(app)
        .delete(route)
        .expect(statusCode)
        .end(function (err, res) {
            if (err) return done(err);
            else done(null, res);
        });
}

function putRequest(route, statusCode, data, done) {
    request(app)
        .put(route)
        .send(data)
        .set('Accept', 'application/json')
        .expect(statusCode)
        .end(function (err, res) {
            if (err) return done(err);
            else done(null, res);
        });
}

describe('/ROOMS ', function () {
    before(function () {
        //Set up database connection
        mongoose.set('useCreateIndex', true);
        mongoose.connect(database.connection, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: true
        }).catch(err => {
            console.log(err);
        });

        //DELETE Test client if it hasnt been deleted yet
        let testRoom = User.deleteOne({'name': "testRoom"});
        testRoom.catch(err => {
            console.error(err);
        });
        let testRoom2 = User.deleteOne({'name': "testRoom2"});
        testRoom2.catch(err => {
            console.error(err);
        });
    });
    describe('GET:', function () {
        it('should give all rooms and return 200', function (done) {
            getRequest('/rooms', 200, function (err, res) {

                if (err) {
                    done(err);
                } else {
                    expect(res.body).to.not.be.undefined;
                    expect(res.body).to.have.property('rooms');
                    expect(res.body).to.have.property('rooms').length.above(0);

                    done();
                }
            });
        });
    });
});