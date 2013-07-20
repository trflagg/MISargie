module.exports = function(db) {
    var ObjectID = require('mongodb').ObjectID;

    // not sure what to do with this yet.
    Model = function(doc) {
        if (doc) {
            this._id = doc._id;
        }
        else {
            this._id = new ObjectID();
        }
    }

    Model.prototype.onSave = function(model) {
        var doc = {};

        doc._id = model._id;

        return doc;
    }

    return Model;
}