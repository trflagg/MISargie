
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

                    // user decides to hail
                    var hailMessage = picard.message('Hail Ship');
                    db.load('Message', {name: hailMessage}, function(err, message) {
                        callback(err, picard, message);
                    });
                });
            });
        },
        function(picard, message, callback) {
            var result = message.run(picard);
            assert.equal(result, 'This is captain Tolares. We have a medical emergency on our ship, we are requesting immediate emergency access.\n');
            console.log(picard);
            callback(null);
        }

    ],
        function(err, result) {
            console.log('_ End scenarioTest _____');
            callback();
        }
    );

};