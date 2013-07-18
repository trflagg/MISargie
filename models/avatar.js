module.exports = function(db, collectionName) {

    var util = require('util'),
        ObjectID = require('mongodb').ObjectID,
        MessageHolder = require('./messageHolder')(db),
        returnObject = {},
        collectionName = collectionName || 'avatars'

    Avatar = function(condition) {
       Avatar.super_.call(this, condition);
    }
    util.inherits(Avatar, MessageHolder);

    Avatar.prototype.getCollectionName = function() {
        return "avatars";
    }

    Avatar = function(doc) {
       Avatar.super_.call(this, doc);
    }

    Avatar.prototype.loadFromDoc = function(doc) {
        Avatar.super_.prototype.loadFromDoc.call(this, doc);
        this._name = doc.name;
        this._globals = doc.globals;
    }
    Avatar.prototype.createNew = function() {
        Avatar.super_.prototype.createNew.call(this);
        this._globals = {};
    }

    Avatar.prototype.save = function(callback) {

        // validate name
        if (this._name === undefined) {
            if (callback) {
                return callback('Avatar save failed: name required.', null);
            }
            else {
                throw 'Avatar save failed: name required.';
            }
        }

        // save
        db.collection(collectionName).save({
            _id: this._id,
            name: this._name,
            globals: this._globals,
            messages: this._messages,
            children: this._children
        }, 
        {
            upsert: true
        }, 
        function(error) {
            callback(error);
        })
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

    returnObject.Avatar = Avatar;

    return returnObject;
        
};
