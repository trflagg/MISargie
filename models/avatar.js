module.exports = function(db, collectionName) {

    var util = require('util'),
        codeHandler = require('./codeHandler'),
        MessageHolder = require('./messageHolder')(db),
        returnObject = {},
        collectionName = collectionName || 'avatars';

    Avatar = function(doc) {
        Avatar.super_.call(this, doc);

        if (doc) {
            // load from doc
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
            this._yieldBlock = doc.yieldBlock;
        }
        else 
        {
            // new avatar
            this._location = null;
            this._globals = {};
            this._bNums = {};
            this._yieldTime = null;
            this._yieldBlock = null;
        }
    }
    util.inherits(Avatar, MessageHolder);

    Avatar.prototype.onSave = function(avatar) {
        var doc = Avatar.super_.prototype.onSave(avatar);

        doc.name = avatar._name;
        doc.location = avatar._location;
        doc.globals = avatar._globals;
        doc.bNums = {};
        for (key in avatar._bNums) {
            if (avatar._bNums.hasOwnProperty(key)) {
                var bNum = avatar._bNums[key];
                doc.bNums[key] = bNum.onSave(bNum);
            }
        }
        doc.yieldTime = avatar._yieldTime;
        doc.yieldBlock = avatar._yieldBlock;
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
    Avatar.prototype.setYieldBlock = function(block) {
        this._yieldBlock = block;
    }
    Avatar.prototype.getYieldBlock = function() {
        return this._yieldBlock;
    }
    Avatar.prototype.pollForYield = function(callback) {
        if (this.getGlobal('yield') == 1) {
            if (Date.now() >= this._yieldTime) {
                this.setGlobal('yield', 0);
                return codeHandler.runNode(this._yieldBlock, '', this, callback);
            }
        }
        callback(null, false, this);
    }

    Avatar.prototype.runMessage = function(commandText, child, callback) {
        // make child optional
        if (typeof child === 'function') {
            callback = child;
            child = '';
        }

        var messageName = this.message(commandText, child);
        //callback variable
        var avatar = this;
        db.load('Message', {name: messageName}, function(err, message) {
            if (err) {
                return callback(err, null);
            }
            if (message.autoRemove()) {
                avatar.removeMessage(commandText)
            }
            var result = message.run(avatar, callback);
        });

    };

    db.register('Avatar', Avatar);

    return Avatar;
        
};
