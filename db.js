var mongo = require('mongoskin');

module.exports.init = function(env) {
    _environment = env;
    _db = mongo.db(env.db.URL, {safe: true});
    return _db;
};

module.exports.db = function() {
    return _db;
}

module.export = function(environment) {

    Db = function(environment) {
        this._environment = env;
        this._db = mongo.db(env.db.URL, {safe: true});
        this._models = {};
        this._events = {};
    }
    
    Db.prototype.register = function(modelName, constructor) {
        this._models[modelName] = constructor;
        this._events[modelName] = {};
    }

    Db.prototype.create = function(modelName, args) {
        return new this._models[modelName](agrs);
    }

    Db.prototype.save = function(modelName, model, callback) {
        this._db.collection(this.getCollectionName(modelName)).save({
    }

    Db.prototype.getCollectionName(modelName) {
        return modelName.toLowerCase();
    }
}