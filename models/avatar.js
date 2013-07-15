module.exports = function(db) {
    var Model = require('./Model');

    var Avatar = function(db) {
        Model.call(this);
        
        this._globals = {};

    }
    Avatar.prototype = new Model();
    Avatar.prototype.constructor = Avatar();

    Avatar.prototype.save = function(callback) {

        // validate name
        if (this._name === undefined) {
            if (callback) {
                return callback('Avatar save failed: name required.');
            }
            else {
                throw 'Avatar save failed: name required.';
            }
        }

        // save
        db.collection('avatars').save({
            name: this._name,
            globals: this._globals
        }, 
        {
            upsert: true
        }, 
        function() {
            callback();
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
    };

    return Avatar;
        
};
