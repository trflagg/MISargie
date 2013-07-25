var fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    Db = require('./db');

// load all files in /frameworks as messages
module.exports = function() {
    var environment = require('./environments/environment-local'),
        db = new Db(environment),
        Message = require('./models/Message')(db),
        fileEmitter = new EventEmitter(),
        messageList = [];

    // remove all to begin
    db.deleteAll('Message');

    // load all files in directory and emit event.
    fs.readdirSync('./fixtures').forEach(function(file) {
        console.log(file);
        var data = fs.readFileSync('./fixtures/' + file, {encoding: 'utf8'})
        var filenameParse = /(\w+)\.\w+/.exec(file);
        console.log(data);

        var newMessage = db.create('Message');
        newMessage.setName(filenameParse);
        newMessage.setText(data);
        newMessage.compile();
        db.save('Message', newMessage);
        console.log('saved ----------------------');
    });
    // done.
    console.log('goodbye');
    db.close();
}();