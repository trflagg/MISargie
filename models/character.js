module.exports = function(db) {
  var util = require('util'),
    Avatar = require('./avatar')(db);

  Character = function(doc) {
    Character.super_.call(this, doc);
  }
  util.inherits(Character, Avatar);

  Character.prototype.setFirstName = function(firstName) {
    this.setGlobal('firstName', firstName);
  }

  Character.prototype.firstName = function() {
    return this.getGlobal('firstName');
  }

  Character.prototype.setLastName = function(lastName) {
    this.setGlobal('lastName', lastName);
  }

  Character.prototype.lastName = function() {
    return this.getGlobal('lastName');
  }

  Character.prototype.setGender = function(gender) {
    this.setGlobal('gender', gender);
  }

  Character.prototype.gender = function() {
    return this.getGlobal('gender');
  }

  db.register('Character', Character);

  return Character;
}
