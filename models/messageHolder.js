module.exports = function(db, collectionName) {
  var util = require('util'),
    Model = require('argieDB/model')(db, collectionName);

  MessageHolder = function(doc) {
    MessageHolder.super_.call(this, doc);
  }
  util.inherits(MessageHolder, Model);

  MessageHolder.prototype.initialize = function() {
    MessageHolder.super_.prototype.initialize.call(this);

    this._messages = {};
    this._messageStack = [];
    this._children = {};
    this._recordUnread = false;
    this._newMessageText = null;
    this._visible = true;

    this._supportsLevels = false;
    this._level = 1;
  }

  MessageHolder.prototype.loadFromDoc = function(doc) {
    MessageHolder.super_.prototype.loadFromDoc.call(this, doc);

    if(doc._name) this._name = doc._name;
    if(doc._messages) this._messages = doc._messages;
    if(doc._messageStack) this._messageStack = doc._messageStack;
    if(doc._recordUnread) this._recordUnread = doc._recordUnread;
    if(doc._newMessageText) this._newMessageText = doc._newMessageText;
    if(doc._visible) this._visible = doc._visible;
    if(doc._level) this._level = doc._level;
    if(doc._supportsLevels) this._supportsLevels = doc._supportsLevels;

    // make a new messageHolder object for every child in doc
    if (doc._children) {
      this._children = {};
      for (var child in doc._children) {
        if (doc._children.hasOwnProperty(child)) {
          this._children[child] = new MessageHolder(doc._children[child]);
        }
      }
    }
  };

  MessageHolder.prototype.saveToDoc = function(doc) {
    MessageHolder.super_.prototype.saveToDoc.call(this, doc);

    doc._name = this._name;
    doc._messages = this._messages;
    doc._messageStack = this._messageStack;
    doc._children = this._children;
    doc._recordUnread = this._recordUnread;
    doc._newMessageText = this._newMessageText;
    doc._visible = this._visible;
    doc._level = this._level;
    doc._supportsLevels = this._supportsLevels;

    return doc;
  }

  MessageHolder.prototype.setName = function(name) {
    this._name = name;
  }

  MessageHolder.prototype.getName = function() {
    return this._name;
  }

  MessageHolder.prototype.pushMessages = function() {
    this._messageStack.push(this._messages);
    this._messages = {};
    for (var childName in this._children) {
      if (this._children.hasOwnProperty(childName)) {
        this._children[childName].hide();
      }
    }

  }

  MessageHolder.prototype.popMessages = function() {
    this._messages = this._messageStack.pop();
    for (var childName in this._children) {
      if (this._children.hasOwnProperty(childName)) {
        this._children[childName].show();
      }
    }
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

  MessageHolder.prototype.hideChild = function(child) {
    if (child) {
      // childArray[1] = first item of dot-separated children
      // childArray[2] = rest of the string (minus the dot)
      var childArray = childArrayFromString(child);
      return this.child(childArray[1]).hideChild(childArray[2]);
    }
    else {
      this.hide();
    }
  }

  MessageHolder.prototype.showChild = function(child) {
    if (child) {
      // childArray[1] = first item of dot-separated children
      // childArray[2] = rest of the string (minus the dot)
      var childArray = childArrayFromString(child);
      return this.child(childArray[1]).showChild(childArray[2]);
    }
    else {
      this.show()
    }
  }

  MessageHolder.prototype.setNewMessageText = function(text) {
    this._newMessageText = text;
  }

  MessageHolder.prototype.addMessage = function(commandText, messageName, child, level, underLeveledMessage) {
    // child is optional, so we might get level instead of child
    if(typeof child == "number") {
      underLeveledMessage = level;
      level = child;
      child = '';
    }

    //default value is 1
    level = level ? level : 1;

    if (child) {
      // childArray[1] = first item of dot-separated children
      // childArray[2] = rest of the string (minus the dot)
      var childArray = childArrayFromString(child);
      return this.child(childArray[1]).addMessage(commandText, messageName, childArray[2], level, underLeveledMessage);
    }
    else {
      commandText = commandTextRemovePeriods(commandText);
      this._messages[commandText] = {
        message: messageName
        , level: level
        , underLeveledMessage: underLeveledMessage
        , unread: true
      }

      if (this._newMessageText) {
        return this._newMessageText.replace(/(%s)/,commandText);
      }
      return '';
    }

  };

  MessageHolder.prototype.removeMessage = function(commandText) {
    var found = false;
    var replacedCommandText = commandText;
    if(commandText.hasOwnProperty('replace')) {
      replacedCommandText = commandTextRemovePeriods(commandText);
    }

    if (this._messages && this._messages.hasOwnProperty(replacedCommandText)) {
      delete this._messages[replacedCommandText];
    } else {
      // try by name
      // regex?
      if (commandText instanceof RegExp) {
        for (messageText in this._messages) {
          if (commandText.test(this._messages[messageText].message)) {
            delete this._messages[messageText];
          }
        }
      } else {
        // string equality
        for (messageText in this._messages) {
          if (this._messages[messageText].message === commandText) {
            delete this._messages[messageText];
            found = true;
          }
        }
      }

      // message not here, look in children
      if (!found) {
        for (var childName in this._children) {
          if (this._children.hasOwnProperty(childName)) {
            this._children[childName].removeMessage(commandText);
          }
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
      commandText = commandTextRemovePeriods(commandText);
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
      obj.text = commandTextAddPeriods(keys[i]);
      if (this._supportsLevels) {
        obj.level = this._messages[keys[i]]['level'];
      }
      obj.unread = this._messages[keys[i]]['unread'];
      list.push(obj);
    }
    var children = this._children;
    for (var childName in children) {
      if (children.hasOwnProperty(childName)) {
        var obj = {}
        var child = this._children[childName];
        obj.visible = child._visible;
        obj.childMessageCount = child.childMessageCount();
        obj.text = childName
        if (child._supportsLevels) {
          obj.level = child.getLevel();
        }
        obj.children = child.getCommandTextList();
        if (obj.children) {
          list.push(obj);
        }
      }
    }
    return list;
  };

  MessageHolder.prototype.clear = function() {
    this._messages = {};
    this._messageStack = [];
    this.show();
    for (var childName in this._children) {
      if (this._children.hasOwnProperty(childName)) {
        this._children[childName].clear();
      }
    }
  }

  MessageHolder.prototype.hide = function() {
    this._visible = false;
  };

  MessageHolder.prototype.show = function() {
    this._visible = true;
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

  MessageHolder.prototype.supportLevels = function() {
    this._supportsLevels = true;
  }

  MessageHolder.prototype.increaseLevel = function(child) {
    if (child) {
      // childArray[1] = first item of dot-separated children
      // childArray[2] = rest of the string (minus the dot)
      var childArray = childArrayFromString(child);
      return this.child(childArray[1]).increaseLevel(childArray[2]);
    }

    return this._level++;
  }

  MessageHolder.prototype.getLevel = function(child) {
    if (child) {
      // childArray[1] = first item of dot-separated children
      // childArray[2] = rest of the string (minus the dot)
      var childArray = childArrayFromString(child);
      return this.child(childArray[1]).getLevel(childArray[2]);
    }

    return this._level;
  }

  MessageHolder.prototype.setRecordUnread = function(recordUnread) {
    this._recordUnread = recordUnread
  }

  MessageHolder.prototype.recordsUnread = function(child) {
    if (child) {
      // childArray[1] = first item of dot-separated children
      // childArray[2] = rest of the string (minus the dot)
      var childArray = childArrayFromString(child);
      return this.child(childArray[1]).recordsUnread(childArray[2]);
    }

    return this._recordUnread;
  }

  MessageHolder.prototype.read = function(commandText, child) {
    if (child) {
      // childArray[1] = first item of dot-separated children
      // childArray[2] = rest of the string (minus the dot)
      var childArray = childArrayFromString(child);
      return this.child(childArray[1]).read(commandText, childArray[2]);
    }

    return this._messages[commandText]['unread'] = false;
  }

  // mongodb doesn't allow periods in keys
  // replace periods with [dot]
  function commandTextRemovePeriods(commandText) {
    return commandText.replace(/(\.)/g, '[dot]');
  }

  function commandTextAddPeriods(commandText) {
    return commandText.replace(/(\[dot\])/g, '.');
  }

  function childArrayFromString(child) {
    // childArray[1] = first item of dot-separated children
    // childArray[2] = rest of the string (minus the dot)
    return /(\w+)(?:\.([\w.]+))*/.exec(child);
  }


  return MessageHolder;
}
