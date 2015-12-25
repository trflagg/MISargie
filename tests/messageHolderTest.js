
module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        MessageHolder = require('../models/MessageHolder')(db),
        Avatar = require('../models/Avatar')(db);

    console.log('_ Begin messageHolderTest ___');

    async.waterfall([
        // simple tests
        function(callback) {
            var messageHolder = new MessageHolder();
            messageHolder.addMessage('Red Alert', 'G1_RED_ALERT');
            messageHolder.addMessage('Yellow Alert', 'G1_YELLOW_ALERT');
            messageHolder.addMessage('Green Alert.', 'G1_GREEN_ALERT');
            assert.equal(messageHolder.messageCount(), 3);
            assert.equal(messageHolder.getCommandTextList()[0].text, 'Red Alert');
            assert.equal(messageHolder.getCommandTextList()[1].text, 'Yellow Alert');
            assert.equal(messageHolder.getCommandTextList()[2].text, 'Green Alert.');

            messageHolder.removeMessage('Yellow Alert');
            assert.equal(messageHolder.messageCount(), 2);

            var obj = messageHolder.toObject();
            assert.equal(obj['Red Alert'], 'G1_RED_ALERT');
            assert.equal(obj['Green Alert[dot]'], 'G1_GREEN_ALERT');

            var message_name = messageHolder.message('Green Alert.');
            assert.equal(message_name, 'G1_GREEN_ALERT');

            messageHolder.removeMessage('Green Alert.');
            assert.equal(messageHolder.messageCount(), 1);

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
        },

        // avatar as messageHolder
        function(messageHolder, callback) {
            db.load('Avatar', {_name:'Joe'}, function(err, avatar) {
                assert.equal(err, null);
                avatar.addMessage('Hail Ship', 'G1_HAIL_SHIP');
                assert.equal('G1_HAIL_SHIP', avatar.message('Hail Ship'));
                avatar.addChild('Shields', messageHolder.child('Shields'));
                var weapons = new MessageHolder();
                weapons.addMessage('Fire Lasers', 'G1_FIRE_LASERS');
                weapons.addMessage('Fire Torpedos', 'G1_FIRE_TORPEDOS');
                avatar.addChild('Weapons', weapons);
                db.save('Avatar', avatar, function(err, result) {
                    assert.equal(err, null);
                    callback(null);
                });
            });
        },

        // load avatar with messages
        function(callback) {
            db.load('Avatar', {_name: 'Joe'}, function(err, avatar) {
                assert.equal(err, null);
                assert.equal(avatar.messageCount(), 1);
                assert.equal(avatar.child('Shields')._messages['Shields Up'], 'G1_SHIELDS_UP');
                callback(null, avatar);
            });
        },

        // addMessage to child
        function(avatar, callback) {
            avatar.addMessage('Power down', 'G1_POWER_DOWN', 'Weapons');
            assert.equal(avatar.child('Weapons')._messages['Power down'], 'G1_POWER_DOWN');
            avatar.child('Weapons').addChild('Energy', new MessageHolder());
            avatar.addMessage('Power up', 'G1_POWER_UP', 'Weapons.Energy');
            assert.equal(avatar.child('Weapons').child('Energy')._messages['Power up'], 'G1_POWER_UP');
            callback(null);
        }

    ],
        function(err, result) {
            console.log('_ End messageHolderTest _____');
            callback();
        }
    );

};
