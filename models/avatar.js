module.exports = function(db, collectionName) {

    var util = require('util'),
        MessageHolder = require('./messageHolder')(db),
        returnObject = {},
        collectionName = collectionName || 'avatars'

    returnObject.load = function(name, callback) {
        if (name === undefined) {
            return callback('Avatar lookup failed: name required.', null);
        }

        // load from db
        db.collection(collectionName).findOne({name: name}, function(error, result) {
            if (error) {
                return callback(error, null);
            }   
            var newAvatar = new returnObject.Avatar(result);
            return callback(null, newAvatar);
        });
    }


    Avatar = function(doc) {
        if (doc !== undefined) {
            // load from doc
            this._name = doc.name;
            this._globals = doc.globals;
            this._messages = doc.messages || {};
            this._children = doc.children || {};
        }
        else {
            MessageHolder.call(this);
            // make new Avatar
            this._globals = {};
        }
    }
    util.inherits(Avatar, MessageHolder);

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
        console.log(this);
        db.collection(collectionName).save({
            name: this._name,
            globals: this._globals,
            messages: this._messages,
            children: this._children
        }, 
        {
            upsert: true
        }, 
        function(error, result) {
            callback(error, result);
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
