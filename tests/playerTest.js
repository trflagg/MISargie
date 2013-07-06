/**
 * Initializes the database with dummy test data.
 * @param  {Object}   service  Service connected to the database to load.
 * @param  {Function} callback Required callback with signiture function(err).
 */
module.exports = function(db, callback) {

    var async = require('async'),
        Player = require('../models/Player');

    console.log('_ Begin playerTest ___');

    async.waterfall([
        function(callback) {
            var player = new Player();

            player.setGlobal('name', 'Taylor');
            player.save();

            callback(null);
        }

    ],
        function(err, result) {
            console.log('_ End playerTest _____');
            callback();
        }
    );

};