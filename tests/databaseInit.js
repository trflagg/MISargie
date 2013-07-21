/**
 * Initializes the database with dummy test data.
 * @param  {Object}   service  Service connected to the database to load.
 * @param  {Function} callback Required callback with signiture function(err).
 */
module.exports = function(db, callback) {

    var async = require('async'),
        Message = require('../models/Message')(db),
        MessageHolder = require('../models/MessageHolder')(db),
        Avatar = require('../models/Avatar')(db);

    console.log('_ Begin databaseInit ___');

    async.waterfall([
            
            // make avatar
            function(callback) {
                db._db.collection('avatar').drop();
                db._db.collection('avatar').insert({
                    name: 'Taylor'
                }, function(err, result) {
                    console.log("created avatar.");
                    callback(null);
                });
            },

            // make message
            function(callback) {
                db._db.collection('message').drop();
                db._db.collection('message').insert({
                    name: 'G1_RED_ALERT',
                    text: 'Red Alert!\n{% setGlobal(red_alert,1) %}\n Battlestations!'
                }, function(err, newMessage) {
                    console.log("created message.");
                    callback(err);
                });

            },

            // make scenario data
            function(callback) {
                var avatar = db.create('Avatar');
                avatar.setName('Picard');
                var ship = new MessageHolder();
                ship.addChild('weapons', new MessageHolder());
                ship.addChild('shields', new MessageHolder());
                avatar.addChild('ship', ship);
                db.save('Avatar', avatar, function(err) { callback(err) });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_INIT');
                m1.setText('{% setGlobal(name,Picard) %} \n \
                    {% setGlobal(level, 1) %} \n \
                    A suspicious ship approaches. \n \
                    {% addMessage(Hail Ship, G2_HAIL) %} \n \
                    {% addMessage(Red Alert, G2_RED_ALERT) %}');
                m1.compile();

                db.save('Message', m1, function(err) { callback(err) });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_HAIL');
                m1.setText('This is captain Tolares. We have a medical emergency on our ship, we are requesting immediate emergency access. \n \
                    {% addMessage(Grant Access, G2_GRANT_ACCESS) %}');
                m1.compile();
                db.save('Message', m1, function(err) { callback(err) });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_READ_ALERT');
                m1.setText('The ships reverses thrust and comes to a complete halt. It hails you. \n \
                    {% addMessage(Respond to hail, G2_RESPOND) %} \n \
                    {% addMessage(Shields up, G2_SHIELDS_UP, ship.shields) %} \n \
                    {% addMessage(Ready weaponse, G2_READY_WEAPONS, ship.weapons) %}');
                m1.compile();
                db.save('Message', m1, function(err) {
                    console.log("created scenario."); 
                    callback(err) 
                });
            }

        ],
        function(err, result) {
            console.log('_ End databaseInit _____');
            callback();
        }
    );

};

