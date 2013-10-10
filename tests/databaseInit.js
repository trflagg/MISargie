/**
 * Initializes the database with dummy test data.
 * @param  {Object}   service  Service connected to the database to load.
 * @param  {Function} callback Required callback with signiture function(err).
 */
module.exports = function(db, callback) {

    var async = require('async'),
        Message = require('../models/Message')(db),
        MessageHolder = require('../models/MessageHolder')(db),
        Avatar = require('../models/Avatar')(db),
        BNum = require('../models/bNum')(db),
        Location = require('../models/Location')(db),
        Quest = require('../models/Quest')(db);

    console.log('_ Begin databaseInit ___');

    async.waterfall([

            // make avatar
            function(callback) {
                db.deleteAll('Avatar');
                db._db.collection('avatar').insert({
                    name: 'Taylor'
                }, function(err, result) {
                    console.log("created avatar.");
                    callback(null);
                });
            },

            // make message
            function(callback) {
                db.deleteAll('Message');
                var message = db.create('Message');
                message.setName('G1_RED_ALERT');
                message.setText('Red Alert!\n{% setGlobal(red_alert,1) %}\n Battlestations!');

                db.save('Message', message, function(err) {
                    console.log("created message.");
                    callback(err);
                });

            },

            // misc
            function(callback) {
                db.deleteAll('bNum');

                callback(null);
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
                db.deleteAll('Location');
                var loc = db.create('Location');
                loc.setName('Border of the Neutral Zone');
                loc.setDescription('The farthest edge of space under federation control.');
                loc.setMessage('G2_LOC_NEUTRAL_ZONE');
                db.save('Location', loc, function(err) { callback(err) });
            },

            function(callback) {
                db.deleteAll('Quest');
                var quest = db.create('Quest');
                quest.setName('Partol the Neutral Zone');
                quest.setDescription('Make sure no bad people come in.');
                db.save('Quest', quest, function(err) { callback(err) });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_LOC_NEUTRAL_ZONE');
                m1.setText('You are surrounded by empty space.');
                m1.compile();
                db.save('Message', m1, function(err) { callback(err) });
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
                m1.setName('G2_GRANT_ACCESS');
                m1.setText('Thank you for your help. \n \
                    {% setGlobal(level, 2) %} \n \
                    {% removeMessage(Red Alert) %}');
                m1.compile();
                db.save('Message', m1, function(err) { callback(err) });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_RED_ALERT');
                m1.setText('The ships reverses thrust and comes to a complete halt. It hails you. \n \
                    {% addMessage(Respond to hail, G2_RESPOND) %} \n \
                    {% addMessage(Shields up, G2_SHIELDS_UP) %} \n \
                    {% addMessage(Ready weapons, G2_READY_WEAPONS, ship.weapons) %} \n \
                    {% removeMessage(Hail Ship) %}');
                m1.compile();
                db.save('Message', m1, function(err) {
                    callback(err)
                });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_RESPOND');
                m1.setText('You hear no response. Only gargling. \n \
                    {% setGlobal(response, 0) %} \n \
                    {% loadMessage(G2_SHIP_THREATENS) %}');
                m1.compile();
                db.save('Message', m1, function(err) {
                    callback(err)
                });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_SHIELDS_UP');
                m1.setText('{% setGlobal(response, 1) %} \n \
                    {% loadMessage(G2_SHIP_THREATENS) %}');
                m1.compile();
                db.save('Message', m1, function(err) {
                    callback(err)
                });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_READY_WEAPONS');
                m1.setText('{% setGlobal(response, 2) %} \n \
                    {% loadMessage(G2_SHIP_THREATENS) %}');
                m1.compile();
                db.save('Message', m1, function(err) {
                    callback(err)
                });
            },

            function(callback) {
                var m1 = db.create('Message');
                m1.setName('G2_SHIP_THREATENS');
                m1.setText('Alarms go off signaling that the enemy vessel has readied its weapons. \n \
                    {% ifGlobal(response, eq, 1) %} \n \
                    Lasers strike from the front of the enemy ship, but they disintegrate in the shield. \n \
                    {% yield(3) %} \n \
                    The lasers go off again but the shields hold. \n \
                    {% endif %} \n \
                    {% ifGlobal(response, eq, 2) %} \n \
                    Lasers strike from the front of the enemy ship. They create two large holes in your port engines. \n \
                    {% addMessage(Fire weapons, G2_FIRE) %} \n \
                    {% endif %} \n \
                    {% ifGlobal(response, eq, 0) %} \n \
                    The gargling noise transmitted from the enemy ship gets much louder. \n \
                    Gargling voice: Do you surrender? \n \
                    {% addMessage(Yes, G2_SURRENDER) %} \n \
                    {% addMessage(No, G2_No_SURRENDER) %} \n \
                    {% endif %} \n');
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

