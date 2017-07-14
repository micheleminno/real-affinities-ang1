var chakram = require('chakram'), expect = chakram.expect;

var config = require('../server/config.js');

describe("Server", function() {

	var serviceUrl = config.app.url + '/';

	describe("get server response from " + serviceUrl, function() {

		var apiResponse = {};

		before(function() {

			apiResponse = chakram.get(serviceUrl);
			return apiResponse;
		});

		it("should return 200 on success", function() {

			return expect(apiResponse).to.have.status(200);
		});

		it("should return content type header", function() {

			expect(apiResponse).to.have.header("content-type", /text/);

			return chakram.wait();
		});
	});
});