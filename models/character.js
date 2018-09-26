module.exports = function(db) {
  var util = require('util'),
    Avatar = require('./avatar')(db);

  Character = function(doc) {
    Character.super_.call(this, doc);
  }
  util.inherits(Character, Avatar);

  Character.prototype.initialize = function() {
    Character.super_.prototype.initialize.call(this);

    this.lastResult = '';
    this.ownerID = null;
    this.storyID = null;
  }

  Character.prototype.saveToDoc = function(doc) {
    Character.super_.prototype.saveToDoc.call(this, doc);

    doc.lastResult = this.lastResult;
    doc.ownerID = this.ownerID;
    doc.storyID = this.storyID;

    return doc;
  }

  Character.prototype.loadFromDoc = function(doc) {
    Character.super_.prototype.loadFromDoc.call(this, doc);

    if(doc.lastResult) this.lastResult = doc.lastResult;
    if(doc.ownerID) this.ownerID = doc.ownerID;
    if(doc.storyID) this.storyID = doc.storyID;
  }

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

  Character.prototype.startGame = async function() {
    this.lastResult = await this.runMessageName('INIT');
    return this;
  }

  db.register('Character', Character);

  return Character;
}
