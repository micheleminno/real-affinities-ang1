var affinities = require('./affinities.js');

var OK = 200;

exports.list = function(req, res) {

	req.getConnection(function(err, connection) {

		connection.query('SELECT id FROM target', function(err, rows) {

			if (err) {
				console.log("Error Selecting : %s ", err);
			} else {

				var ids = [];
				for ( var rowIndex in rows) {

					ids.push(rows[rowIndex]["id"]);
				}

				res.status(OK).json('target', {
					targetIds : ids
				});
			}
		});
	});
};

exports.add = function(req, res) {

	req.getConnection(function(err, connection) {

		var userId = req.query.id;
		affinities.add(connection, userId, function(data) {

			console.log("Affinities added for user " + userId);
			console.log(JSON.stringify(data));

			var query = "INSERT IGNORE INTO target VALUES (" + userId + ", "
					+ data["followers"]["page"] + ", "
					+ data["friends"]["page"] + ", "
					+ data["followers"]["cursor"] + ", "
					+ data["friends"]["cursor"] + ")";

			connection.query(query, function(err, rows) {

				if (err) {
					console.log("MySQL " + err);
				} else {
					if (rows.affectedRows > 0) {

						console.log("User " + userId + " inserted");
						res.end("1");

					} else {

						console.log("User " + userId + " already present");
						res.end("0");
					}
				}
			});
		});
	});
};

exports.remove = function(req, res) {

	req.getConnection(function(err, connection) {

		var userId = req.query.id;
		affinities.remove(connection, userId, function(data) {

			console.log("Affinities removed for user " + userId);
			console.log(JSON.stringify(data));

			connection.query("DELETE FROM target WHERE id = " + userId,
					function(err, rows) {
						if (err) {
							console.log("Problem with MySQL" + err);
						} else {
							res.end("1");
						}
					});
		});
	});
};

exports.removeAll = function(req, res) {

	req.getConnection(function(err, connection) {

		connection.query("TRUNCATE TABLE target", function(err, rows) {
			if (err) {
				console.log("Problem with MySQL" + err);
			} else {
				connection.query("TRUNCATE TABLE affinity",
						function(err, rows) {
							if (err) {
								console.log("Problem with MySQL" + err);
							} else {
								res.end("1");
							}
						});
			}
		});
	});
};

exports.contains = function(req, res) {

	req.getConnection(function(err, connection) {

		connection.query("SELECT COUNT(*) from target WHERE id = "
				+ req.query.id, function(err, rows) {

			if (err) {
				console.log("Problem with MySQL" + err);
			} else {
				res.end(JSON.stringify(rows[0]["COUNT(*)"]));
			}
		});
	});
};