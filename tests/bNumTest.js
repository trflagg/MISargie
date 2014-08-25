module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        BNum = require('../models/bNum');

    console.log('_ Begin bNumTest ___');

    async.waterfall([

        // test save.('bNum',.
        function(callback) {
            var bNum = db.create('bNum');
            bNum.setValue(0.1);
            assert.equal(bNum.getValue(), 0.1);
            db.save('bNum', bNum, function(err) {
                assert.equal(err, null);
                callback(null)
            });
        },

        // test load('bNum',... and save validation
        function(callback) {
            db.load('bNum', {value: 0.1}, function(err, foundBNum) {
                assert.equal(err, null);
                assert.equal(foundBNum.getValue(), 0.1);
                foundBNum.setValue(37);
                db.save('bNum', foundBNum, function(err) {
                    assert.equal(err, 'BNum save validation failed: value >= 1!');
                    foundBNum.setValue(-1.000001);
                    db.save('bNum', foundBNum, function(err) {
                        assert.equal(err, 'BNum save validation failed: value <= -1!');
                        callback(null);
                    });
                });
            });
        },

        // test avatar.setBNum()
        function(callback) {
            db.load('Avatar', {name: 'Joe'}, function(err, avatar) {
                assert.notEqual(avatar, null);
                avatar.setBNum('bNumTest', db.create('bNum').setValue(0.5));
                avatar.setBNum('bNumTest-2', db.create('bNum').setValue(-0.756));
                db.save('Avatar', avatar, function(err) {
                    assert.equal(err, null);
                    callback(null);
                });
            });
        },

        // test avatar.addBNum()
        function(callback) {
            db.load('Avatar', {name: 'Joe'}, function(err, avatar) {
                var bNum = avatar.getBNum('bNumTest');
                assert.equal(bNum.getValue(), 0.5);
                assert.equal(avatar.getBNum('bNumTest-2').getValue(), -0.756);
                avatar.addBNum('bNumTest', -0.75);
                assert.equal(avatar.getBNum('bNumTest').getValue(), 0.125);
                callback(null);
            });
        },

    ],
        function(err, result) {
            console.log('_ End bNumTest _____');
            callback();
        }
    );

};
