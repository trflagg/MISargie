module.exports = function(db, collectionName) {

    MessageHolder = function() {
        this._messages = {};
    }

    MessageHolder.prototype.addMessage = function(commandText, messageName) {
        this._messages[commandText] = messageName;
    };

    MessageHolder.prototype.removeMessage = function(commandText) {
        delete this._messages[commandText] ;
    };

    MessageHolder.prototype.messageCount = function() {
        return Object.keys(this._messages).length;
    };

    MessageHolder.prototype.getCommandTextList = function() {
        return Object.keys(this._messages);
    };

    MessageHolder.prototype.runMessage = function(commandText, ship, callback) {
        var messageName = this._messages[commandText];
        if (!messageName) {
            return callback("Message with commandText "+commandText+ " not found.");
        }
        return callback(null);
    };

    MessageHolder.prototype.toObject = function() {
        return this._messages;
    }

    return MessageHolder;
}