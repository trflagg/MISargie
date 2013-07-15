module.exports = function(db) {
    var Model = require('./Model');

    var Avatar = function(db) {
        Model.call(this);
        
        this.globals = {};

    }
    Avatar.prototype = new Model();
    Avatar.prototype.constructor = Avatar();

    Avatar.prototype.save = function(callback) {
        db.Avatars.update({
            "globals" : this.globals
        },)
    };

    Avatar.prototype.setGlobal = function(key, value, callback) {
        this.globals[key] = value;

        if (typeof callback === 'function') {
            return this.save(callback);
        }

        return this;
    };

    Avatar.prototype.getGlobal = function(key) {
        if (!this.globals || !this.globals[key]) {
            return null;
        }
    };

        
};
