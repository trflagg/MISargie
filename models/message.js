module.exports = function(db, collectionName) {
    var util = require('util'),
        returnObject = {},
        collectionName = collectionName || 'messages';

    Node = function() {

    }
    Node.prototype = {
        type: 'node',
        nextSibling: { },
    }

    var TextNode = function() {
    }
    util.inherits(TextNode, Node);
    TextNode.prototype.type = 'text';
    TextNode.prototype.text = '';

    var CodeNode = function() {
    }
    util.inherits(CodeNode, Node);
    CodeNode.prototype.type = 'code';
    CodeNode.prototype.func = null;
    CodeNode.prototype.p = [];

    returnObject.load = function(name, callback) {
        if (name === undefined) {
            return callback('Message lookup failed: name required.', null);
        }

        // load from db
        db.collection(collectionName).findOne({name: name}, function(error, result) {
            if (error) {
                return callback(error, null);
            }   
            var newMessage = new returnObject.Message(result);
            return callback(null, newMessage);
        });
    }

    returnObject.Message = function(doc) {
        if (doc !== undefined) {
            // load from doc
            this._name = doc.name;
            this._text = doc.text;
            this._compiled = doc.compiled;
        }
        else {
            // make new Message
            this._name = null;
            this._text = null;
            this._compiled = {};
        }
    }

    returnObject.Message.prototype.save = function(callback) {
        // validate name
        if (this._name === undefined) {
            if (callback) {
                return callback('Message save failed: name required.', null);
            }
            else {
                throw 'Message save failed: name required.';
            }
        }

        // save
        db.collection(collectionName).save({
            name: this._name,
            text: this._text,
            compiled: this._compiled
        }, 
        {
            upsert: true
        }, 
        function(error, result) {
            callback(error, result);
        })
    };


    returnObject.Message.prototype.setName = function(name) {
        this._name = name;
    }
    returnObject.Message.prototype.getName = function() {
        return this._name;
    }

    returnObject.Message.prototype.setText = function(text) {
        this._text = text;
    }
    returnObject.Message.prototype.getText = function() {
        return this._text;
    }

    returnObject.Message.prototype.getCompiled = function() {
        return this._compiled;
    }
    returnObject.Message.prototype.compile = function() {
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
                newNode.func = "setGlobal"
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
        }

        return newNode
    };


    returnObject.Message.prototype.run = function(avatar) {
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

        console.log('unknown node type')
        return message;
    }

    var runCodeNode = function(node, message, avatar) {
        if (node === null) {
            return message;
        }

        switch(node.func) {
            case 'setGlobal':
                if (node.p.length < 2) {
                    console.log("error: setGlobal needs 2 params");
                    return message;
                }
                avatar.setGlobal(node.p[0], node.p[1])
                return runNode(node.nextSibling, message, avatar);
                break;
        }

        console.log("unknown code node func");
        return message;

    }

    return returnObject;
};
