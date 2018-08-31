const ObjectID = require('mongodb').ObjectID;
const UserError = require('./user-error');

module.exports = async function(db) {

  await require('../models/message')(db).initialize();

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
        const message = await db.load('Message', {
          _id: ObjectID(messageProps.id)
        });
        message.setName(messageProps.name);
        message.setText(messageProps.text);
        await db.save('Message', message);
        return message;
      } catch (error) {
        // make duplicate mongo error message more human readable
        if (error.code === 11000) {
          throw new UserError([
            { key: 'name',
              message: 'Duplicate message name. Name must be unique.' }
          ], 'An error occurred while saving.');
        }
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
