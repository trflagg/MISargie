var Db = require('./db'),
    readline = require('readline');

function selectAvatar() {
    rl.question('Please select: \n \
    1*) New avatar \n \
    2) Load avatar \n', function(answer) {
        if (answer == 2) {
            loadAvatar();
        }
        else {
            newAvatar();
        }
    });
}

function loadAvatar() {
    rl.question('Avatar name: \n', function(answer) {
        db.load('Avatar', {name: answer}, function(err, avatar) {
            if (err) {
                console.log(err);
                selectAvatar();
            }
            else if (avatar == null) {
                console.log('no avatar found');
                selectAvatar();
            }
            else {
                startLoop(avatar);            
            }
        })
    });
}

function newAvatar() {
    var avatar = db.create('Avatar');
    rl.question('Name?\n', function(answer) {
        avatar.setName(answer);
        startLoop(avatar);
    });
}

function saveAvatar(avatar) {
    db.save('Avatar', avatar, function() {
        promptForCommands(avatar);
    });
}

function startLoop(avatar) {
    // load start message
    var firstMessage = 'G3_INIT';
    db.load('Message', {name: firstMessage}, function(err, message) {
        if (err) {
            console.log(err);
        }
        doLoop(avatar, message);
    })
}

function doLoop(avatar, message) {
    if (message) {
        var result = message.run(avatar);
    }

    // show result of message
    console.log(result);

    //show command options
    promptForCommands(avatar);
}

function promptForCommands(avatar) {
    var commands = avatar.getCommandTextList();
    var commandlength = commands.length;
    for (var i=0; i<commandlength; i++) {
        console.log(i + ') ' + commands[i]);
    }
    rl.question('>', function(answer) {
        if (answer == 'q') {
            end();
        } else if (answer == 's') {
            saveAvatar(avatar);
        }
        else {
            var a = parseInt(answer, 10);
            if (a > commandlength || a < 0) {
                promptForCommands(avatar);
            }
            else {
                // run message, show result, ask for next command
                console.log(a);
                console.log(avatar.getCommandTextList());
                var result = avatar.runMessage(avatar.getCommandTextList()[a], function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    console.log(result);
                    promptForCommands(avatar);
                });
            }
        }

    });
}

function end() {
    db.close();
    rl.close();
}
module.exports = function() {

    var environment = require('./environments/environment-local')

    // db and rl are global
    db = new Db(environment),
    Avatar = require('./models/Avatar')(db),
    Message = require('./models/Message')(db);
    rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt('>');

    console.log('Welcome to argie!');

    selectAvatar();
}();

