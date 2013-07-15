/**
 * Initializes the database with dummy test data.
 * @param  {Object}   service  Service connected to the database to load.
 * @param  {Function} callback Required callback with signiture function(err).
 */
module.exports = function(db, callback) {

    var async = require('async');

    console.log('_ Begin databaseInit ___');

    async.waterfall([
            function(callback) {
                db.collection('avatars').drop();
                // make avatar
                db.collection('avatars').insert({
                    name: 'Taylor'
                }, function(err, result) {
                    if (err) throw err;
                    callback(null);
                });
            },

        ],
        function(err, result) {
            console.log('_ End databaseInit _____');
            callback();
        }
    );

};

