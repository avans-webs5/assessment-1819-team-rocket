const request = require('supertest');
const expect = require('chai').expect;
const should = require('chai').should();

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

app.use('/users', require('../routes/users'));


let userIds = [];

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


describe('/USERS ', function () {
    let userId;
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
        let testClient = User.deleteOne({'name': "testclient"});
        testClient.catch(err => {
            console.error(err);
        });
        let testClient2 = User.deleteOne({'name': "testclient2"});
        testClient2.catch(err => {
            console.error(err);
        });
    });
    describe('POST:', function () {
        describe('a valid user', function () {
            it('should insert the user into the database and return 200', function (done) {
                postRequest('/users', 200, {
                    email: "testclient@gmail.com",
                    password: "Testing123!"
                }, function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        expect(res.body).to.not.be.undefined;
                        expect(res.body).to.have.property('newUser');
                        expect(res.body.newUser);
                        expect(res.body.newUser).to.have.property('name');
                        expect(res.body.newUser).to.have.property('email');
                        expect(res.body.newUser).to.have.property('role');
                        userId = res.body.newUser.id;

                        done();
                    }
                });
            });
        });
        describe('a duplicate user', function () {
            it('should not insert in database and return 400', function (done) {
                postRequest('/users', 400, {
                    email: "testclient@gmail.com",
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
        describe('a valid user', function () {
            it('should give a 405', function (done) {
                deleteRequest('/users', 405, done);
            });
        });

    });
});
describe('MONGOOSE USER', function(){
    it('gets a user by name succesfully', function(done){
        const name = 'testclient';
        let result = User.find({}).byName(name);
        result.then(user => {

            expect(user).to.not.be.undefined;
            expect(user[0]).to.not.be.undefined;
            expect(user[0]).to.have.property('name');
            expect(user[0].name).to.be.equal(name);

            done();
        })
    });
    it('gets a user by email succesfully', function(done){
        const email = 'testclient@gmail.com';

        let result = User.findOne({}).byEmail(email);
        result.then(user => {
            expect(user).to.not.be.undefined;
            expect(user).to.have.property('email');
            expect(user.email).to.be.equal(email);
            done();
        })
    });
    it('gets a user by role succesfully', function(done){
        let result = User.find({}).byRole('user');
        result.then(user => {
            expect(user).to.not.be.undefined;
            expect(user[0]).to.not.be.undefined;
            expect(user[0]).to.have.property('role');
            expect(user[0].role).to.be.equal("user");
            done();
        })
    });
    it('hash password succesfully', function(done){
        let result = User.find({}).byName('testclient');
        result.then(user => {

            expect(user[0]).to.not.be.undefined;
            const result = user[0].generateHash('Testing123!');
            expect(result).to.not.be.undefined;
            done();
        })
    });
    it('valid password passes the validation check', function(done){
        let result = User.find({}).byName('testclient');
        result.then(user => {

            expect(user[0]).to.not.be.undefined;
            const result = user[0].validPassword('Testing123!');
            expect(result).to.not.be.undefined;
            done();
        })
    });

    before(function(done){
        for (let i = 10; i < 22; i++){
            postRequest('/users', 200, {
                email: "testclient"+ i +"@gmail.com",
                password: "Testing123!"
            }, function(err, res) {
                if(err) done(err);
                else {
                    userIds.push(res.body.newUser.id);
                }
            });
        }
        done();
    });
    it('user paginates automaticly', function(done){
        this.timeout(10000);
        let result = User.find({}).byPage();
        result.then(user => {


            expect(userIds.length).to.be.above(10);
            expect(user.length).to.be.equal(10);
            done();
        })
    });
    after(function(done){

        for (let i = 0; i < userIds.length; i++){
            deleteRequest('/users/' + userIds[i].replace('#', '_'), 200, function(err, res) {});
        }
        done();

    });
    it('invalid password does not pass validation check', function(done){
        let result = User.find({}).byName('testclient');
        result.then(user => {

            expect(user[0]).to.not.be.undefined;
            const result = user[0].validPassword('T');
            expect(result).to.be.equal(false);
            done();
        })
    });
    it('validate hashed password succefully', function(done){
        let result = User.find({}).byName('testclient');
        result.then(user => {

            expect(user[0]).to.not.be.undefined;
            const result = user[0].validHashedPassword('Testing123!', user[0].password);
            expect(result).to.not.be.undefined;
            done();
        })
    });
    it('hashed invalid password returns false', function(done){
        let result = User.find({}).byName('testclient');
        result.then(user => {

            expect(user[0]).to.not.be.undefined;
            const result = user[0].validHashedPassword('T', user[0].password);
            expect(result).to.be.equals(false);
            done();
        })
    });
    it('get provider returns undefined', function(done){
        let result = User.find({}).byName('testclient');
        result.then(user => {

            expect(user[0]).to.not.be.undefined;
            const result = user[0].getProvider('adfjkafl;');
            expect(result).to.be.undefined;
            done();
        })
    });
});
describe('/USERS/:ID ', function () {
    describe('GET:', function () {
        describe('with a valid user parameter', function () {
            it('give OK and return given user', function (done) {
                let result = User.findOne({'name': "testclient"});
                result.then(user => {
                    getRequest('/users/' + user.name + "_" + user.discriminator, 200, function (err, res) {

                        if (err) {
                            done(err);
                        } else {

                            expect(res.body).to.not.be.undefined;
                            expect(res.body).to.have.property('user');
                            expect(res.body.user).to.have.property('email');
                            expect(res.body.user).to.have.property('role');
                            expect(res.body.user).to.have.property('name');
                            expect(res.body.user).to.have.property('discriminator');
                            done();
                        }
                    });
                }).catch(err => {
                    console.error(err);
                });
            });
        });
        describe('with invalid user parameter', function () {
            it('should give a 404', function (done) {
                getRequest('/users/sdfakjdl;', 404, done);
            });
        });
    });
    describe('PUT:', function () {
        describe('with a valid user parameter', function () {
            it('give OK and return updated user', function (done) {
                const updatedName = 'testclient2';
                const updatedEmail = 'testclient2@gmail.com';

                let updatedUser = {
                    name: updatedName,
                    email: updatedEmail,
                    password: 'Testing1234!'
                };

                let result = User.findOne({'name': "testclient"});
                result.then(user => {
                    putRequest('/users/' + user.name + "_" + user.discriminator, 200, updatedUser, function (err, res) {

                        if (err) {
                            done(err);
                        } else {

                            expect(res.body).to.not.be.undefined;
                            expect(res.body).to.have.property('user');
                            expect(res.body.user).to.have.property('email');
                            expect(res.body.user).to.have.property('role');
                            expect(res.body.user).to.have.property('name');
                            expect(res.body.user.name).to.equal(updatedName);
                            expect(res.body.user.id).to.include(updatedName);
                            expect(res.body.user).to.have.property('discriminator');
                            done();
                        }
                    });
                }).catch(err => {
                    console.error(err);
                });
            });
        });
        describe('with invalid user parameter', function () {
            it('should give a 404', function (done) {
                putRequest('/users/sdfakjdl;', 404, {}, done);
            });
        });
    });
    describe('DELETE:', function () {
        describe('with a valid user paramter', function () {
            it('give OK and delete user', function (done) {
                let result = User.findOne({'name': "testclient2"});
                result.then(user => {
                    deleteRequest('/users/' + user.name + "_" + user.discriminator, 200, done);
                }).catch(err => {
                    console.error(err);
                });
            });
        });
        describe('with invalid user parameter', function () {
            it('should give a 404', function (done) {
                deleteRequest('/users/sdfakjdl;', 404, done);
            });
        });
    });
    describe('ALL:', function () {

    });
});
