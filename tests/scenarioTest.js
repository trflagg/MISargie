
module.exports = function(db, callback) {

    // var Fiber = require('fibers');

    var async = require('async'),
        assert = require('assert'),
        util = require('util'),
        constants = require('../constants'),
        MessageHolder = require('../models/MessageHolder')(db),
        Avatar = require('../models/Avatar')(db),
        Location = require('../models/Location')(db);

    console.log('_ Begin scenarioTest ___');

    var sleep = function(ms) {
        var fiber = Fiber.current;
        setTimeout(function() {
            fiber.run();
        }, ms);
        Fiber.yield();
    };

    async.waterfall([

        function(callback) {
            // load our hero
            db.load('Avatar', {_name: 'Picard'}, function(err, picard) {
                assert.equal(err, null, err);
                callback(null, picard);
            });
        },

        function(picard, callback) {
            // load location
            picard.changeLocation('Border of the Neutral Zone', function(err, result) {
                assert.equal(err, null, err);
                assert.equal(picard.getLocation().getName(), 'Border of the Neutral Zone');
                assert.equal(result, 'You are surrounded by empty space.');

                callback(null, picard);
            })
        },

        function(picard, callback) {
            // load first message
            db.load('Message', {name: 'G2_INIT'}, function(err, message) {
                assert.equal(err, null, err);
                message.run(picard, function(err, result) {
                    assert.equal(picard.getGlobal('level'), 1);
                    assert.equal(result, 'A suspicious ship approaches.\n');
                    assert.equal(picard.getCommandTextList()[0].text, 'Hail Ship');
                    assert.equal(picard.getCommandTextList()[1].text, 'Red Alert');

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
                message.run(picard, function(err, result) {
                    assert.equal(result, 'A suspicious ship approaches.\n');
                    assert.equal(picard.getCommandTextList()[0].text, 'Hail Ship');
                    assert.equal(picard.getCommandTextList()[1].text, 'Red Alert');
                    // user decides to go on red alert.
                    picard.runMessage('Red Alert', function(err, result) {
                        assert.equal(err, null, err);
                        callback(err, picard, result);
                    });
                });
            });
        },

        function(picard, result, callback) {
            assert.equal(result, 'The ships reverses thrust and comes to a complete halt. It hails you.\n');
            assert.equal(picard.getCommandTextList()[0].text, 'Respond to hail');
            assert.equal(picard.child('ship').child('weapons').getCommandTextList()[0].text, 'Ready weapons');
            assert.equal(picard.child('ship').getCommandTextList().length, 2);
            picard.hideChild('ship.weapons');
            assert.equal(picard.child('ship').getCommandTextList().length, 1);
            picard.showChild('ship.weapons');
            assert.equal(picard.getCommandTextList()[1].text, 'Shields up');

            // user responds shields up
            picard.runMessage('Shields up', function(err, result) {
                assert.equal(err, null, err);
                callback(err, picard, result);
            });
        },

        function(picard, result, callback) {
            assert.equal(result, 'Alarms go off signaling that the enemy vessel has readied its weapons.\n' +
                    util.format(constants.waitString,1000) +
                    '\nLasers strike from the front of the enemy ship, but they disintegrate in the shield.\n ');
            // test waitRegEx
            assert(constants.waitRegEx.test(result.split('\n')[1]));
            assert.equal(picard.getGlobal('response'), 1);
            // test yield
            assert.equal(picard.getGlobal('yield'), 1);
            // picard.pollForYield(function(err, result) {
            //     assert.equal(err, null, err);
            //     assert.equal(result, false);
            //     // wait 5s
            //     Fiber(function() {
            //         console.log('wait 5s');
            //         sleep(5000);
            //         picard.pollForYield(function(err, result) {
            //             assert.equal(err, null, err);
            //             assert.equal(result, 'The lasers go off again but the shields hold.\n');
            //             assert.equal(picard.getGlobal('yield'), 0);
            //             callback(null);
            //         });
            //     }).run();
            // });
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
