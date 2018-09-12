const ObjectID = require('mongodb').ObjectID;

module.exports = async function(db) {
  const Character = await require('../models/character')(db);

  const characterHandler = {
    getCharacter: async () => {
      return await db.load('Character', {}, {});
    },

    newCharacter: () => {
      return db.create('Character');
    },

    updateCharacter: async characterProps => {
      const character = await db.load('Character', {
        _id: ObjectID(characterProps.id)
      });
      character.setFirstName(characterProps.firstName);
      character.setLastName(characterProps.lastName);
      character.setGender(characterProps.gender);
      await db.save('Character', character);
      return character;
    },

    createOrUpdateCharacter: async characterProps => {
      try {
        return await characterHandler.updateCharacter(characterProps);
      } catch(error) {
        if (error.name === 'NotFoundError') {
          const character = new Character();
          character._id = ObjectID(characterProps.id);
          character.setFirstName(characterProps.firstName);
          character.setLastName(characterProps.lastName);
          character.setGender(characterProps.gender);
          await db.save('Character', character);
          return character;
        }
        throw error;
      }
    },

    restartGame: async characterProps => {
      return await characterHandler.startGame(characterProps);
    },

    startGame: async characterProps => {
      const character = await db.load('Character', {
        _id: ObjectID(characterProps.id)
      });
      await character.startGame();
      await db.save('Character', character);
      return character;
    },
  }

  return characterHandler;
}
