module.exports = function(db, collectionName) {
    var util = require('util'),
        Model = require('./model')(db, collectionName);

    MessageHolder = function(doc) {
        MessageHolder.super_.call(this, doc);

        if (doc) {
            // load from doc
            this._messages = doc.messages;
            this._children = doc.children;
        }
        else {
            // create new
            this._messages = {};
            this._children = {};
        }
    }
    util.inherits(MessageHolder, Model);

    MessageHolder.prototype.onSave = function(messageHolder) {
        var doc = MessageHolder.super_.prototype.onSave(messageHolder);

        doc.messages = messageHolder._messages;
        doc.children = messageHolder._children;

        return doc;
    }

    MessageHolder.prototype.addChild = function(name, child) {
        this._children[name] = child;
    };
    MessageHolder.prototype.removeChild = function(name) {
        delete this._children[name];
    }
    MessageHolder.prototype.child = function(name) {
        return this._children[name];
    }

    MessageHolder.prototype.addMessage = function(commandText, messageName) {
        this._messages[commandText] = messageName;
    };
    MessageHolder.prototype.removeMessage = function(commandText) {
        delete this._messages[commandText];
    };
    MessageHolder.prototype.message = function(commandText) {
        return this._messages[commandText];
    }
    MessageHolder.prototype.messageCount = function() {
        return Object.keys(this._messages).length;
    };
    MessageHolder.prototype.getCommandTextList = function() {
        return Object.keys(this._messages);
    };

    MessageHolder.prototype.runMessage = function(commandText, avatar, callback) {
        var messageName = this._messages[commandText];
        if (!messageName) {
            return callback("Message with commandText "+commandText+ " not found.");
        }
        return callback(null);
    };

    MessageHolder.prototype.toObject = function() {
        var messages = this._messages,
            childrenArray = this._children;
        for (var childName in childrenArray) {
            if (childrenArray.hasOwnProperty(childName)) {
                messages[childName] = childrenArray[childName].toObject();
            }
        }

        return messages;
    }

    return MessageHolder;
}