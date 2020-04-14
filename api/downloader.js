const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const sort = require('lodash.sortby')
const secrets = require('./secrets.json')

const downloadSvuotamenti = async () => {
  const r = await fetch(secrets.URL_SVUOTAMENTI)
  const data = await r.json()
  return data
}

const downloadComuni = async () => {
  const r = await fetch(secrets.URL_COMUNI)
  const data = await r.json()
  return data
}

const downloadZone = async () => {
  const r = await fetch(secrets.URL_ZONE)
  const data = await r.json()
  return data
}

const getSvuotamenti = s => {
  try {
    return JSON.parse(s.svuotamenti)
  } catch (e) {
    return []
  }
}

const writeDatiSvuotamenti = async () => {
  const svuotamenti = await downloadSvuotamenti()
  const comuni = await downloadComuni()
  const zone = await downloadZone()

  const mapped = svuotamenti
    .map(s => {
      const zona = zone.find(z => z.id === s.id_refer)
      let comune
      if (zona) {
        comune = comuni.find(c => c.cod_istat === zona.comune_id)
      }
      return {
        ...s,
        svuotamenti: getSvuotamenti(s),
        zona: zona ? zona.zona : '',
        comune: comune ? comune.comune : ''
      }
    })
    .filter(s => s.svuotamenti.length > 0)
    .filter(s => s.comune)
    .reduce((acc, svuotamento) => {
      if (!acc[svuotamento.comune]) {
        acc[svuotamento.comune] = []
      }

      acc[svuotamento.comune].push(svuotamento)

      return acc
    }, {})

  Object.keys(mapped).forEach(comune => {
    const nomeFile = `${comune.toLowerCase().replace(/\s/g, '_')}.json`
    const data = JSON.stringify(sort(mapped[comune], 'giorno'), null, 2)
    fs.writeFileSync(path.join('src', 'data', nomeFile), data, 'utf8')
  })
}

(async () => {
  await writeDatiSvuotamenti()
})()
