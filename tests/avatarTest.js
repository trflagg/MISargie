
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
            avatar.save(function(error) {
                assert.equal(error, null, error);

                var avatar = new ava.Avatar();
                avatar.save(function(error) {
                    assert.equal(error, 'Avatar save failed: name required.');
                });

                callback(null);
            });
        },

        function(callback) {
            ava.load('Joe', function(error, avatar) {
                assert.equal(error, null);
                assert.equal(avatar.getName(), 'Joe');
                assert.equal(avatar.getGlobal('level'), 1);
                avatar.setGlobal('something', 2);

                //should only save once
                avatar.save(function(error, result) {
                    assert.equal(error, null, error);
                    callback(null);
                })
            });
        }

    ],
        function(err, result) {
            console.log('_ End avatarTest _____');
            callback();
        }
    );

};