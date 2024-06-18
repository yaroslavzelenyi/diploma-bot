const config = require('../cfg/config')
const Promise = require('bluebird')
const MongoClient = require('mongodb').MongoClient

const url = config.mongodbUrl;

var db;

MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true},  function(err, client) {
    if ( err ) {
        console.log( err );
    }

    db = client.db('diploma');
});

module.exports = function() {
    return db;
}