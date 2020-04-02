const request = require('supertest');
const expect = require('chai').expect;
const should = require('chai').should();

const mongoose = require('mongoose');
const database = require('../config/database');
const user = require('../models/user');

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

app.use('/users', require('../routes/users'));

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

describe('/USERS ', function () {
    let userId = undefined;
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
        let result = user.deleteOne({'name' : "testclient"});
        result.catch(err => {
            console.error(err);
        });
    });
    describe('POST:', function () {
        describe('a valid user', function () {
            it('should insert the user into the database and return 200', function (done) {
                postRequest('/users', 200, {
                    name: "testclient",
                    email: "testclient123@gmail.com",
                    password: "Testing123!"
                }, function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        expect(res.body).to.not.be.undefined;
                        expect(res.body).to.have.property('result');
                        expect(res.body.result);
                        expect(res.body.result).to.have.property('name');
                        expect(res.body.result).to.have.property('email');
                        expect(res.body.result).to.have.property('role');
                        userId = res.body.result.id;

                        done();
                    }
                });
            });
        });
        describe('a duplicate user', function () {
            it('should not insert in database and return 400', function (done) {
                postRequest('/users', 400, {
                    name: "testclient",
                    email: "testclient123@gmail.com",
                    password: "Testing123!"
                }, done);
            });
        });
        describe('an invalid user', function () {
            it('should not insert in database and return 400', function (done) {
                postRequest('/users', 400, {
                    email: "testclient123@gmail.com",
                }, done);
            });
        });
        after
    });

    describe('GET:', function () {
        it('should give all usres and return 200', function (done) {
            getRequest('/users', 200, function (err, res) {

                if (err) {
                    done(err);
                } else {
                    expect(res.body).to.not.be.undefined;
                    expect(res.body).to.have.property('validatedUsers');
                    expect(res.body).to.have.property('validatedUsers').length.above(0);

                    done();
                }
            });
        });
    });

    describe('DELETE:', function () {
        it('should give a 405', function (done) {
            deleteRequest('/users', 405, done);
        });
    });
});
describe('/USERS/:ID ', function () {
    describe('GET:', function () {
        it('give OK and return given user', function (done) {
            getRequest('/users/testclient', 200, function (err, res) {

                if (err) {
                    done(err);
                } else {
                    expect(res.body).to.not.be.undefined;
                    expect(res.body).to.have.property('validatedUsers');
                    expect(res.body).to.have.property('validatedUsers').length.above(0);

                    done();
                }
            });
        });
    });
});
