/**
 * Avatar object used in context while running a message template.
 * Holds avatar it represents.
 * Wrapper exposes only certain methods to the message templates.
 * 
 * @return {[type]} [description]
 */
module.exports = function() {

	AvatarWrapper = function(avatar) {
		this.avatar = avatar;
	}

	AvatarWrapper.prototype.setGlobal = function(global, value) {
		this.avatar.setGlobal(global, value);
	};
	AvatarWrapper.prototype.getGlobal = function(global) {
		return this.avatar.getGlobal(global);
	};

	AvatarWrapper.prototype.yield = function(time, message_id) {
        this.avatar.setGlobal('yield', 1);
		this.avatar.setYieldTime(time);
		this.avatar.setYieldMessage(message_id);
	}

	AvatarWrapper.prototype.setBNum = function(name, value) {
		this.avatar.setBNum(name, value);
	}
	AvatarWrapper.prototype.getBNum = function(name) {
		return this.avatar.getBNum(name);
	};
	AvatarWrapper.prototype.addBNum = function(name, amount) {
		this.avatar.addBNum(name, amount);
	};

	AvatarWrapper.prototype.hideChild = function(childName) {
		this.avatar.hideChild(childName);
	}
	AvatarWrapper.prototype.showChild = function(childName) {
		this.avatar.showChild(childName);
	}


	return AvatarWrapper;
}