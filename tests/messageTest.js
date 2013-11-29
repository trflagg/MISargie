module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        Message = require('../models/Message')(db);

    console.log('_ Begin messageTest ___');

    async.waterfall([
        // create and compile simple message.
        function(callback) {
            var message = db.create('Message');
            message.setName('Hello');
            assert.equal(message.getName(), 'Hello');
            message.setText('Hello world!');

            message.compile();
            assert.notEqual(message.getCompiled(), null);
            // assert.equal(message.getCompiled().text, 'Hello world!');
            // assert.equal(message.getCompiled().nextSibling, null);
            template = message.getCompiled();
            assert.equal(template(), 'Hello world!');
            callback(null);
        },

        // load, compile, and save a message;
        function(callback) {
            db.load('Message', {name: 'G1_RED_ALERT'}, function(err, foundMessage) {
                assert.equal(err, null);
                var template = foundMessage.compile();
                var avatar = db.create('Avatar');
                var message_result = template({avatar: avatar});

                db.save('Message', foundMessage, function(err) {
                    assert.equal(err, null);
                    callback(null, foundMessage);
                });
            });
        },

        // run message on an avatar.
        function(message, callback) {
            db.load('Avatar', {name: 'Joe'}, function(err, avatar) {
                message.run(avatar, function(err, result) {
                    console.log(result);
                    // console.log(err);
                    assert.equal(result, 'Red Alert!\nBattlestations!\n');
                    assert.equal(avatar.getGlobal('red_alert'),1);
                    callback(err, avatar);
                });
            });
        },

        // test addMessage function.
        function(avatar, callback) {

            callback(null);
        }

    ],
        function(err, result) {
            console.log('_ End messageTest _____');
            callback();
        }
    );

};