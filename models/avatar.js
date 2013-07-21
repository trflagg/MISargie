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
            this._globals = doc.globals;
        }
        else 
        {
            // new avatar
            this._globals = {};
        }
    }
    util.inherits(Avatar, MessageHolder);

    Avatar.prototype.onSave = function(avatar) {
        var doc = Avatar.super_.prototype.onSave(avatar);

        doc.name = avatar._name;
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

    Avatar.prototype.runMessage = function(commandText, callback) {
        var messageName = this.message(commandText);

        //callback variable
        var avatar = this;

        db.load('Message', {name: messageName}, function(err, message) {
            if (message.autoRemove()) {
                avatar.removeMessage(commandText)
            }
            var result = message.run(avatar);
            callback(null, result);
        });

    };

    db.register('Avatar', Avatar);

    return Avatar;
        
};
