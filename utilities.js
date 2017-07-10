var urlExists = require('url-exists');

var OK = 200;

exports.checkUrl = function(req, res) {

	var url = req.query.url;

	urlExists(url, function(err, exists) {

		if (err) {

			console.log("Error checking url %s : ", url, err);
		} else {

			res.status(OK).json('checkUrl', {
				url : url,
				exists : exists
			});
		}
	});
};