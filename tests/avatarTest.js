
module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        Avatar = require('../models/Avatar')(db);   

    console.log('_ Begin avatarTest ___');

    async.waterfall([
        function(callback) {
            var avatar = db.create('Avatar');
            avatar.setName('Joe');
            avatar.setGlobal('level', 1);
            db.save('Avatar', avatar, function(error) {
                assert.equal(error, null, error);

                callback(null);
            });
        },

        function(callback) {
            db.load('Avatar',{name: 'Joe'}, function(error, avatar) {
                assert.equal(error, null);
                assert.equal(avatar.getName(), 'Joe');
                assert.equal(avatar.getGlobal('level'), 1);
                avatar.setGlobal('something', 2);

                //should only save once
                db.save('Avatar', avatar, function(error, result) {
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