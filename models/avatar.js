module.exports = function(db, collectionName) {

    var util = require('util'),
        sugar = require('sugar'),
        async = require('async'),
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

        if(doc.location) this._location = doc.location;
        if(doc.globals) this._globals = doc.globals;
        if(doc.bNums) {
            this._bNums = {};
            for (key in doc.bNums) {
                if (doc.bNums.hasOwnProperty(key)) {
                    var constructor = db.getConstructor('bNum');
                    var bNum = new constructor(doc.bNums[key]);
                    this.setBNum(key, bNum);
                }
            }
        }
        if(doc.yieldTime) this._yieldTime = doc.yieldTimer;
        if(doc.yieldMessage) this._yieldMessage = doc.yieldMessage;
        if(doc.triggers) this._triggers = doc.triggers;
    };

    Avatar.prototype.saveToDoc = function(doc) {
        Avatar.super_.prototype.saveToDoc.call(this, doc);

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

    Avatar.prototype.runMessage = function*(commandText, child) {

        child = child ? child : '';

        // triggers
        var messageList = this._triggers.clone();

        // message being run
        var messageName = this.message(commandText, child);
        messageList.push(messageName);

        // load & run
        var messages = yield db.loadMultiple('Message', {name: { $in: messageList}});
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
            throw new Error('Message ' + messageName + ' NOT FOUND.', null);
        }

        if (message.autoRemove()) {
            this.removeMessage(commandText)
        }

        var result = yield message.run(this);

        result = yield this._runTriggerList(triggers, result);

        return result;
    };

    Avatar.prototype._runTriggerList = function*(triggers, result) {
        for(var i=0, ll=triggers.length; i<ll; i++) {
            var trigger_result = yield triggers[i].run(this);
            result = result + trigger_result;
        }

        return result;
    };

    Avatar.prototype.reset = function*(messageName) {
        this.clear();
        if(messageName) {
            var message = yield db.load('Message', {name: messageName});
            return yield message.run(this);
        }
        return null;
    };
    db.register('Avatar', Avatar);

    return Avatar;

};
