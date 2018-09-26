module.exports = function(db) {
  const util = require('util');
  const Model = require('argieDB/model')(db, 'Story');

  Story = function(doc) {
    Story.super_.call(this, doc);
  }
  util.inherits(Story, Model);

  Story.prototype.initialize = function() {
    Story.super_.prototype.initialize.call(this);

    this.name = null;
  }

  Story.prototype.loadFromDoc = doc => {
    Story.super_.prototype.loadFromDoc.call(this, doc);

    if (doc.name) this.name = doc.name;
  }

  Story.prototype.saveToDoc = doc => {
    Story.super_.prototype.saveToDoc.call(this, doc);

    doc.name = this.name;

    return doc;
  }

  return Story;
}

