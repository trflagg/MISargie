/**
 * Avatar object used in context while running a message template.
 * Holds avatar it represents.
 * Wrapper exposes only certain methods to the message templates.
 *
 * @return {[type]} [description]
 */
module.exports = function(db) {

	var MessageHolder = require('./messageHolder')(db);

	AvatarWrapper = function(avatar) {
		this.avatar = avatar;
	}

	AvatarWrapper.prototype.setGlobal = function(global, value) {
		return this.avatar.setGlobal(global, value);
	};
	AvatarWrapper.prototype.getGlobal = function(global) {
		return this.avatar.getGlobal(global);
	};

	AvatarWrapper.prototype.yield = function(time, message_id) {
        this.avatar.setGlobal('yield', 1);
		this.avatar.setYieldTime(time);
		return this.avatar.setYieldMessage(message_id);
	}

	AvatarWrapper.prototype.setBNum = function(name, value) {
		return this.avatar.setBNum(name, value);
	}
	AvatarWrapper.prototype.getBNum = function(name) {
		return this.avatar.getBNum(name);
	};
	AvatarWrapper.prototype.addBNum = function(name, amount) {
		return this.avatar.addBNum(name, amount);
	};

	AvatarWrapper.prototype.addChild = function(name) {
		return this.avatar.addChild(name, new MessageHolder());
	}
	AvatarWrapper.prototype.addMessage = function(commandText, messageName, child) {
		return this.avatar.addMessage(commandText, messageName, child);
	};
	AvatarWrapper.prototype.removeMessage = function(commandText) {
		return this.avatar.removeMessage(commandText);
	};

	AvatarWrapper.prototype.hideChild = function(childName) {
		return this.avatar.hideChild(childName);
	}
	AvatarWrapper.prototype.showChild = function(childName) {
		return this.avatar.showChild(childName);
	}

	AvatarWrapper.prototype.clearMessages = function() {
		this.avatar.clear();
	}

	AvatarWrapper.prototype.addTrigger = function(messageName) {
		return this.avatar.addTrigger(messageName);
	};
	AvatarWrapper.prototype.removeTrigger = function(messageName) {
		return this.avatar.removeTrigger(messageName);
	};

	AvatarWrapper.prototype.setLocation = function(locationName) {
		return this.avatar.setLocation(locationName);
	};


	return AvatarWrapper;

};
