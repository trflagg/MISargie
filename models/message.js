module.exports = function(db, collectionName) {
    var util = require('util'),
        async = require('async'),
        codeHandler = require('./codeHandler'),
        Model = require('../argieDb/model')(db),
        Nodes = require('./Nodes'),
        collectionName = collectionName || 'messages';


    Message = function(doc) {
        Message.super_.call(this, doc);

        if (doc !== undefined) {

            if (doc === null) {
                throw 'Message load error. doc not found';
            }
            // load from doc
            this._name = doc.name;
            this._text = doc.text;
            this._compiled = doc.compiled;
            this._autoRemove = doc.autoRemove;
            this._messagesLoaded = doc.messagesLoaded;
            this._globalsRequested = doc.globalsRequested;
        }
        else {
            // make new Message
            this._name = null;
            this._text = null;
            this._compiled = {};
            this._autoRemove = true;
            this._messagesLoaded = [];
            this._globalsRequested = [];
        }
    }
    util.inherits(Message, Model);

    Message.prototype.onSave = function(message) {
        // validate name
        if (message._name === undefined) {
            throw 'Message save validation failed: name required.';
        }


        var doc = Message.super_.prototype.onSave(message);

        doc.name = message._name;
        doc.text = message._text;
        doc.compiled = message._compiled;
        doc.autoRemove = message.autoRemove();
        doc.messagesLoaded = message._messagesLoaded;
        doc.globalsRequested = message._globalsRequested;

        return doc;
    };

    Message.prototype.setAutoRemove = function(bool) {
        this._autoRemove = bool;
    }
    Message.prototype.autoRemove = function() {
        return this._autoRemove;
    }

    Message.prototype.setName = function(name) {
        this._name = name;
    }
    Message.prototype.getName = function() {
        return this._name;
    }

    Message.prototype.setText = function(text) {
        this._text = text;
    }
    Message.prototype.getText = function() {
        return this._text;
    }

    Message.prototype.messagesLoaded = function() {
        return this._messagesLoaded;
    }
    Message.prototype.globalsRequested = function() {
        return this._globalsRequested;
    }

    Message.prototype.getCompiled = function() {
        return this._compiled;
    }
    Message.prototype.compile = function() {
        if (this.text === null) {
            this._compiled = null;
            return null;
        }

        var firstNode = codeHandler.createNode(this._text.split('\n'), this);
        this._compiled = firstNode;
        return firstNode;
    }


    Message.prototype.run = function(avatar, callback) {
        if (this._compiled === null) {
            this.compile();
        }

            // console.log('Running: '+this.getName());
        // load any messages
        var messagesLoaded = this.messagesLoaded();
        if (messagesLoaded.length > 0) {
            // callback variable
            var originalMessage = this;

            db.loadMultiple('Message', {name: { $in: messagesLoaded}}, function(err, messages) {
                if (err) {
                    console.log(err);
                    return callback(err, '');
                }
                var msgObject = {};
                for(var i=0, ll=messages.length; i<ll; i++) {
                    msgObject[messages[i].getName()] = messages[i];
                }
                avatar.loadedMessages = msgObject;
                // kick it off
                codeHandler.runNode(originalMessage._compiled, '', avatar, callback);
            });
        }
        else {
            // kick it off
            codeHandler.runNode(this._compiled, '', avatar, callback);
        }
    };
    db.register('Message', Message);

    return Message;
};
