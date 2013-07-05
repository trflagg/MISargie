var environment,
    db,
    mongo = require('mongoskin');

module.exports.init = function(env) {
    _environment = env;
    _db = mongo.db(env.db.URL);
    return _db;
};

module.exports.db = function() {
    return _db;
}
