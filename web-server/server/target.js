var affinities = require('./affinities');
var db = require('./db');

var OK = 200;
var NOK = 404;

exports.list = function(req, res) {

  db.select('id')
		.from('target')
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

                res.status(NOK).json({error: "User " + userId + " doesn't exist"});
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


		var userId = req.query.id;
		affinities.remove(userId, function(data) {

			console.log("Affinities removed for user " + userId);
			console.log(JSON.stringify(data));

			db('target')
        .where('id', userId)
        .del()
        .then(function() {

            	res.end("1");
				});
	 });
};

exports.removeAll = function(req, res) {

		db('target')
      .truncate()
      .then(function() {

        db('affinity')
          .truncate()
          .then(function() {

          			res.end("1");
					});
	 });
};

exports.contains = function(req, res) {

		db('target')
      .count('* as t')
      .where('id', req.query.id)
      .then(function() {

				res.end(JSON.stringify(rows[0]["t"]));

		  });
};
