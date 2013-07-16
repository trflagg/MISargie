/**
 * Initializes the database with dummy test data.
 * @param  {Object}   service  Service connected to the database to load.
 * @param  {Function} callback Required callback with signiture function(err).
 */
module.exports = function(db, callback) {

    var async = require('async');

    console.log('_ Begin databaseInit ___');

    async.waterfall([
            
            // make avatar
            function(callback) {
                db.collection('avatars').drop();
                db.collection('avatars').insert({
                    name: 'Taylor'
                }, function(err, result) {
                    console.log("created avatar.");
                    callback(null);
                });
            },

            // make message
            function(callback) {
                db.collection('messages').drop();
                db.collection('messages').insert({
                    name: 'G1_RED_ALERT',
                    text: 'Red Alert!\n{% setGlobal(red_alert,1) %}\n Battlestations!'
                }, function(err, newMessage) {
                    console.log("created message.");
                    callback(err);
                })
            }

        ],
        function(err, result) {
            console.log('_ End databaseInit _____');
            callback();
        }
    );

};

