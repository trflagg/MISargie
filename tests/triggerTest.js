module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        util = require('util'),
        constants = require('../constants'),
        BNum = require('../models/bNum');

    console.log('_ Begin triggerTest ___');

    async.waterfall([

        function(callback) {
            // load our hero
            db.load('Avatar', {name: 'Picard'}, function(err, picard) {
                assert.equal(err, null, err);
                callback(null, picard);
            });
        },

        // like scenarioTest, but add trigger
        function(picard, callback) {
            // load first message
            db.load('Message', {name: 'G2_INIT'}, function(err, message) {
                assert.equal(err, null, err);
                message.run(picard, function(err, result) {

                    // addTrigger
                    picard.addTrigger('G2_TRIGGER_1');
                    assert.equal(picard._triggers[0], 'G2_TRIGGER_1');

                    // removeTrigger
                    picard.removeTrigger('G2_TRIGGER_1');
                    assert.equal(picard._triggers.length, 0);

                    // add it back
                    picard.addTrigger('G2_TRIGGER_1');

                    // user decides to hail. run message
                    picard.runMessage('Hail Ship', function(err, result) {
                        callback(err, picard, result);
                    });
                });
            });
        },

        function(picard, result, callback) {
            // test trigger is added to end
            assert.equal(result, 
                'This is captain Tolares. We have a medical emergency on our ship, we are requesting immediate emergency access.\n' +
                'Trigger!\n');

            // test logic in trigger
            picard.setGlobal('addTrigger', 1);

            // user decides to go on red alert.
            picard.runMessage('Red Alert', function(err, result) {
                assert.equal(err, null, err);
                callback(err, picard, result);
            });
        },

        function(picard, result, callback) {
            // test new trigger is added to end
            assert.equal(result, 
                'The ships reverses thrust and comes to a complete halt. It hails you.\n' +
                'Trigger!\n' +
                'add trigger!\n');
            assert.equal(picard._triggers.length, 1);
            assert.equal(picard._triggers[0], 'G2_TRIGGER_2');

            // test loading a message but don't call loadMessage
            picard.runMessage('Shields up', function(err, result) {
                assert.equal(err, null, err);
                callback(err, picard, result);
            });
        },

        function(picard, result, callback) {
            // test new trigger is added to end
            assert.equal(result, 
                    'Alarms go off signaling that the enemy vessel has readied its weapons.\n' +
                    util.format(constants.waitString,1000) +
                    '\nLasers strike from the front of the enemy ship, but they disintegrate in the shield.\n ' +
                    'Trigger 2!\n');
            assert.equal(picard._triggers.length, 1);
            assert.equal(picard._triggers[0], 'G2_TRIGGER_2');

            // test loading a loadedMessage and call loadMessage
            picard.setGlobal('addTrigger', 2);
            picard.runMessage('Respond to hail', function(err, result) {
                assert.equal(err, null, err);
                callback(err, picard, result);
            });
        },

        function(picard, result, callback) {
            // test new trigger is added to end
            assert.equal(result, 
                    'You hear no response. Only gargling.' +
                    'Alarms go off signaling that the enemy vessel has readied its weapons.\n' +
                    util.format(constants.waitString,1000) +
                    '\n The gargling noise transmitted from the enemy ship gets much louder.\n' +
                    'Gargling voice: Do you surrender?\n' +
                    'Trigger 2!\n' +
                    'You are surrounded by empty space.');
            assert.equal(picard._triggers.length, 0);

            callback(null);
        },


    ],
        function(err, result) {
            console.log('_ End triggerTest _____');
            callback();
        }
    );

};