module.exports = function(db) {

  const MessageModel = require('../models/message')(db);

  const messageHandler = {
    loadAllMessages: async () => {
      return await db.loadMultiple('Message', {}, {});
    },

    createMessage: async messageProps => {
      const newMessage = db.create('Message');
      newMessage.setName(messageProps.name);
      newMessage.setText(messageProps.text);
      newMessage.compile();
      await db.save('Message', newMessage);
      return newMessage;
    },

    updateMessage: async messageProps => {
      try {
        const message = await db.load('Message', {name: messageProps.name});
        message.setText(messageProps.text);
        await db.save('Message', message);
        return message;
      } catch (error) {
        throw error;
      }
    },

    createOrUpdateMessage: async messageProps => {
      try {
        return await messageHandler.updateMessage(messageProps);
      } catch(error) {
        if (error.name === 'NotFoundError') {
          return await messageHandler.createMessage(messageProps);
        }
        throw error;
      }
    }
  }

  return messageHandler;
}
