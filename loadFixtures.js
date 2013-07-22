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

    // for every file found we run this
    fileEmitter.on('fileLoaded', function(data, filename, fileCount) {
        console.log('file: ' + filename);
        console.log(data);

        var newMessage = db.create('Message');
        newMessage.setName(filename);
        newMessage.setText(data);
        newMessage.compile();
        db.save('Message', newMessage);
        console.log('saved ----------------------');

        messageList.push(newMessage);
        if (messageList.length == fileCount) {
            // done.
            console.log('goodbye');
            db.close();
        }
    });

    // remove all to begin
    db.deleteAll('Message');

    // load all files in directory and emit event.
    fs.readdir('./fixtures', function (err, files) {
        var fileCount = files.length;

        for (var i=0; i<fileCount; i++) {
            var filename = files[i];
            fs.readFile('./fixtures/' + files[i], 'utf8', function(err, data) {
                if (err) {
                    console.log(err);
                }
                //remove extension
                var filenameParse = /(\w+)\.\w+/.exec(filename)
                fileEmitter.emit('fileLoaded', data, filenameParse[1], fileCount);
            })
        }

    });
}();