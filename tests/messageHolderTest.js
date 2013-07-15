
module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        MessageHolder = require('../models/MessageHolder')(db);   

    console.log('_ Begin messageHolderTest ___');

    async.waterfall([
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
                    shields.addMessage('Shields Fullstrenght', 'G1_SHEILDS_FULL');
                    messageHolder.addChild('Shields', shields);

                    var obj = messageHolder.toObject();
                    assert.equal(obj['Weapons']['Fire Lasers'], 'G1_FIRE_LASERS');
                    assert.equal(obj['Shields']['Shields Fullstrenght'], 'G1_SHEILDS_FULL');

                    assert.equal(messageHolder.child('Weapons'), weapons);
                    messageHolder.removeChild('Weapons');
                    assert.equal(messageHolder.child('Weapons'), null);
                    callback(null);
                })
            });
        },

    ],
        function(err, result) {
            console.log('_ End messageHolderTest _____');
            callback();
        }
    );

};