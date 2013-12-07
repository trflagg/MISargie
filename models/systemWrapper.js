/**
 * system object used in context while running messages.
 * 
 * @return {Object}
 */
module.exports = function() {

	var util = require('util'),
		constants = require('../constants');

	System = function() {
		this.loadedMessages = [];
	};

	System.prototype.loadMessage = function(message_id, system, avatar) {
		var msg = this.loadedMessages[message_id];
		if (!msg) {
			return 'MESSAGE ' + message_id + ' NOT FOUND. MAKE SURE TO INCLUDE IN LoadedMessages()';
		}

		if (!msg._compiled) {
			msg.compile();
		}
		return msg._compiled({
        	avatar: avatar, 
        	system: system
        });
	};

	System.prototype.wait = function(time_in_miliseconds) {
		// insert wait string 
		return util.format(constants.waitString, time_in_miliseconds);
	}

	System.prototype.clearScreen = function() {
		return constants.clearScreenString
	};

	return System;
}