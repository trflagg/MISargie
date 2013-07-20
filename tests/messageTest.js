module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        msg = require('../models/Message')(db);   

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
            assert.equal(message.getCompiled().text, 'Hello world!');
            assert.equal(message.getCompiled().nextSibling, null);
            callback(null);
        },

        // load, compile, and save a message;
        function(callback) {
            db.load('Message', {name: 'G1_RED_ALERT'}, function(err, foundMessage) {
                assert.equal(err, null);
                var node = foundMessage.compile();
                assert.notEqual(node, 'hello');
                assert.equal(node.type, 'text');
                assert.equal(node.nextSibling.type, 'code');
                assert.equal(node.nextSibling.p[0], 'red_alert');
                assert.equal(node.nextSibling.nextSibling.text, 'Battlestations!');
                db.save('Message', foundMessage, function(err) {
                    assert.equal(err, null);
                    callback(null);
                })
            })
        }

    ],
        function(err, result) {
            console.log('_ End messageTest _____');
            callback();
        }
    );

};