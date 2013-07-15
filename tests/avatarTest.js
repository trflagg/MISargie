/**
 * Initializes the database with dummy test data.
 * @param  {Object}   service  Service connected to the database to load.
 * @param  {Function} callback Required callback with signiture function(err).
 */
module.exports = function(db, callback) {

    var async = require('async'),
        Player = require('../models/Avatar');

    console.log('_ Begin avatarTest ___');

    async.waterfall([
        function(callback) {
            var avatar = new Avatar();

            avatar.save();

            callback(null);
        }

    ],
        function(err, result) {
            console.log('_ End avatarTest _____');
            callback();
        }
    );

};