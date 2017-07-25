var chakram = require('chakram'), expect = chakram.expect;
var config = require('config');

var server = require('../server/Server.js');

before(function () {
       
    server.listen();
});

after(function () {
   
   server.close();
});

describe("Affinities", function() {

	var serviceUrl = config.get('app.server') + ':' + config.get('app.port')
			+ '/affinities/interesting';

	describe("get interesting affinities list from " + serviceUrl, function() {

		var apiResponse = {};

		before(function() {

			apiResponse = chakram.get(serviceUrl);
			return apiResponse;
		});

		it("should return 200 on success", function() {

			return expect(apiResponse).to.have.status(200);
		});

		it("should return content type header", function() {

			expect(apiResponse).to.have.header("content-type", /json/);

			return chakram.wait();
		});
	});
});