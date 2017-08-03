const request = require('supertest');
require('express');

var OK = 200;
var NOK = 404;

var app = require('../server/Server.js');

describe("Target", function() {

		it("should return the empty list of target ids", function(done) {

			 request(app)
                          .get('/target')
                          .set('Accept', /json/)
                          .expect('Content-Type', /json/)
                          .expect(OK, done)
                          .expect({
                                targetIds: []
                          })
                          .end(done);

		});

		it("add an unexisting target id", function(done) {

			 request(app)
                          .get('/target/add')
                          .query({id: '123'})
                          .set('Accept', /json/)
                          .expect('Content-Type', /json/)
                          .expect(NOK, done);
		});
});
