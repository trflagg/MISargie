module.exports = function(db, collectionName) {

    var returnObject = {};
    var collectionName = collectionName || 'avatars';

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


    returnObject.Avatar = function(doc) {
        if (doc !== undefined) {
            // load from doc
            this._name = doc.name;
            this._globals = doc.globals;
        }
        else {
            // make new Avatar
            this._globals = {};
        }
    }

    returnObject.Avatar.prototype.save = function(callback) {

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
            name: this._name,
            globals: this._globals
        }, 
        {
            upsert: true
        }, 
        function(error, result) {
            callback(error, result);
        })
    };

    returnObject.Avatar.prototype.setName = function(name) {
        this._name = name;
    }
    returnObject.Avatar.prototype.getName = function() {
        return this._name;
    }

    returnObject.Avatar.prototype.setGlobal = function(key, value, callback) {
        this._globals[key] = value;

        if (typeof callback === 'function') {
            return this.save(callback);
        }

        return this;
    };
    returnObject.Avatar.prototype.getGlobal = function(key) {
        if (!this._globals || !this._globals[key]) {
            return null;
        }

        return this._globals[key];
    };

    return returnObject;
        
};
