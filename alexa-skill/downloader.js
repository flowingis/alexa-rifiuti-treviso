const fetch = require('node-fetch')
const get = require('lodash.get')
const set = require('lodash.set')
const fs = require('fs')
const path = require('path')
const secrets = require('./secrets.json')

const interactionModel = require('./skill-package/interactionModels/custom/it-IT.json')

const UniqueBy = path => (value, index, self) => {
  const currentValue = get(value, path)
  return !self.find(element => get(element, path) === currentValue)
}

const updateInteractionModel = dizionario => {
  const types = get(interactionModel, 'interactionModel.languageModel.types', [])
  const typesWithoutDizionario = types.filter(type => {
    return type.name !== 'Rifiuti'
  })

  const typeDizionario = {
    name: 'Rifiuti',
    values: dizionario
      .filter(UniqueBy('titolo'))
      .map(entry => {
        return {
          id: entry.id + '',
          name: {
            value: entry.titolo
          }
        }
      })
  }

  set(interactionModel, 'interactionModel.languageModel.types', [...typesWithoutDizionario, typeDizionario])

  const data = JSON.stringify(interactionModel, null, 2)

  fs.writeFileSync(path.join('skill-package', 'interactionModels', 'custom', 'it-IT.json'), data, 'utf8')
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

  updateInteractionModel(mapped)

  fs.writeFileSync(path.join('lambda', 'lambdacustom', 'dizionario.json'), JSON.stringify(mapped), 'utf8')
}

(async () => {
  await writeDataDizionario()
})()
