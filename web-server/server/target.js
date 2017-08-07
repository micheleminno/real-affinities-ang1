var affinities = require('./affinities');
var db = require('./db');

var OK = 200;
var NOK = 404;

exports.list = function(req, res) {

  db.select('id')
		.from('users')
		.then(function(rows) {

			var ids = [];
			for ( var rowIndex in rows) {

				ids.push(rows[rowIndex]["id"]);
			}

			res.status(OK).json({
				targetIds : ids
			});
		})
	  .catch(function(error) { console.error(error); });
};

exports.add = function(req, res) {

		var userId = req.query.id;
		affinities.add(userId, function(data) {

            if(data.userId === null) {

                res.status(NOK).json({
                    error : "User " + userId + " doesn't exist"
				        });
            }
            else {

            	console.log("Affinities added for user " + userId);

            	var query = "INSERT IGNORE INTO target VALUES (" + userId + ", "
        					+ data["followers"]["page"] + ", "
        					+ data["friends"]["page"] + ", "
        					+ data["followers"]["cursor"] + ", "
        					+ data["friends"]["cursor"] + ")";

              db.raw(query).then(function(response) {

                if (response.rows.affectedRows > 0) {

                  console.log("User " + userId + " inserted");
                  res.end("1");

                } else {

                  console.log("User " + userId + " already present");
                  res.end("0");
                }
              })
    		   }
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
