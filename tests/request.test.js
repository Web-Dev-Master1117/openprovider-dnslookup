const Openprovider = require('../lib/openprovider')

const credentials = {
    username: process.env.OPENPROVIDERUSER,
    hash: process.env.OPENPROVIDERHASH
}

describe('Api calls', () => {
    it('should generate a valid request body', () => {
        const openprovider = new Openprovider({credentials})
        expect(openprovider.generateBody('<test></test>')).toBe(`
        <?xml version="1.0" encoding="UTF-8"?>
        <openXML>
          <credentials>
            <username>${credentials.username}</username>
            <hash>${credentials.hash}</hash>
          </credentials>
          <test></test>
        </openXML>
        `.trim())
    })

    it('should parse xml to cheerio', () => {
        const openprovider = new Openprovider({credentials})
        const $ = openprovider.parseXML('<body>test</body>')
        expect($('body').text()).toBe('test')
    })

    it('should throw on bad request', () => {
        const openprovider = new Openprovider({credentials})
        
        const code = 4001
        const reason = 'Wrong command name'
        const badXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <openXML>
            <reply>
                <code>${code}</code>
                <desc>${reason}</desc>
                <data></data>
            </reply>
        </openXML>
        `

        const $ = openprovider.parseXML(badXml)
        
        expect(() => {
            openprovider.validateError($)        
        }).toThrow(/Failed request with code: .*, reason: ..*/)
    })

    it('should get dns zones', async () => {
        const openprovider = new Openprovider({credentials})
        const zones = await openprovider.dnsZones('weprovide.com', {
            withRecords: 1
        })
        const zone = zones[0]
        
        expect(typeof zone.id).toBe('string')
        expect(typeof zone.records).toBe('object')
    })
})
