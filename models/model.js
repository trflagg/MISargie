module.exports = function(db) {

    var ObjectID = require('mongodb').ObjectID;

    Model = function(condition) {
        if (condition !== undefined) {
            return this.load(condition);
        }
        else {
            this._id = new ObjectID();
            return this.createNew();
        }
    }

    Model.prototype.getCollectionName = function() {
        return "models";
    }

    Model.prototype.loadFromDoc = function(doc) {

    }

    Model.prototype.createNew = function() {

    }

    Model.load = function(condition, callback) {
         // load from db
        db.collection(this.getCollectionName()).findOne(condition, function(error, result) {
            if (error) {
                return callback(error, null);
            }

            return callback(null, this.loadFromDoc(result));
        });
    }

    return Model;
}