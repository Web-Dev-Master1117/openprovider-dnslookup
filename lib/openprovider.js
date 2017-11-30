const fetch = require('node-fetch')
const cheerio = require('cheerio')

module.exports = class Openprovider {
    constructor({credentials}) {
        this.credentials = credentials
    }

    parseXML(xml) {
        return cheerio.load(xml, {xmlMode: true})
    }

    generateBody(body) {
        const {username, hash} = this.credentials
        return `
        <?xml version="1.0" encoding="UTF-8"?>
        <openXML>
          <credentials>
            <username>${username}</username>
            <hash>${hash}</hash>
          </credentials>
          ${body}
        </openXML>
        `.trim()
    }

    validateError($) {
        const code = parseInt($('openXML > reply > code').text())
        if(code !== 0) {
            const reason = $('openXML > reply > desc').text()
            throw new Error(`Failed request with code: ${code}, reason: ${reason}`)
        }
    }
    
    async fetch(body) {
        const res = await fetch('https://api.openprovider.eu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml'
            },
            body: this.generateBody(body)
        })

        const text = await res.text() 
        const $ = this.parseXML(text)

        this.validateError($)
        
        return $
    }
    
    async dnsZones(name, options = {}) {
        const args = []
        for(const option in options) {
            args.push(`<${option}>${options[option]}</${option}>`)
        }
        const $ = await this.fetch(`
            <searchZoneDnsRequest>
                <namePattern>%${name}%</namePattern>
                ${args.join('')}
            </searchZoneDnsRequest>
        `)

        return this.toJson($, $('openXML > reply > data > results'))
    }

    toJson($, $selected) {
        function convertElement(element) {
            const result = []
            // console.log($(element).children('array').children('item').length)
            $(element).children('array').children('item').each((index, element) => {
                const item = {}
                $(element).children().each((index, element) => {
                    const $element = $(element)
                    const children = $element.children('array')
                    const value = children.length > 0 ? convertElement(element) : $element.text()
                    item[$element.prop('tagName').toLowerCase()] = value
                })

                result.push(item)
            })

            return result
        }

        return convertElement($selected)
    }
}
