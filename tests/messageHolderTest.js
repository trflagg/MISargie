
module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        MessageHolder = require('../models/MessageHolder')(db),
        ava = require('../models/Avatar')(db);

    console.log('_ Begin messageHolderTest ___');

    async.waterfall([
        // simple tests
        function(callback) {
            var messageHolder = new MessageHolder();
            messageHolder.addMessage('Red Alert', 'G1_RED_ALERT');
            messageHolder.addMessage('Yellow Alert', 'G1_YELLOW_ALERT');
            messageHolder.addMessage('Green Alert', 'G1_GREEN_ALERT');
            assert.equal(messageHolder.messageCount(), 3);
            assert.equal(messageHolder.getCommandTextList()[0], 'Red Alert');
            assert.equal(messageHolder.getCommandTextList()[1], 'Yellow Alert');
            assert.equal(messageHolder.getCommandTextList()[2], 'Green Alert');

            messageHolder.removeMessage('Yellow Alert');
            assert.equal(messageHolder.messageCount(), 2);

            messageHolder.runMessage('Something Else', null, function(error) {
                assert.equal(error, 'Message with commandText Something Else not found.');

                messageHolder.runMessage('Red Alert', null, function(error) {
                    assert.equal(error, null);
                    var obj = messageHolder.toObject();
                    assert.equal(obj['Red Alert'], 'G1_RED_ALERT');
                    assert.equal(obj['Green Alert'], 'G1_GREEN_ALERT');

                    var weapons = new MessageHolder();
                    weapons.addMessage('Fire Lasers', 'G1_FIRE_LASERS');
                    weapons.addMessage('Fire Torpedos', 'G1_FIRE_TORPEDOS');
                    messageHolder.addChild('Weapons', weapons);
                    var shields = new MessageHolder();
                    shields.addMessage('Shields Up', 'G1_SHIELDS_UP');
                    shields.addMessage('Shields Fullstrength', 'G1_SHEILDS_FULL');
                    messageHolder.addChild('Shields', shields);

                    var obj = messageHolder.toObject();
                    assert.equal(obj['Weapons']['Fire Lasers'], 'G1_FIRE_LASERS');
                    assert.equal(obj['Shields']['Shields Fullstrength'], 'G1_SHEILDS_FULL');

                    assert.equal(messageHolder.child('Weapons'), weapons);
                    messageHolder.removeChild('Weapons');
                    assert.equal(messageHolder.child('Weapons'), null);
                    callback(null, messageHolder);
                });
            });
        },

        // avatar as messageHolder
        function(messageHolder, callback) {
            ava.load('Joe', function(err, avatar) {
                assert.equal(err, null);
                avatar.addMessage('Hail Ship', 'G1_HAIL_SHIP');
                assert.equal('G1_HAIL_SHIP', avatar.message('Hail Ship'));
                avatar.addChild('Shields', messageHolder.child('Shields'));
                var weapons = new MessageHolder();
                weapons.addMessage('Fire Lasers', 'G1_FIRE_LASERS');
                weapons.addMessage('Fire Torpedos', 'G1_FIRE_TORPEDOS');
                avatar.addChild('Weapons', weapons);
                
                avatar.save(function(err, result) {
                    assert.equal(err, null);
                    callback(null);
                });
            });
        },

        // load avatar with messages
        function(callback) {
            ava.load('Joe', function(err, avatar) {
                assert.equal(err, null);
                console.log(avatar);
                assert.equal(avatar.messageCount(), 1);
                assert.equal(avatar.child('Shields').message('Sheilds Up'), 'G1_SHIELDS_UP');
                callback(null);
            });
        }

    ],
        function(err, result) {
            console.log('_ End messageHolderTest _____');
            callback();
        }
    );

};