var mongo = require('mongoskin'),
    ObjectID = require('mongodb').ObjectID;


module.exports = function(environment) {

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
                return callback(e.toString(), null);
            }
        }
        // save to db
        this._db.collection(this.getCollectionName(modelName)).save(
            model,
            {upsert: true},
            callback
        );
    };

    Db.prototype.load = function(modelName, condition, callback) {
        // callback variable
        var db = this;

        // load from db
        this._db.collection(this.getCollectionName(modelName)).findOne(condition, function(error, result) {
            if (error) {
                return callback(error, null);
            }

            return callback(null, new db._models[modelName](result));
        });
    };

    Db.prototype.getCollectionName = function(modelName) {
        return modelName.toLowerCase();
    };

    return Db;
}