#! /usr/bin/env node
'use strict'
const Promise = require('bluebird')
const objectValues = require('object-values')
const Openprovider = require('openprovider')
const Ora = require('ora')
const Table = require('cli-table')

const OpenproviderClient = new Openprovider({
  username: process.env.OPENPROVIDERUSER,
  hash: process.env.OPENPROVIDERHASH
})

function requestOpenprovider (domain) {
  // Create progress bar
  const spinner = Ora('Doing a lookup for: ' + domain).start()

  // Request dns zone using Openprovider api
  OpenproviderClient.request('searchZoneDnsRequest', {
    namePattern: '%' + domain + '%'
  })
  .then(function checkForErrors (xml) {
    // Second step
    spinner.text = 'Parsing response'

    // Check for error codes
    return new Promise(
      function (resolve, reject) {
        // Check for access denied status code
        if (xml.openXML.reply[0].code[0] === '10005') {
          reject('Api access denied')
        }

        // Check if there is any data in the response
        if (xml.openXML.reply[0].data[0].results[0] === '') {
          reject('No results found')
        }

        resolve(xml.openXML.reply[0].data[0].results[0])
      }
    )
  })
  .then(function createTable (result) {
    // Last step
		spinner.text = 'done'
    spinner.succeed()

    // Delete unneeded data from array
    const items = result.array[0].item.map(
      function removeData (item) {
        delete item.id
        delete item.isSpamexpertsEnabled
        delete item.modificationDate
        delete item.resellerId
        delete item.isDeleted
        return item
      }
    )

    // Create a table displaying the data
    const tableHeadings = Object.keys(items[0])
    const table = new Table({
      head: Object.keys(items[0]),
      // Fill a new array with x times 19. Like: [19,19,19,19]
      colWidths: Array(tableHeadings.length).fill(19)
    })

    items.forEach(function (item) {
      table.push(objectValues(item))
    })

    console.log(table.toString())
  })
  .catch(function logError (error) {
    // Last step if there is an error.
		spinner.color = 'yellow'
		spinner.text = 'Error on lookup: ' + error
    spinner.fail()
  })
}

// Parse options given in cli
if (typeof process.argv[2] === 'undefined') {
  console.log('Invalid option given')
} else {
  const domain = process.argv[2]
  requestOpenprovider(domain)
}
