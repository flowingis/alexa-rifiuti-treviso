const fetch = require('node-fetch')
const sort = require('lodash.sortby')
const get = require('lodash.get')
const fs = require('fs')
const path = require('path')
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

const downloadDizionario = async () => {
  const r = await fetch(secrets.URL_DIZIONARIO)
  const data = await r.json()
  return data
}

const downloadTipoContenitori = async () => {
  const r = await fetch(secrets.URL_CONTENITORI)
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

const getContenitore = (voceDizionario, contenitori) => {
  try {
    const dati = JSON.parse(voceDizionario.contenitore)
    const idContenitore = dati[0]
    const contenitore = contenitori.find(c => c.id === idContenitore)
    return get(contenitore, 'titolo')
  } catch (e) {
    return undefined
  }
}

const writeDataDizionario = async () => {
  const dizionario = await downloadDizionario()
  const tipiContenitori = await downloadTipoContenitori()

  const mapped = dizionario
    .map(d => {
      return {
        id: parseInt(d.id, 10),
        titolo: d.titolo,
        contenitore: getContenitore(d, tipiContenitori)
      }
    }).filter(d => d.contenitore)

  fs.writeFileSync(path.join('lambda', 'lambdacustom', 'dizionario.json'), JSON.stringify(mapped), 'utf8')
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
    }).filter(s => s.svuotamenti.length > 0)

  const data = JSON.stringify(sort(mapped, 'giorno'))

  fs.writeFileSync(path.join('lambda', 'lambdacustom', 'svuotamenti.json'), data, 'utf8')
}

(async () => {
  await writeDataDizionario()
  await writeDatiSvuotamenti()
})()
