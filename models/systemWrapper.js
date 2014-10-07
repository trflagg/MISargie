/**
 * system object used in context while running messages.
 *
 * @return {Object}
 */
module.exports = function(db) {

	var util = require('util'),
		constants = require('../constants'),
		AvatarWrapper = require('./avatarWrapper')(db);

	System = function(avatar) {
		this.loadedMessages = [];
		this._avatar = avatar;
	};

	System.prototype.loadMessage = function(message_id) {
		var msg = this.loadedMessages[message_id];
		if (!msg) {
			return 'MESSAGE ' + message_id + ' NOT FOUND. MAKE SURE TO INCLUDE IN LoadedMessages()';
		}

		if (!msg._compiled) {
			msg.compile();
		}
		var avatarWrapper = new AvatarWrapper(this._avatar);
		return msg._compiled({
        	avatar: avatarWrapper,
        	system: this
        });
	};

	System.prototype.registerRegEx = function(regEx) {
		this[regEx.functionName] = function(arg) {
			arg = arg || '';
			return util.format(regEx.placeholder, arg);
		}
	}

	System.prototype.registerFunction = function(func) {
		this[func.functionName] = function() {
			func.functionBody.apply(this, arguments);
		}
	}

	return System;
};
