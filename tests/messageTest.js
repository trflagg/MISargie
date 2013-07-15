module.exports = function(db, callback) {

    var async = require('async'),
        assert = require('assert'),
        Message = require('../models/Message')(db);   

    console.log('_ Begin messageHolderTest ___');

    async.waterfall([
        function(callback) {
            var message = new Message();
            message.setName('Hello');
            assert.equal(message.getName(), 'Hello');
            message.setText('Hello world!');

            message.compile();
            assert.notEqual(message.getCompiled(), null);
            assert.equal(message.getCompiled().text, 'Hello world!');
            assert.equal(message.getCompiled().nextSibling, null);
            callback(message);

        }

    ],
        function(err, result) {
            console.log('_ End messageHolderTest _____');
            callback();
        }
    );

};