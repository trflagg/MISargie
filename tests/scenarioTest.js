
module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        MessageHolder = require('../models/MessageHolder')(db),
        Avatar = require('../models/Avatar')(db);

    console.log('_ Begin scenarioTest ___');

    async.waterfall([

        function(callback) {
            // load our hero
            db.load('Avatar', {name: 'Picard'}, function(err, picard) {
                assert.equal(err, null, err);
                
                // load first message
                db.load('Message', {name: 'G2_INIT'}, function(err, message) {
                    assert.equal(err, null, err);
                    var result = message.run(picard);
                    assert.equal(picard.getGlobal('level'), 1);
                    assert.equal(result, 'A suspicious ship approaches.\n');
                    assert.equal(picard.getCommandTextList()[0], 'Hail Ship');
                    assert.equal(picard.getCommandTextList()[1], 'Red Alert');

                    // user decides to hail. run message
                    picard.runMessage('Hail Ship', function(err, result) {
                        callback(err, picard, result);
                    });
                });
            });
        },

        function(picard, result, callback) {
            assert.equal(result, 'This is captain Tolares. We have a medical emergency on our ship, we are requesting immediate emergency access.\n');
            // make sure message just ran is deleted
            assert.equal(picard.message('Hail Ship'), null);
            // make sure message is added
            assert.notEqual(picard.message('Grant Access'), null);
            assert.notEqual(picard.message('Red Alert'), null);

            // user grants access.
            picard.runMessage('Grant Access', function(err, result) {
                assert.equal(err, null, err);
                assert.equal(result, 'Thank you for your help.\n');
                assert.equal(picard.getGlobal('level'), 2);
                // make sure red alert option is removed
                assert.equal(picard.message('Red Alert'), null);
                callback(null, picard);
            })
        },

        function(picard, callback) {
            // re-initialize
            picard.clear();
            assert.equal(picard.messageCount(), 0);
            // load first message
            db.load('Message', {name: 'G2_INIT'}, function(err, message) {
                assert.equal(err, null, err);
                var result = message.run(picard);
                assert.equal(result, 'A suspicious ship approaches.\n');
                assert.equal(picard.getCommandTextList()[0], 'Hail Ship');
                assert.equal(picard.getCommandTextList()[1], 'Red Alert');

                // user decides to go on red alert.
                picard.runMessage('Red Alert', function(err, result) {
                    assert.equal(err, null, err);
                    callback(err, picard, result);
                });
            });
        },

        function(picard, result, callback) {
            assert.equal(result, 'The ships reverses thrust and comes to a complete halt. It hails you.\n');
            assert.equal(picard.getCommandTextList()[0], 'Respond to hail');
            assert.equal(picard.child('ship').child('weapons').getCommandTextList()[0], 'Ready weapons');
            assert.equal(picard.child('ship').child('shields').getCommandTextList()[0], 'Shields up');
            callback(null);
        }

    ],
        function(err, result) {
            if (err) {
                console.log("ERROR: " + err);
            }
            console.log('_ End scenarioTest _____');
            callback();
        }
    );

};