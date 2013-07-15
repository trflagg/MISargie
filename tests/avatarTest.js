/**
 * Initializes the database with dummy test data.
 * @param  {Object}   service  Service connected to the database to load.
 * @param  {Function} callback Required callback with signiture function(err).
 */
module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        ava = require('../models/Avatar')(db);   

    console.log('_ Begin avatarTest ___');

    async.waterfall([
        function(callback) {
            var avatar = new ava.Avatar();
            avatar.setName('Joe');
            avatar.setGlobal('level', 1);
            avatar.save(function(error, result) {
                assert.equal(error, null);
                assert.equal(result.name, 'Joe');

                var avatar = new ava.Avatar();
                avatar.save(function(error, result) {
                    assert.equal(error, 'Avatar save failed: name required.');
                })

                callback(null);
            });
        },

        function(callback) {
            ava.load('Joe', function(error, avatar) {
                assert.equal(error, null);
                assert.equal(avatar.getName(), 'Joe');
                assert.equal(avatar.getGlobal('level'), 1);
                callback(null);
            })    
        }

    ],
        function(err, result) {
            console.log('_ End avatarTest _____');
            callback();
        }
    );

};