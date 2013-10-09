

var fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    yaml = require('js-yaml');
    Db = require('./db');

var fixtures_dir = './fixtures/';

// load all files in /frameworks as messages
module.exports = function() {

    var env = process.argv[2] || './environments/environment-local'

    var environment = require(env),
        db = new Db(environment),
        Message = require('./models/Message')(db),
        Location = require('./models/Location')(db),
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

    var saveLocation = function(name, description, message_name) {
        var newLocation = db.create("Location");
        newLocation.setName(name);
        newLocation.setDescription(description);
        newLocation.setMessage(message_name);
        console.log(name);
        db.save("Location", newLocation);
    }

    var processMsgsFile = function(filename) {
        var data = fs.readFileSync(fixtures_dir + filename, {encoding: 'utf8'})

        // check for multi-message filename.
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
            var messageName = /(\w+)\.\w+/.exec(filename)[1];
            var messageText = data;
            saveMessage(messageName, messageText);
        }
    }

    var processYamlFile = function(filename) {
        var data = fs.readFileSync(fixtures_dir + filename, {encoding: 'utf8'});
        var doc = yaml.safeLoad(data);

        for(var i=0, ll = doc.length; i<ll; i++) {
            obj = doc[i];
            // default: message
            if (typeof obj.type === 'undefined' || obj.type === 'message') {
                saveMessage(obj.name, obj.text);
            }

            // location
            else if (obj.type === 'location') {
                saveLocation(obj.name, obj.description, obj.message);
            }
        }
    }

    // EXECUTION STARTS HERE
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

    // remove all to begin
    db.deleteAll('Message');

    // load all files in directory
    fs.readdirSync(fixtures_dir).forEach(function(file) {
        console.log(file);

        // check extension
        if (file.endsWith('.msgs')) {
            processMsgsFile(file);
        }
        else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            processYamlFile(file);
        }

        console.log('saved ----------------------');
    });
    // done.
    console.log('goodbye');
    db.close();
}();