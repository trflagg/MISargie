module.exports = function(db, collectionName) {
    var util = require('util'),
        async = require('async'),
        Model = require('../argieDb/model')(db),
        collectionName = collectionName || 'location';


    Location = function(doc) {
        Location.super_.call(this, doc);

        if (doc !== undefined) {

            // load from doc
            this._name = doc.name;
            this._description = doc.description;
            this._message = doc.message;
        }
        else {
            // make new Location
            this._name = null;
            this._description = null;
            this._message = null;
        }
    }
    util.inherits(Location, Model);

    Location.prototype.onSave = function(location) {
        if (location._name === undefined) {
            throw 'Location save validation failed: name required.';
        }
        if (location._message === undefined) {
            throw 'Location save validation failed: message required.';
        }


        var doc = Location.super_.prototype.onSave(location);

        doc.name = location._name;
        doc.description = location._description
        doc.message = location._message;

        return doc;
    };

    Location.prototype.setName = function(name) {
        this._name = name;
    }
    Location.prototype.getName = function(name) {
        return this._name;
    }

    Location.prototype.setDescription = function(description) {
        this._description = description;
    }
    Location.prototype.getDescription = function() {
        return this._description;
    }

    Location.prototype.setMessage = function(message) {
        this._message = message;
    }
    Location.prototype.getMessage = function() {
        return this._message;
    }

    db.register('Location', Location);

    return Location;
};
