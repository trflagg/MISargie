module.exports = function(db) {
    var Model = require('./Model');

    var Player = function(db) {
        Model.call(this);
        
        this.globals = {};

    }
    Player.prototype = new Model();
    Player.prototype.constructor = Player();

    Player.prototype.save = function(callback) {
        db.players.update({
            "globals" : this.globals
        },)
    };

    Player.prototype.setGlobal = function(key, value, callback) {
        this.globals[key] = value;

        if (typeof callback === 'function') {
            return this.save(callback);
        }

        return this;
    };

    Player.prototype.getGlobal = function(key) {
        if (!this.globals || !this.globals[key]) {
            return null;
        }
    };

        
};
