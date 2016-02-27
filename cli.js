#! /usr/bin/env node
'use strict';
const Promise = require("bluebird");
const betterConsole = require('better-console');
const ProgressBar = require('progress');
const Openprovider = require('openprovider');

const OpenproviderClient = new Openprovider({
  username: process.env.OPENPROVIDERUSER,
  hash: process.env.OPENPROVIDERHASH
});

function requestOpenprovider(domain) {
  // Create progress bar
  const bar = new ProgressBar(':current / :total :bar :message', {total: 3, width: 30});

  // First step
  bar.tick({'message': 'Doing a lookup for: ' + domain});

  // Request dns zone using Openprovider api
  OpenproviderClient.request('searchZoneDnsRequest', {
    namePattern: '%' + domain + '%'
  })
  .then(function checkForErrors(xml) {
    // Second step
    bar.tick({'message': 'Parsing response'});

    // Check for error codes
    return new Promise(
      function (resolve, reject) {
        // Check for access denied status code
        if (xml.openXML.reply[0].code[0] === '10005') {
          reject('Api access denied');
        }

        // Check if there is any data in the response
        if (xml.openXML.reply[0].data[0].results[0] === '') {
          reject('No results found');
        }

        resolve(xml.openXML.reply[0].data[0].results[0]);
      }
    )
  })
  .then(function createTable(result) {
    // Last step
    bar.tick({'message': 'Done'});

    // Delete unneeded data from array
    const items = result.array[0].item.map(
      function removeData(item) {
        delete item.id;
        delete item.isSpamexpertsEnabled;
        delete item.modificationDate;
        delete item.resellerId;
        delete item.isDeleted;
        return item;
      }
    );

    // Create a table using betterConsole
    betterConsole.table(items);
  })
  .catch(function logError(error) {
    // Last step if there is an error.
    bar.tick({message: 'Error on lookup. Error shown below.'});

    // Log error
    console.log(error);
  });
}

// Parse options given in cli
if (typeof process.argv[2] === 'undefined') {
  console.log('Invalid option given');
} else {
  const domain = process.argv[2];
  requestOpenprovider(domain);
}