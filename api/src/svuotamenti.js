'use strict'

const get = require('lodash.get')
const { serializeError } = require('serialize-error')
const moment = require('moment')

module.exports.list = async event => {
  try {
    const city = get(event, 'pathParameters.city')
    const zone = get(event, 'queryStringParameters.zone')
    const day = get(event, 'queryStringParameters.day')
    const what = get(event, 'queryStringParameters.what')

    const data = require(`./data/${city}.json`)

    const now = moment()

    const svuotamenti = data
      .filter(svuotamento => {
        const mGiorno = moment(svuotamento.giorno, 'YYYY-MM-DD')
        return mGiorno.isAfter(now, 'day')
      })
      .filter(svuotamento => {
        if (!zone) {
          return true
        }

        return svuotamento.zona.toLowerCase() === zone.toLowerCase()
      })
      .filter(svuotamento => {
        if (!day) {
          return true
        }

        return svuotamento.giorno === day
      })
      .filter(svuotamento => {
        if (!what) {
          return true
        }

        return svuotamento.svuotamenti.includes(what)
      })
      .map(({ giorno, svuotamenti }) => ({ giorno, svuotamenti }))

    return {
      statusCode: 200,
      body: JSON.stringify(
        svuotamenti,
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
