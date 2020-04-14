
const fetch = require('node-fetch')

const BASE_URL = 'https://in420rvwff.execute-api.eu-west-1.amazonaws.com/dev'

const uniqueElement = (value, index, self) => self.indexOf(value) === index
const first = a => a[0]
const cityToSlug = city => city.toLowerCase().replace(/\s/g, '_')

const trashTypes = {
  indiferenziato: '1',
  secco: '1',
  vegetale: '2',
  carta: '5',
  umido: '3',
  alluminio: '4',
  plastica: '4',
  vetro: '4'
}

const cityNeedZone = async (city) => {
  const url = `${BASE_URL}/zone/${cityToSlug(city)}`.toLowerCase()
  const response = await fetch(url)
  const data = await response.json()

  return data.length > 0
}

const findNext = async (city, what, zone) => {
  const url = `${BASE_URL}/svuotamenti/${cityToSlug(city)}?what=${trashTypes[what]}&zone=${zone}`.toLowerCase()
  const response = await fetch(url)
  const data = await response.json()
  return data[0]
}

const findByDate = async (date, city, zone) => {
  const url = `${BASE_URL}/svuotamenti/${cityToSlug(city)}?day=${date}&zone=${zone}`.toLowerCase()
  const response = await fetch(url)
  const data = await response.json()
  return data
    .map(svuotamento => svuotamento.svuotamenti)
    .flat()
    .filter(uniqueElement)
    .map(idRifiuto => {
      return Object
        .entries(trashTypes)
        .find(([nome, id]) => {
          return id === idRifiuto
        })
    })
    .map(first)
}

module.exports = {
  findByDate,
  findNext,
  cityNeedZone
}
