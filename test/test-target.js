var chakram = require('chakram'), expect = chakram.expect;

var config = require('./../config.js');

describe("Target", function() {

	var serviceUrl = config.app.url + '/target';

	describe("get target list from " + serviceUrl, function() {

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