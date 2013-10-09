module.exports = function(db, collectionName) {
    var util = require('util'),
        async = require('async'),
        Model = require('../argieDb/model')(db),
        collectionName = collectionName || 'quest';


    Quest = function(doc) {
        Quest.super_.call(this, doc);

        if (doc !== undefined) {

            // load from doc
            this._name = doc.name;
            this._description = doc.description;
            this._startMessage = doc.startMessage;
            this._completeMessage = doc.completeMessage;
        }
        else {
            // make new Quest
            this._name = null;
            this._description = null;
            this._startMessage = null;
            this._completeMessage = null;
        }
    }
    util.inherits(Quest, Model);

    Quest.prototype.onSave = function(quest) {
        if (quest._name === undefined) {
            throw 'Quest save validation failed: name required.';
        }

        var doc = Quest.super_.prototype.onSave(quest);

        doc.name = quest._name;
        doc.description = quest._description
        doc.startMessage = quest._startMessage;
        doc.completeMessage = quest._completeMessage;

        return doc;
    };

    Quest.prototype.setName = function(name) {
        this._name = name;
    }
    Quest.prototype.getName = function(name) {
        return this._name;
    }

    Quest.prototype.setDescription = function(description) {
        this._description = description;
    }
    Quest.prototype.getDescription = function() {
        return this._description;
    }

    Quest.prototype.setStartMessage = function(startMessage) {
        this._startMessage = startMessage;
    }
    Quest.prototype.getStartMessage = function() {
        return this._startMessage;
    }

    Quest.prototype.setCompleteMessage = function(completeMessage) {
        this._completeMessage = completeMessage;
    }
    Quest.prototype.getCompleteMessage = function() {
        return this._completeMessage;
    }

    db.register('Quest', Quest);

    return Quest;
};
