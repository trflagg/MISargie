module.exports = function() {

    var util = require('util'),
        Nodes = require('./Nodes');

    var CodeHandler = function() {
        this._functions = {};
    };

    CodeHandler.prototype.registerFunction = function(functionName, functionObject) {
        this._functions[functionName] = functionObject;
    };

    CodeHandler.prototype.createNode = function(lines, message) {
        var newNode = null;
        var currentLine = null;

        if (lines.length == 0) {
            // console.log('lines empty, bubbling up');
            return null;
        }

        currentLine = lines.shift().trim();

        if (currentLine.indexOf("{%") == 0) {
            newNode = this.createCodeNode(currentLine, lines, message);
        } else {
            newNode = this.createTextNode(currentLine);
        }

        newNode.nextSibling = this.createNode(lines, message);

        return newNode;
    }

    CodeHandler.prototype.createTextNode = function(currentLine) {
        newNode = new Nodes.TextNode();
        newNode.text = currentLine;

        return newNode;
    }

    CodeHandler.prototype.createCodeNode = function(currentLine, lines, message) {
        var func = this.parseFunction(currentLine);

        var newNode = null;

        if (this._functions.hasOwnProperty(func.functionName)) {
            newNode = this._functions[func.functionName].createCodeNode(func.params, message, lines);
        }
        else {
            console.log("can't compile unknown code node func: "+ func+"\nForgot a line return?");
            newNode = null;
        }

        return newNode;
    };

    CodeHandler.prototype.parseFunction = function(currentLine) {
        var removeBrackets = /{%(.*)%}/;  // everything between {% and %}
        var getFunctionAndParameters = /^(.+)\((.*)\)$/;  // funcName(params)
        var code = removeBrackets.exec(currentLine)[1].trim();
        var func = getFunctionAndParameters.exec(code)[1];
        var params = getFunctionAndParameters.exec(code)[2].split(",");
        return {
            functionName: func,
            params: params
        };
    }

    CodeHandler.prototype.runFunction = function(node, result, avatar, callback) {
        var functionName = node.func;

        if (this._functions.hasOwnProperty(functionName)) {
            this._functions[functionName].run(node, result, avatar, callback);
        }
        else {
            callback("Function "+ functionName + " not found.", result, avatar);
        }
    };
    var codeHandler = new CodeHandler();


    var FunctionObject = function() {
        this.name = 'functionObject';
        this.minParams = 0;
    };
    FunctionObject.prototype.createCodeNode = function(params, message, lines) {
        return new Nodes.CodeNode();
    };
    FunctionObject.prototype.run = function(node, result, avatar, callback) {
        callback(null, result, avatar);
    };
    FunctionObject.prototype.checkParams = function(params) {
        if (params.length < this.minParams) {
            throw "Not enough parameters for " + this.name +". params="+params;
        }
    }
    FunctionObject.prototype.copyParams = function(src, dest) {
        for (var i=0, ll=src.length; i<ll; i++) {
            dest[i] = src[i].trim();
        }
    }


    var GetGlobal = function() {
        GetGlobal.super_.call(this);
        this.name = 'getGlobal'
        this.minParams = 1;
    }
    util.inherits(GetGlobal, FunctionObject);

    GetGlobal.prototype.createCodeNode = function(params, message) {
        this.checkParams(params);

        newNode = GetGlobal.super_.prototype.createCodeNode.call(this, params, message);
        newNode.func = "setGlobal";
        this.copyParams(params, newNode.p);
        message.globalsRequested().push(params[0].trim());

        return newNode;
    }

    GetGlobal.prototype.run = function(node, result, avatar, callback) {
        if (avatar.getGlobal(node.p[0])) {
            result = result.concat(node.p[0]);
        }

        callback(null, result, avatar);
    };
    codeHandler.registerFunction('getGlobal', new GetGlobal());


    var SetGlobal = function() {
        SetGlobal.super_.call(this);
        this.name = 'setGlobal'
        this.minParams = 2;
    }
    util.inherits(SetGlobal, FunctionObject);

    SetGlobal.prototype.createCodeNode = function(params, message) {
        this.checkParams(params);

        newNode = SetGlobal.super_.prototype.createCodeNode.call(this, params, message);
        newNode.func = "setGlobal";
        this.copyParams(params, newNode.p);

        return newNode;
    }

    SetGlobal.prototype.run = function(node, result, avatar, callback) {
        avatar.setGlobal(node.p[0], node.p[1]);

        callback(null, result, avatar);
    };
    codeHandler.registerFunction('setGlobal', new SetGlobal());



    var AddMessage = function() {
        AddMessage.super_.call(this);
        this.name = 'addMessage'
        this.minParams = 2;
    }
    util.inherits(AddMessage, FunctionObject);

    AddMessage.prototype.createCodeNode = function(params, message) {
        this.checkParams(params);

        newNode = AddMessage.super_.prototype.createCodeNode.call(this, params, message);
        newNode.func = "addMessage";

        newNode.p[0] = params[0].trim();
        newNode.p[1] = params[1].trim();
        newNode.p[2] = null;
        if (params[2]) {
            newNode.p[2] = params[2];
        }

        return newNode;
    }

    AddMessage.prototype.run = function(node, result, avatar, callback) {
        avatar.addMessage(node.p[0], node.p[1], node.p[2]);

        callback(null, result, avatar);
    };
    codeHandler.registerFunction('addMessage', new AddMessage());



    var RemoveMessage = function() {
        RemoveMessage.super_.call(this);
        this.name = 'removeMessage'
        this.minParams = 1;
    }
    util.inherits(RemoveMessage, FunctionObject);

    RemoveMessage.prototype.createCodeNode = function(params, message) {
        this.checkParams(params);

        newNode = RemoveMessage.super_.prototype.createCodeNode.call(this, params, message);
        newNode.func = "removeMessage";
        this.copyParams(params, newNode.p);
        return newNode;
    }

    RemoveMessage.prototype.run = function(node, result, avatar, callback) {
        avatar.removeMessage(node.p[0]);

        callback(null, result, avatar);
    };
    codeHandler.registerFunction('removeMessage', new RemoveMessage());



    var LoadMessage = function() {
        LoadMessage.super_.call(this);
        this.name = 'loadMessage'
        this.minParams = 1;
    }
    util.inherits(LoadMessage, FunctionObject);

    LoadMessage.prototype.createCodeNode = function(params, message) {
        this.checkParams(params);

        newNode = LoadMessage.super_.prototype.createCodeNode.call(this, params, message);
        newNode.func = "loadMessage";
        // console.log(message);
        this.copyParams(params, newNode.p);
        message.messagesLoaded().push(params[0].trim());

        return newNode;
    }

    LoadMessage.prototype.run = function(node, result, avatar, callback) {
        avatar.loadedMessages[node.p[0]].run(avatar, function(err, loadResult) {
            if (err) {
                callback(err, result, avatar);
            }

            result = result.concat(loadResult);
            callback(null, result, avatar);
        });

    };
    codeHandler.registerFunction('loadMessage', new LoadMessage());



    var IfGlobal = function() {
        IfGlobal.super_.call(this);
        this.name = 'ifGlobal';
        this.minParams = 3;
    }
    util.inherits(IfGlobal, FunctionObject);

    IfGlobal.prototype.createCodeNode = function(params, message, lines) {
        this.checkParams(params);

        newNode = new Nodes.IfNode();
        newNode.func = 'ifGlobal';
        this.copyParams(params, newNode.p);
        message.globalsRequested().push(params[0].trim());

        // look for end of block
        var blockLines = [],
            currentLine = null,
            inElse = false;

        while(true) {
            if (lines.length == 0) {
                throw "Hit end of lines while looking for end of if block. {% endif %} or {% else %} not found."
            }

            currentLine = lines.shift().trim();
            if (currentLine.trim() == '{% endif %}') {
                // finish up
                var blockNode = this.createNode()
            }
        }

        return newNode;
    }

    IfGlobal.prototype.run = function(node, result, avatar, callback) {
        // ifGlobal(globalName, comparison, value)
        var global = avatar.getGlobal(node.p[0]);

    }
    codeHandler.registerFunction('ifGlobal', new IfGlobal());


    return codeHandler;
}()