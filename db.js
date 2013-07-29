var mongo = require('mongoskin'),
    ObjectID = require('mongodb').ObjectID;


module.exports = function() {

    Db = function(environment) {
        this._environment = environment;
        this._db = mongo.db(environment.db.URL, {safe: true});
        this._models = {};
    };

    Db.prototype.close = function() {
        this._db.close();
    }
    
    Db.prototype.register = function(modelName, constructor) {
        this._models[modelName] = constructor;
    };

    Db.prototype.create = function(modelName) {
        var newModel = new this._models[modelName]();
        return newModel;
    };

    Db.prototype.save = function(modelName, model, callback) {
        if (this._models[modelName].prototype.onSave) {
            try {
                model = this._models[modelName].prototype.onSave(model);
            } catch(e) {
                if (callback) {
                    return callback(e.toString(), null);
                }
                else {
                    throw e;
                }
            }
        }

        if (callback) {
            // save to db
            this._db.collection(this.getCollectionName(modelName)).save(
                model,
                {upsert: true},
                callback
            );
        }
        else {
            // save to db
            this._db.collection(this.getCollectionName(modelName)).save(
                model,
                {upsert: true, w:0}
            );
        }
    };

    Db.prototype.load = function(modelName, condition, callback) {
        // callback variable
        var db = this;

        // load from db
        this._db.collection(this.getCollectionName(modelName)).findOne(condition, function(error, result) {
            if (error) {
                return callback(error, null);
            }
            try {
                var model = new db._models[modelName](result);
            } catch(e) {
                return callback(e.toString(), null);
            }
            return callback(null, model);
        });
    };

    Db.prototype.loadMultiple = function(modelName, condition, callback) {
        // callback variable
        var db = this;

        // load from db
        
        this._db.collection(this.getCollectionName(modelName)).find(condition).toArray(function(err, results) {
            if (err) {
                return callback(err, null);
            }
            var objects = [];

            try {
                for (var i=0, ll=results.length; i<ll; i++) {
                    objects.push(new db._models[modelName](results[i]));
                }
            } catch(e) {
                return callback(e.toString(), null);
            }

            return callback(null, objects);
        });
    };

    Db.prototype.getCollectionName = function(modelName) {
        return modelName.toLowerCase();
    };

    Db.prototype.deleteAll = function(modelName) {
        this._db.collection(this.getCollectionName(modelName)).drop();
    }

    return Db;
}()