
module.exports = function() {
  var fs = require('co-fs'),
    EventEmitter = require('events').EventEmitter,
    yaml = require('js-yaml');

  var Loader = function(environment) {
    Db = require('argieDB/co-db');
    this.db = new Db(environment);
    require('./models/message')(this.db);
    require('./models/location')(this.db);
  }

  Loader.prototype.saveMessage = function*(messageName, messageText, loadedMessages) {
    var newMessage = this.db.create('Message');
    newMessage.setName(messageName);
    newMessage.setText(messageText);

    if (loadedMessages.length > 0) {
        newMessage.setMessagesLoaded(loadedMessages);
    }
    newMessage.compile();
    console.log(messageName);
    yield this.db.save('Message', newMessage);
  }

  Loader.prototype.saveLocation = function*(name, description, message_name) {
      var newLocation = this.db.create("Location");
      newLocation.setName(name);
      newLocation.setDescription(description);
      newLocation.setMessage(message_name);
      console.log(name);
      yield this.db.save("Location", newLocation);
  }

  Loader.prototype.processMsgsFile = function*(dir, filename) {
    var data = yield fs.readFile(dir + filename, {encoding: 'utf8'})

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
                    yield this.saveMessage(messageName, text, loadedMessages);
                    text = '';
                    i++;
                    var messageName = /^# (\w+)/.exec(lines[i])[1];
                    var loadedMessages = [];
                }
            } else {
                text = text + '\n' + line;
            }
        }

        yield this.saveMessage(messageName, text, loadedMessages);
    }
    else {
      // take off extension
      var messageName = /(\w+)\.\w+/.exec(filename)[1];
      var messageText = data;
      yield this.saveMessage(messageName, messageText);
    }
  }

  Loader.prototype.processYamlFile = function*(dir, filename) {
    var data = yield fs.readFile(dir + filename, {encoding: 'utf8'});
    var doc = yaml.safeLoad(data);

    for(var i=0, ll = doc.length; i<ll; i++) {
        obj = doc[i];
        // default: message
        if (typeof obj.type === 'undefined' || obj.type === 'message') {
            yield this.saveMessage(obj.name, obj.text);
        }

        // location
        else if (obj.type === 'location') {
            yield this.saveLocation(obj.name, obj.description, obj.message);
        }
    }
  }

  var endsWith = function(string, suffix) {
      return string.indexOf(suffix, string.length - suffix.length) !== -1;
  };

  var result = {}

  Loader.prototype.loadDirectory = function*(dir) {
      // remove all to begin
      this.db.deleteAll('Message');

      // closure variable
      var loader = this;

      // load all files in directory
      files = yield fs.readdir(dir)
      for(var i=0, ll=files.length; i<ll; i++) {
        var file = files[i];
        console.log(file);

        // check extension
        if (endsWith(file, '.msgs')) {
            yield loader.processMsgsFile(dir, file);
        }
        else if (endsWith(file, '.yaml') || endsWith(file, '.yml')) {
            yield loader.processYamlFile(dir, file);
        }

        console.log('saved ----------------------');
      }
      // done.
      console.log('goodbye');
      this.db.close();
  }

   // EXECUTION STARTS HERE
  if (require.main === module) {
      var co = require('co');

      var env = process.argv[2] || './environments/environment-local'
          , environment = require(env)
          , dir = process.argv[3] || './fixtures/'
          , loader = new Loader(environment);

      co.wrap(function*(){
        try {
          yield loader.loadDirectory(dir);
        } catch (err) {
          console.error(err.message);
          return;
        }
      })();
  } else {
    return Loader;
  }

}()
