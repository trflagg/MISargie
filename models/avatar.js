module.exports = function(db, collectionName) {

    var util = require('util'),
        sugar = require('sugar'),
        async = require('async'),
        codeHandler = require('./codeHandler'),
        MessageHolder = require('./messageHolder')(db),
        BNum = require('./bNum')(db),
        returnObject = {},
        collectionName = collectionName || 'avatars';

    Avatar = function(doc) {
        Avatar.super_.call(this, doc);
    }
    util.inherits(Avatar, MessageHolder);

    Avatar.prototype.initialize = function() {
        Avatar.super_.prototype.initialize.call(this);

        this._location = null;
        this._globals = {};
        this._bNums = {};
        this._yieldTime = null;
        this._yieldMessage = null;
        this._triggers = [];
    };

    Avatar.prototype.loadFromDoc = function(doc) {
        Avatar.super_.prototype.loadFromDoc.call(this, doc);

        this._name = doc.name;
        this._location = doc.location;
        this._globals = doc.globals;
        this._bNums = {};
        for (key in doc.bNums) {
            if (doc.bNums.hasOwnProperty(key)) {
                var constructor = db.getConstructor('bNum');
                var bNum = new constructor(doc.bNums[key]);
                this.setBNum(key, bNum);
            }
        }
        this._yieldTime = doc.yieldTimer;
        this._yieldMessage = doc.yieldMessage;
        this._triggers = doc.triggers;
    };

    Avatar.prototype.saveToDoc = function(doc) {
        Avatar.super_.prototype.saveToDoc.call(this, doc);

        doc.name = this._name;
        doc.location = this._location;
        doc.globals = this._globals;
        doc.bNums = {};
        for (key in this._bNums) {
            if (this._bNums.hasOwnProperty(key)) {
                var bNum = this._bNums[key];
                doc.bNums[key] = bNum.onSave(bNum);
            }
        }
        doc.yieldTime = this._yieldTime;
        doc.yieldMessage = this._yieldMessage;
        doc.triggers = this._triggers;

        return doc;
    };

    Avatar.prototype.setName = function(name) {
        this._name = name;
    }
    Avatar.prototype.getName = function() {
        return this._name;
    }

    Avatar.prototype.setGlobal = function(key, value, callback) {
        this._globals[key] = value;

        if (typeof callback === 'function') {
            return this.save(callback);
        }

        return this;
    };
    Avatar.prototype.getGlobal = function(key) {
        if (!this._globals || !this._globals.hasOwnProperty(key)) {
            return null;
        }

        return this._globals[key];
    };

    Avatar.prototype.setBNum = function(key, value, callback) {
        if (!isNaN(value)) {
            value = db.create('bNum').setValue(value);
        }

        this._bNums[key] = value;

        if (typeof callback === 'function') {
            return this.save(callback);
        }

        return this;
    };
    Avatar.prototype.getBNum = function(key) {
        if (!this._bNums || !this._bNums.hasOwnProperty(key)) {
            return null;
        }

        return this._bNums[key];
    };
    Avatar.prototype.addBNum = function(key, amount, callback) {
        if (!this._bNums || !this._bNums.hasOwnProperty(key)) {
            return null;
        }

        return this._bNums[key].addBNum(amount);


    }

    Avatar.prototype.setLocation = function(location) {
        this._location = location;
    };
    Avatar.prototype.getLocation = function() {
        return this._location;
    };
    Avatar.prototype.changeLocation = function(locationName, callback) {
        // look up location
        // callback variable
        var avatar = this;
        db.load('Location', {name: locationName}, function(err, location) {
            if (err) {
                return callback(err, null);
            }
            avatar.setLocation(location);
            // run message
            db.load('Message', {name: location.getMessage()}, function(err, message) {
                if (err) {
                    return callback(err, null);
                }
                var result = message.run(avatar, callback);
            });

        })
    };

    Avatar.prototype.setYieldTime = function(timeInSeconds) {
        var currentTime = Date.now();
        var futureTime = currentTime + (parseInt(timeInSeconds, 10) * 1000);
        this._yieldTime = new Date(futureTime);
    }
    Avatar.prototype.getYieldTime = function() {
        return this._yieldTime;
    }
    Avatar.prototype.setYieldMessage = function(messageName) {
        this._yieldMessage = messageName;
    }
    Avatar.prototype.getYieldMessage = function() {
        return this._yieldMessage;
    }
    Avatar.prototype.pollForYield = function(callback) {
        if (this.getGlobal('yield') == 1) {
            if (Date.now() >= this._yieldTime) {
                this.setGlobal('yield', 0);
                db.load('Message', {name: this._yieldMessage}, function(err, message) {
                    if (err) {
                        return callback(err, null);
                    }
                    return message.run(this, callback);
                });
                return;
            }
        }

        callback(null, false);
    }

    Avatar.prototype.addTrigger = function(messageName) {
        this._triggers.push(messageName);
    };
    Avatar.prototype.removeTrigger = function(messageName) {
        this._triggers.remove(messageName);
    };

    Avatar.prototype.runMessage = function(commandText, child, callback) {
        // make child optional
        if (typeof child === 'function') {
            callback = child;
            child = '';
        }

        // triggers
        var messageList = this._triggers.clone();

        // message being run
        var messageName = this.message(commandText, child);
        messageList.push(messageName);

        //callback variable
        var avatar = this;

        // load & run
        db.loadMultiple('Message', {name: { $in: messageList}}, function(err, messages) {
            if (err) {
                return callback(err, null);
            }
            var triggers = [];
            var message = {};
            var foundMessage = false;
            for (var i=0,ll=messages.length; i<ll; i++) {
                if (messages[i].getName() == messageName) {
                    message = messages[i];
                    foundMessage = true;
                }
                else {
                    triggers.push(messages[i]);
                }
            }

            if (!foundMessage) {
                return callback('Message ' + messageName + ' NOT FOUND.', null);
            }

            if (message.autoRemove()) {
                avatar.removeMessage(commandText)
            }

            message.run(avatar, function(err, result) {
                if (err) {
                    return callback(err, null);
                }

                avatar._runTriggerList(triggers, result, callback);
            });
        });

    };

    Avatar.prototype._runTriggerList = function(triggers, result, callback) {

        // closure variable
        var avatar = this;

        // run each trigger
        async.concatSeries(triggers, function(triggerMessage, callback) {
            triggerMessage.run(avatar, function(err, trigger_result) {
                callback(err, trigger_result);
            });
        },
        // end function
        function(err, results) {
            result = result + results.join('');
            callback(null, result);
        });

    };

    db.register('Avatar', Avatar);

    return Avatar;

};
