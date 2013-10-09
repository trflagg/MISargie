module.exports = function(db, collectionName) {
    var util = require('util'),
        Model = require('../argieDb/model')(db, collectionName);

    MessageHolder = function(doc) {
        MessageHolder.super_.call(this, doc);

        if (doc) {
            // load from doc
            this._messages = doc._messages;
            this._newMessageText = doc._newMessageText

            // make a new messageHolder object for every child in doc
            this._children = {};
            for (var child in doc._children) {
                if (doc._children.hasOwnProperty(child)) {
                    this._children[child] = new MessageHolder(doc._children[child]);
                }
            }
        }
        else {
            // create new
            this._messages = {};
            this._children = {};
            this._newMessageText = null;
        }
    }
    util.inherits(MessageHolder, Model);

    MessageHolder.prototype.onSave = function(messageHolder) {
        var doc = MessageHolder.super_.prototype.onSave(messageHolder);

        doc._messages = messageHolder._messages;
        doc._children = messageHolder._children;
        doc._newMessageText = messageHolder._newMessageText;

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

    MessageHolder.prototype.setNewMessageText = function(text) {
        this._newMessageText = text;
    }

    MessageHolder.prototype.addMessage = function(commandText, messageName, child) {
        if (child) {
            // childArray[1] = first item of dot-separated children
            // childArray[2] = rest of the string (minus the dot)
            var childArray = /(\w+)(?:\.([\w.]+))*/.exec(child);
            return this.child(childArray[1]).addMessage(commandText, messageName, childArray[2]);
        }
        else {
            this._messages[commandText] = messageName;   
            if (this._newMessageText) {
                return this._newMessageText.replace(/(%s)/,commandText);
            }
            return '';
        }

    };
    MessageHolder.prototype.removeMessage = function(commandText) {
        if (this._messages.hasOwnProperty(commandText)) {
            delete this._messages[commandText];
        }
        else {
            // message not here, look in children
            for (var childName in this._children) {
                if (this._children.hasOwnProperty(childName)) {
                    this._children[childName].removeMessage(commandText);
                }
            }
        }
    };
    MessageHolder.prototype.message = function(commandText, child) {
        if (child) {
            // childArray[1] = first item of dot-separated children
            // childArray[2] = rest of the string (minus the dot)
            var childArray = /(\w+)(?:\.([\w.]+))*/.exec(child);
            return this.child(childArray[1]).message(commandText, childArray[2]);
        }
        else {
            return this._messages[commandText];
        }
    }
    MessageHolder.prototype.childMessageCount = function() {
        var count = Object.keys(this._messages).length;
        if (this._children) {
            for (var childName in this._children) {
                if (this._children.hasOwnProperty(childName)) {
                    count = count + this._children[childName].childMessageCount();
                }
            }
        }

        return count;
    }
    MessageHolder.prototype.messageCount = function() {
        return Object.keys(this._messages).length;
    };
    MessageHolder.prototype.getCommandTextList = function() {
        var list = [];
        var keys = Object.keys(this._messages);
        for (var i =0, ll=keys.length; i<ll; i++) {
            var obj = {};
            obj.text = keys[i];
            list.push(obj);
        }
        var children = this._children;
        for (var childName in children) {
            if (children.hasOwnProperty(childName)) {
                var obj = {}
                obj.childMessageCount = this._children[childName].childMessageCount();
                obj.text = childName
                obj.children = this._children[childName].getCommandTextList();

                list.push(obj);
            }
        }
        return list;
    };

    MessageHolder.prototype.clear = function() {
        this._messages = {};
        for (var childName in this._children) {
            if (this._children.hasOwnProperty(childName)) {
                this._children[childName].clear();
            }
        }
    }

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