#!/usr/bin/env node
const chalk = require('chalk')
const table = require('text-table')
const ms = require('ms')
const arg = require('arg')
const Openprovider = require('../lib/openprovider')

function strlen(str) {
    return str.replace(/\u001b[^m]*m/g, '').length
}

function indent(text, n) {
    return text.split('\n').map(l => ' '.repeat(n) + l).join('\n')
}

const credentials = {
    username: process.env.OPENPROVIDERUSER,
    hash: process.env.OPENPROVIDERHASH
}

const openprovider = new Openprovider({credentials})

const args = arg({
    '--no-records':    Boolean
});

const text = []
async function run() {
    const text = []
    const domains = await openprovider.dnsZones(args['_'], {
        withRecords: 1
    })

    domains.forEach((domain) => {
        let out = ''
        if(!args['--no-records'] && domain.records) {
            const header = ['', 'name', 'type', 'value'].map(s => chalk.dim(s))
            const data = [header]
            out = table(
                data.concat(
                    domain.records.map(record => [
                    '',
                    record.name,
                    record.type,
                    record.value
                    ])
                ),
                {
                align: ['l', 'l', 'l', 'l', 'l', 'l'],
                hsep: ' '.repeat(2),
                stringLength: strlen
                }
            )
        }
        
        text.push(`\n\n${chalk.bold(domain.name)} - ${domain.type} - ${domain.ip}${out ? '\n' + indent(out, 2) : ''}`)
    
    })

    console.log(text.join(''))
}

run()