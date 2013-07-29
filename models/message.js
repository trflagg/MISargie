module.exports = function(db, collectionName) {
    var util = require('util'),
        async = require('async'),
        codeHandler = require('./codeHandler'),
        Model = require('./Model')(db),
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

        var firstNode = createNode(this._text.split('\n'), this);
        this._compiled = firstNode;
        return firstNode;
    }
    var createNode = function(lines, message) {
        var newNode = null;
        var currentLine = null;

        if (lines.length == 0) {
            // console.log('lines empty, bubbling up');
            return null;
        }

        currentLine = lines.shift().trim();

        if (currentLine.indexOf("{%") == 0) {
            newNode = createCodeNode(currentLine, lines, message)
        } else {
            newNode = new Nodes.TextNode();
            newNode.text = currentLine;
            // console.log('text node created:'+newNode.text);
            newNode.nextSibling = createNode(lines, message);
        }

        return newNode;
    }
    var createCodeNode = function(currentLine, lines, message) {
        var newNode = null;
        var removeBrackets = /{%(.*)%}/;  // everything between {% and %}
        var getFunctionAndParameters = /^(.+)\((.*)\)$/;  // funcName(params)
        var code = removeBrackets.exec(currentLine)[1].trim();
        var func = getFunctionAndParameters.exec(code)[1];
        var params = getFunctionAndParameters.exec(code)[2].split(",");

        newNode = codeHandler.createCodeNode(func, params, message);

        if (newNode === null) {
            console.log("can't compile unknown code node func: "+ func+"\nForgot a line return?");
        }

        // recursively add sibling
        newNode.nextSibling = createNode(lines, message);
        return newNode
    };


    Message.prototype.run = function(avatar, callback) {
        if (this._compiled === null) {
            this.compile();
        }

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
                runNode(originalMessage._compiled, '', avatar, callback);
            });
        }
        else {
            // kick it off
            runNode(this._compiled, '', avatar, callback);
        }
    };
    var runNode = function(node, result, avatar, callback) {
        if (node === null) {
            return callback(null, result);
        }
        if (node.type == 'text') {
            result = result.concat(node.text, '\n');
            runNode(node.nextSibling, result, avatar, callback);
        }
        else if(node.type == 'code') {
            runCodeNode(node, result, avatar, callback);
        }

    }
    var runCodeNode = function(node, result, avatar, callback) {

        codeHandler.runFunction(node, result, avatar, function(err, result, avatar) {
            
            runNode(node.nextSibling, result, avatar, callback);

        })

    }

    db.register('Message', Message);

    return Message;
};
