var fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    Db = require('./db');

// load all files in /frameworks as messages
module.exports = function() {

    var env = process.argv[2] || './environments/environment-local'

    var environment = require(env),
        db = new Db(environment),
        Message = require('./models/Message')(db),
        fileEmitter = new EventEmitter(),
        messageList = [];

    var saveMessage = function(messageName, messageText) {
        var newMessage = db.create('Message');
        newMessage.setName(messageName);
        newMessage.setText(messageText);
        newMessage.compile();
        console.log(messageName);
        db.save('Message', newMessage);
        // console.log(messageName);
    }

    // remove all to begin
    db.deleteAll('Message');

    // load all files in directory and emit event.
    fs.readdirSync('./fixtures').forEach(function(file) {
        console.log(file);
        var data = fs.readFileSync('./fixtures/' + file, {encoding: 'utf8'})

        // check for multi-message file.
        // starts with # [messageName]
        if (data[0] === "#") {
            lines = data.split('\n');
            // take off '# '
            var messageName = /^# (\w+)/.exec(lines[0])[1];

            // read line by line
            var text = '';
            for (var i=1, ll=lines.length; i < ll; i++) {
                var line = lines[i];

                if (line[0] === "#") {
                    if (line == '#--') {
                        // new message
                        saveMessage(messageName, text);
                        text = '';
                        i++;
                        var messageName = /^# (\w+)/.exec(lines[i])[1];
                    }
                } else {
                    text = text + '\n' + line;
                }
            }

            saveMessage(messageName, text);
        }
        else {
            // take off extension
            var messageName = /(\w+)\.\w+/.exec(file)[1];
            var messageText = data;
            saveMessage(messageName, messageText);
        }

        console.log('saved ----------------------');
    });
    // done.
    console.log('goodbye');
    db.close();
}();