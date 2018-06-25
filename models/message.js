module.exports = function(db, collectionName) {
  var util = require('util'),
    _ = require('lodash'),
    Model = require('argieDB/model')(db),
    System = require('./systemWrapper'),
    AvatarWrapper = require('./avatarWrapper'),
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
      this._messagesLoaded = doc.messagesLoaded;
      this._globalsRequested = doc.globalsRequested;
    }
    else {
      // make new Message
      this._name = null;
      this._text = null;
      this._compiled = {};
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
    doc.messagesLoaded = message._messagesLoaded;
    doc.globalsRequested = message._globalsRequested;
    return doc;
  };


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

  Message.prototype.setMessagesLoaded = function(messagesLoaded) {
    return this._messagesLoaded = messagesLoaded;
  }

  Message.prototype.addLoadedMessage = function(message_id) {
    this._messagesLoaded.push(message_id);
  }

  Message.prototype.globalsRequested = function() {
    return this._globalsRequested;
  }

  Message.prototype.getCompiled = function() {
    return this._compiled;
  }

  Message.prototype.compile = function() {
    if (this._text === null) {
      this._compiled = null;
      return null;
    }

    this._compiled = _.template(this._text);
    return this._compiled;
  }

  Message.prototype.run = async function(avatar) {
    if (!this._compiled) {
      this.compile();
    }

    var system = new System(avatar);
    var avatarWrapper = new AvatarWrapper(avatar);

    // load any messages
    try {
      var messagesLoaded = this.messagesLoaded();
      if (messagesLoaded.length > 0) {
        var messages = await db.loadMultiple('Message', {name: { $in: messagesLoaded}});
        var msgObject = {};
        for(var i=0, ll=messages.length; i<ll; i++) {
          msgObject[messages[i].getName()] = messages[i];
        }
        system.loadedMessages = msgObject;
      }

      // kick it off
      result = this._compiled({
        avatar: avatarWrapper,
        system: system
      });

      return result;
    } catch (e) {
      console.error('Error in Message.run');
      console.error(e);
      throw e;
    }
  };

  db.register('Message', Message);

  return Message;
};
