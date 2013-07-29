module.exports = function() {

    var util = require('util'),
        Nodes = require('./Nodes');

    var CodeHandler = function() {
        this._functions = {};
    };

    CodeHandler.prototype.registerFunction = function(functionName, functionObject) {
        this._functions[functionName] = functionObject;
    };
    CodeHandler.prototype.runFunction = function(node, result, avatar, callback) {
        var functionName = node.func;

        if (this._functions.hasOwnProperty(functionName)) {
            this._functions[functionName].run(node, result, avatar, callback);
        }
        else {
            callback("Function "+ functionName + " not found.", result, avatar);
        }
    };
    CodeHandler.prototype.createCodeNode = function(functionName, params, message) {
        if (this._functions.hasOwnProperty(functionName)) {
            return this._functions[functionName].createCodeNode(params, message);
        }
        else {
            return null;
        }

    };
    var codeHandler = new CodeHandler();


    var FunctionObject = function() {
        this.name = 'functionObject';
        this.minParams = 0;
    };
    FunctionObject.prototype.createCodeNode = function(params, message) {
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

    return codeHandler; 
}()