module.exports = function(db, collectionName) {

    var util = require('util'),
        MessageHolder = require('./messageHolder')(db),
        returnObject = {},
        collectionName = collectionName || 'avatars'

    Avatar = function(doc) {
        Avatar.super_.call(this, doc);

        if (doc) {
            // load from doc
            this._name = doc.name;
            this._location = doc.location;
            this._globals = doc.globals;
        }
        else 
        {
            // new avatar
            this._location = null;
            this._globals = {};
        }
    }
    util.inherits(Avatar, MessageHolder);

    Avatar.prototype.onSave = function(avatar) {
        var doc = Avatar.super_.prototype.onSave(avatar);

        doc.name = avatar._name;
        doc.location = avatar._location;
        doc.globals = avatar._globals;
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
        if (!this._globals || !this._globals[key]) {
            return null;
        }

        return this._globals[key];
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
