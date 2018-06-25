module.exports = function(db, collectionName) {

  var util = require('util'),
    _ = require('lodash'),
    MessageHolder = require('./messageHolder')(db),
    BNum = require('./bNum')(db),
    returnObject = {},
    collectionName = collectionName || 'avatars';

  Avatar = function(doc) {
    Avatar.super_.call(this, doc);
  }
  util.inherits(Avatar, MessageHolder);

  Avatar.prototype.initialize = function() {
    Avatar.super_.prototype.initialize.call(this);

    this._location = null;
    this._globals = {};
    this._bNums = {};
    this._triggers = [];
    this._timers = {};
    this._yields = [];
  };

  Avatar.prototype.loadFromDoc = function(doc) {
    Avatar.super_.prototype.loadFromDoc.call(this, doc);

    if(doc.location) this._location = doc.location;
    if(doc.globals) this._globals = doc.globals;
    if(doc.bNums) {
      this._bNums = {};
      for (key in doc.bNums) {
        if (doc.bNums.hasOwnProperty(key)) {
          var constructor = db.getConstructor('bNum');
          var bNum = new constructor(doc.bNums[key]);
          this.setBNum(key, bNum);
        }
      }
    }
    if(doc.triggers) this._triggers = doc.triggers;
    if(doc.timers) this._timers = doc.timers;
    if(doc._yields) this._yields = doc._yields;
  };

  Avatar.prototype.saveToDoc = function(doc) {
    Avatar.super_.prototype.saveToDoc.call(this, doc);

    doc.location = this._location;
    doc.globals = this._globals;
    doc.bNums = {};
    for (key in this._bNums) {
      if (this._bNums.hasOwnProperty(key)) {
        var bNum = this._bNums[key];
        doc.bNums[key] = bNum.onSave(bNum);
      }
    }
    doc.triggers = this._triggers;
    doc.timers = this._timers;
    doc._yields = this._yields;

    return doc;
  };

  Avatar.prototype.clear = function() {
    Avatar.super_.prototype.clear.call(this);
    this._globals = {};
    this._bnums = {};
    this._triggers = [];
    this._timers = {};
    this._yields = [];
  };

  Avatar.prototype.setGlobal = function(key, value) {
    this._globals[key] = value;

    return this;
  };

  Avatar.prototype.getGlobal = function(key) {
    if (!this._globals || !this._globals.hasOwnProperty(key)) {
      return null;
    }

    return this._globals[key];
  };

  Avatar.prototype.setBNum = function(key, value) {
    if (!isNaN(value)) {
      value = db.create('bNum').setValue(value);
    }

    this._bNums[key] = value;

    return this;
  };

  Avatar.prototype.getBNum = function(key) {
    if (!this._bNums || !this._bNums.hasOwnProperty(key)) {
      return null;
    }

    return this._bNums[key];
  };

  Avatar.prototype.addBNum = function(key, amount) {
    if (!this._bNums || !this._bNums.hasOwnProperty(key)) {
      return null;
    }

    return this._bNums[key].addBNum(amount);
  }

  Avatar.prototype.setLocation = function(location) {
    this._location = location;
  };

  Avatar.prototype.getLocation = function() {
    return this._location;
  };

  Avatar.prototype.changeLocation = async function(locationName) {
    try {
      const location = await db.load('Location', {name: locationName});

      avatar.setLocation(location);
      // run message
      const message = await db.load('Message', {name: location.getMessage()});
      return message.run(avatar);
    } catch (e) {
      console.error('Error in Avatar.changeLocation');
      console.error(e);
      throw e;
    }
  };

  Avatar.prototype.addTrigger = function(messageName) {
    this._triggers.push(messageName);
  };

  Avatar.prototype.removeTrigger = function(messageName) {
    var index = this._triggers.indexOf(messageName);
    if (index > -1) {
      this._triggers.splice(index, 1);
    }
  };

  Avatar.prototype.runMessage = async function(commandText, child) {
    var underleveld = false;

    child = child ? child : '';

    // triggers
    var messageList = _.clone(this._triggers);

    // message being run
    var messageObject = this.message(commandText, child);
    if (!messageObject) {
      console.log('messageObject not found');
    }
    var messageName = messageObject['message'];
    var messageLevel = messageObject['level'];

    // check if we can run it
    if (messageLevel > this.getLevel(child)) {
      underleveld = true;
      if (messageObject.underLeveledMessage) {
        messageName = messageObject.underLeveledMessage;
      } else {
        throw new Error('Message cannot be run. Level is too high');
      }
    }

    messageList.push(messageName);

    // load & run
    try {
      var messages = await db.loadMultiple('Message', {name: { $in: messageList}});
      var triggers = [];
      var message = {};
      var foundMessage = false;
      for (var i=0,ll=messages.length; i<ll; i++) {
        if (messages[i].getName() == messageName) {
          message = messages[i];
          foundMessage = true;
        }
        else {
          triggers.push(messages[i]);
        }
      }

      if (!foundMessage) {
        throw new Error('Message ' + messageName + ' NOT FOUND.', null);
      }

      if (underleveld || this.recordsUnread(child)) {
        this.read(commandText, child);
      } else {
        this.removeMessage(commandText);
      }

      var result = await message.run(this);

      return this._runTriggerList(triggers, result);

    } catch(e) {
      console.error('error in Avatar.runMessage');
      console.error(e);
      throw e;
    }

  };

  Avatar.prototype.runMessageName = async function(messageName) {
    try {
      console.log(`runMessageName: ${messageName}`);
      var message = await db.load('Message', {name: messageName});
      if (!message) {
        throw new Error('runMessage: Message ' + messageName + ' NOT FOUND', null);
      }
      return await message.run(this);
    } catch(e) {
      console.error('error in Avatar.runMessageName');
      console.error(e);
      throw e;
    }
  };

  Avatar.prototype._runTriggerList = async function(triggers, result) {
    for(var i=0, ll=triggers.length; i<ll; i++) {
      var trigger_result = await triggers[i].run(this);
      result = result + trigger_result;
    }

    return result;
  };

  Avatar.prototype.reset = async function(messageName) {
    try {
      this.clear();
      if(messageName) {
        var message = await db.load('Message', {name: messageName});
        return message.run(this);
      }
    } catch(e) {
      console.error('error in Avatar.reset');
      console.error(e);
      throw e;
    }
  };

  Avatar.prototype.addTimer = function(timeInSeconds, timerString, timerId) {
    this._timers[timerId] = {
      timeInSeconds: timeInSeconds,
      timerString: timerString,
    };
  };

  Avatar.prototype.removeTimer = function(timerId) {
    delete this._timers[timerId]
  };

  Avatar.prototype.addYield = function(y) {
    this._yields.push(y);
  }

  Avatar.prototype.removeYield = function(messageName) {
    _.remove(this._yields, function(y) { return y.message == messageName });
  }

  Avatar.prototype.nextYield = function(currentDatetime) {
    currentDatetime = currentDatetime || new Date();
    var yields = this._yields;
    if (yields.length <= 0) {
      return null;
    }
    var nextYield = _.minBy(yields, 'datetime');
    return nextYield;
  };

  Avatar.prototype.nextYieldOffset = function(currentDatetime) {
    currentDatetime = currentDatetime || new Date();
    var nextYield = this.nextYield(currentDatetime);
    if (nextYield) {
      return Date.parse(nextYield.datetime) - currentDatetime.getTime();
    }
    return null;
  };

  db.register('Avatar', Avatar);

  return Avatar;

};
