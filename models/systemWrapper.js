/**
 * system object used in context while running messages.
 * 
 * @return {Object}
 */
module.exports = function() {

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

	System.prototype.yield = function(time) {
		
	};

	return System;
}