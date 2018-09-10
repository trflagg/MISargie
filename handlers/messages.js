const ObjectID = require('mongodb').ObjectID;
const UserError = require('./user-error');

module.exports = async function(db) {

  const Message = await require('../models/message')(db).initialize();

  const messageHandler = {
    loadAllMessages: async () => {
      return await db.loadMultiple('Message', {}, {});
    },

    createMessage: async messageProps => {
      const newMessage = db.create('Message');
      return newMessage;
    },

    saveMessageObject: async message => {
      try {
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

    updateMessage: async messageProps => {
      const message = await db.load('Message', {
        _id: ObjectID(messageProps.id)
      });
      message.setName(messageProps.name);
      message.setText(messageProps.text);
      return await messageHandler.saveMessageObject(message);
    },

    createOrUpdateMessage: async messageProps => {
      try {
        return await messageHandler.updateMessage(messageProps);
      } catch(error) {
        if (error.name === 'NotFoundError') {
          const message = new Message();
          message._id = ObjectID(messageProps.id);
          message.setName(messageProps.name);
          message.setText(messageProps.text);
          return await messageHandler.saveMessageObject(message);
        }
        throw error;
      }
    },

    deleteMessage: async messageProps => {
      console.log(`handler: deleteMessage id: ${messageProps.id}`);
      return await db.removeById('Message', messageProps.id);
    }
  }

  return messageHandler;
}
