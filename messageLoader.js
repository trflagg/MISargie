
module.exports = function() {
  var fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    yaml = require('js-yaml'),
    path = require('path');

  var Loader = function(environmentOrDb) {
    if (!environmentOrDb._db) {
      // it's an environment
      Db = require('argieDB/db');
      this.db = new Db(environment);
    } else {
      this.db = environmentOrDb;
    }

    require('./models/message')(this.db);
    require('./models/location')(this.db);
  }

  Loader.prototype.saveMessage = function(messageName, messageText, loadedMessages, namePrefix) {
    var newMessage = this.db.create('Message');
    if (namePrefix) {
      messageName = namePrefix + "_" + messageName;
    }

    newMessage.setName(messageName);
    newMessage.setText(messageText);

    if (loadedMessages.length > 0) {
        newMessage.setMessagesLoaded(loadedMessages);
    }
    newMessage.compile();
    console.log('saving: ', messageName);
    this.db.save('Message', newMessage);
  }

  Loader.prototype.saveLocation = function(name, description, message_name) {
      var newLocation = this.db.create("Location");
      newLocation.setName(name);
      newLocation.setDescription(description);
      newLocation.setMessage(message_name);
      console.log(name);
      this.db.save("Location", newLocation);
}

  Loader.prototype.processMsgsFile = function(dir, filename, namePrefix) {
    var data = fs.readFileSync(path.resolve(dir, filename), {encoding: 'utf8'})

    // set messagePrefix
    // take off extension
    var messagePrefix = /(\w+)\.\w+/.exec(filename)[1];
    if (namePrefix != '') {
      messagePrefix = namePrefix + '_' + messagePrefix;
    }

    // check for multi-message filename.
    // starts with # [messageName]
    if (data[0] === "#") {
        lines = data.split('\n');
        // take off '# '
        var messageName = /^# (\w+)/.exec(lines[0])[1];
        var loadedMessages = [];

        // read line by line
        var text = '';
        for (var i=1, ll=lines.length; i < ll; i++) {
            var line = lines[i];

            if (line[0] === "#") {
                if (line.indexOf('# loadMessage(') == 0) {
                    var loadName = /^# loadMessage\(\'(\w+)\'\)/.exec(line)[1];
                    loadedMessages.push(loadName);
                }
                else if (line == '#--') {
                    // new message
                    this.saveMessage(messageName, text, loadedMessages, messagePrefix);
                    text = '';
                    i++;
                    var messageName = /^# (\w+)/.exec(lines[i])[1];
                    var loadedMessages = [];
                }
            } else {
                text = text + '\n' + line;
            }
        }

        this.saveMessage(messageName, text, loadedMessages, messagePrefix);
    }
    else {
      // take off extension
      var messageName = /(\w+)\.\w+/.exec(filename)[1];
      var messageText = data;
      this.saveMessage(messageName, messageText, filename);
    }
  }

  Loader.prototype.processYamlFile = function(dir, filename) {
    var data = fs.readFile(dir + filename, {encoding: 'utf8'});
    var doc = yaml.safeLoad(data);

    for(var i=0, ll = doc.length; i<ll; i++) {
        obj = doc[i];
        // default: message
        if (typeof obj.type === 'undefined' || obj.type === 'message') {
            this.saveMessage(obj.name, obj.text, [], '');
        }

        // location
        else if (obj.type === 'location') {
            this.saveLocation(obj.name, obj.description, obj.message);
        }
    }
  }

  var endsWith = function(string, suffix) {
      return string.indexOf(suffix, string.length - suffix.length) !== -1;
  };

  var result = {}

  Loader.prototype.loadDirectory = function(dir, namePrefix) {
      // closure variable
      var loader = this;

      // load all files in directory
      var files = fs.readdirSync(dir)

      for (i in files) {

        var file = files[i];
        var filePrefix = namePrefix;

        // what is it?
        var fullPath = path.resolve(dir, file);
        var fd = fs.openSync(fullPath, 'r');
        var stats = fs.fstatSync(fd);
        fs.closeSync(fd);

        if (stats.isDirectory()) {
          console.log('entering ' + path.resolve(dir, file));
          if (filePrefix != '') {
            filePrefix = filePrefix + '_';
          }
          this.loadDirectory(path.resolve(dir, file), filePrefix + file);
        } else {
          console.log('evaluating ' + path.resolve(dir, file));

          if (!file.startsWith('.')) {
              // check extension
              if (endsWith(file, '.msgs')) {
                  loader.processMsgsFile(dir, file, namePrefix);
              }
              else if (endsWith(file, '.yaml') || endsWith(file, '.yml')) {
                  //forget yaml for now
                  //loader.processYamlFile(dir, file);
              }

              console.log('saved ----------------------');
          } else {
              console.log('skipped ------------------');
          }
        }
      };
  }

  Loader.prototype.startLoading = function(dir) {
      // remove all to begin
      this.db.deleteAll('Message');

      var db = this.db;
      // load starting directory
      this.loadDirectory(path.resolve(__dirname, dir), '')

      // done.
      console.log('goodbye');
      db.close();

  }

   // EXECUTION STARTS HERE
  if (require.main === module) {
      var co = require('co');

      var env = process.argv[2] || './environments/environment-local'
          , environment = require(env)
          , dir = process.argv[3] || '../../fixtures/'
          , loader = new Loader(environment);

      loader.startLoading(dir);
  } else {
    return Loader;
  }

}()
