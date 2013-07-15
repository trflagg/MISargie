/**
 * Create connection to testdb and run all tests.
 */
module.exports.runTests = function() {

    var assert = require('assert'),
         async = require('async');


    console.log('\n________ Running All Tests ____________');

    // load service based on environment
    var environment = require('../environments/environment-test');
    var db = require('../db').init(environment);

    async.series([
            function(callback) {
                require('./databaseInit')(db, callback);
            },
            function(callback) {
                console.log('');
                require('./avatarTest')(db, callback);
            }
        ],
        function(err, results) {
            console.log('________ Tests Ended __________________');
            console.log('');
            db.close();
        }
    );
}();
