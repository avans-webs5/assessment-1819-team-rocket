const request = require('supertest');
const expect = require('chai').expect;

const should = require('chai').should();
const app = require('../app');

app.use('/users', require('../routes/users'));

function getRequest(route, statusCode, done){
	request(app)
		.get(route)
		.expect(statusCode)
		.end(function(err, res){
			if(err){ return done(err); }
			done(null, res);
        });
};

function postRequest(route, statusCode, data, done){
    request(app)
        .post(route)
        .send(data)
        .set('Accept', 'application/json')
        .expect(statusCode)
        .end(function(err, res){
            if(err) { return done(err) }
            done(null, res)
        });
}


describe('/users Route: ', function() {
    describe('POST a valid user', function() {
        it('should insert the user into the database', function(done){
            postRequest('/users', 200, { name: "testclient", email: "testclient123@gmail.com", password: "Testing123!"}, function(err, res) {
                if(err) { return done(err); }
    
                expect(res.body).to.not.be.undefined;
                expect(res.body).to.have.property('name');
                return done();
            });
        });
    });
    describe('GET from /users', function() {
        it('should return all users', function(done) {
            getRequest('/users', 200, function(err, res) {
               
                if(err){ return done(err); }

                expect(res.body).to.not.be.undefined;
                expect(res.body).to.have.property('validatedUsers');
                expect(res.body).to.have.property('validatedUsers').length.above(0); 
           
                return done();
            });
        });
    });
});