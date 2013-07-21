module.exports = function(db, collectionName) {
    var util = require('util'),
        Model = require('./Model')(db),
        collectionName = collectionName || 'messages';

    Node = function() {
        this.type ='node';
        this,nextSibling = { };
    }

    var TextNode = function() {
        TextNode.super_.call(this);
        this.type = 'text';
        this.text = '';
    }
    util.inherits(TextNode, Node);

    var CodeNode = function() {
        CodeNode.super_.call(this);
        this.type = 'code';
        this.func = null;
        this.p = [];
    }
    util.inherits(CodeNode, Node);

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
        }
        else {
            // make new Message
            this._name = null;
            this._text = null;
            this._compiled = {};
            this._autoRemove = true;
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

    Message.prototype.getCompiled = function() {
        return this._compiled;
    }
    Message.prototype.compile = function() {
        if (this.text === null) {
            this._compiled = null;
            return null;
        }

        var firstNode = createNode(this._text.split('\n'));
        
        this._compiled = firstNode;
        return firstNode;
    }
    var createNode = function(lines) {
        var newNode = null;
        var currentLine = null;

        // console.log(lines)
        if (lines.length == 0) {
            // console.log('lines empty, bubbling up');
            return null;
        }

        currentLine = lines.shift().trim();

        if (currentLine.indexOf("{%") == 0) {
            newNode = createCodeNode(currentLine, lines)
        } else {
            newNode = new TextNode();
            newNode.text = currentLine;
            // console.log('text node created:'+newNode.text);
            newNode.nextSibling = createNode(lines);
        }

        return newNode;
    }
    var createCodeNode = function(currentLine, lines) {
        var newNode = null;
        var removeBrackets = /{%(.*)%}/;  // everything between {% and %}
        var getFunctionAndParameters = /^(.+)\((.*)\)$/;  // funcName(params)
        var code = removeBrackets.exec(currentLine)[1].trim();
        var func = getFunctionAndParameters.exec(code)[1];
        var params = getFunctionAndParameters.exec(code)[2].split(",");

        newNode = new CodeNode();

        switch(func) {

            // setGlobal(globalName, value)
            case 'setGlobal':
                newNode.func = "setGlobal";
                if (params.length < 2) {
                    console.log("error: setGlobal needs 2 params");
                    return null;
                }
                newNode.p = [];
                newNode.p[0] = params[0].trim();
                newNode.p[1] = params[1].trim();
                // console.log('setGlobal code node created.');
                newNode.nextSibling = createNode(lines);
                break;

            // getGlobal(globalName)
            case 'getGlobal':
                newNode.func = "getGlobal";
                if (params.length < 1) {
                    console.log("error: getGlobal needs 1 param.");
                    return null;
                }
                newNode.p = [];
                newNode.p[0] = params[0].trim();
                newNode.nextSibling = createNode(lines);
                break;

            // addMessage(messageText, messageName, [child])
            case 'addMessage':
                newNode.func = "addMessage";
                if (params.length < 2) {
                    console.log("error: addMessage needs at least 2 params.");
                    return null;
                }
                newNode.p = [];
                newNode.p[0] = params[0].trim();
                newNode.p[1] = params[1].trim();
                newNode.p[2] = null;
                if (params[2]) {
                    newNode.p[2] = params[2];
                }
                newNode.nextSibling = createNode(lines);
                break;

            // removeMessage(messageText)
            case 'removeMessage':
                newNode.func = "removeMessage";
                if (params.length < 1) {
                    console.log("error: removeMessage needs 1 param.");
                    return null;
                }
                newNode.p = [];
                newNode.p[0] = params[0].trim();
                newNode.nextSibling = createNode(lines);
                break;

            default:
                console.log("can't compile unknown code node func: "+ func+"\nForgot a line return?");

        }

        return newNode
    };


    Message.prototype.run = function(avatar) {
        if (this._compiled === null) {
            return null;
        }

        var message = ''
        return runNode(this._compiled, message, avatar);
    };
    var runNode = function(node, message, avatar) {
        if (node === null) {
            return message;
        }

        if (node.type == 'text') {
            message = message.concat(node.text, '\n');
            return runNode(node.nextSibling, message, avatar);
        }
        else if(node.type == 'code') {
            return runCodeNode(node, message, avatar)
        }

        console.log('unknown node type. node:');
        console.log(node);
        return message;
    }
    var runCodeNode = function(node, message, avatar) {
        if (node === null) {
            return message;
        }

        switch(node.func) {
            case 'setGlobal':
                avatar.setGlobal(node.p[0], node.p[1])
                return runNode(node.nextSibling, message, avatar);
                break;

            case 'getGlobal':
                if (avatar.getGlobal(node.p[0])) {
                    message = message.concat(node.p[0]);
                }
                return runNode(node.nextSibling, message, avatar);
                break;

            case 'addMessage':
                avatar.addMessage(node.p[0], node.p[1], node.p[2]);
                return runNode(node.nextSibling, message, avatar);
                break;

            case 'removeMessage':
                avatar.removeMessage(node.p[0]);
                return runNode(node.nextSibling, message, avatar);
                break;
        }

        console.log("can't run unknown code node func: "+ node.func);
        return message;

    }

    db.register('Message', Message);

    return Message;
};
