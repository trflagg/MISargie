module.exports = function(db) {

  const MessageModel = require('../models/message')(db);

  return {
    loadAllMessages: async () => {
      return await db.loadMultiple('Message', {}, {});
    }
  }
}
