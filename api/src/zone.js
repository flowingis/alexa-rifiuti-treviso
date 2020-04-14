'use strict'

const get = require('lodash.get')
const { serializeError } = require('serialize-error')

const uniqueElement = (value, index, self) => self.indexOf(value) === index
const exists = x => Boolean(x)

module.exports.list = async event => {
  try {
    const city = get(event, 'pathParameters.city')

    const data = require(`./data/${city}.json`)

    const zone = data
      .map(svuotamento => svuotamento.zona)
      .filter(exists)
      .filter(uniqueElement)

    return {
      statusCode: 200,
      body: JSON.stringify(
        zone,
        null,
        2
      )
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(
        serializeError(e),
        null,
        2
      )
    }
  }
}
