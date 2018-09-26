// Represents a User capable of 'owning' a story or character
module.exports = function(db) {
  const util = require('util');
  const Model = require('argieDB/model')(db, 'User');

  User = function(doc) {
    User.super_.call(this, doc);
  }
  util.inherits(User, Model);

  User.prototype.initialize = function() {
    User.super_.prototype.initialize.call(this);

    this.username = null;
  }

  User.prototype.loadFromDoc = doc => {
    User.super_.prototype.loadFromDoc.call(this, doc);

    if (doc.username) this.username = doc.username;
  }

  User.prototype.saveToDoc = doc => {
    User.super_.prototype.saveToDoc.call(this, doc);

    doc.username = this.username;

    return doc;
  }

  return User;
}
