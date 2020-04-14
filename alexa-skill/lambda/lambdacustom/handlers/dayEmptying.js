const get = require('lodash.get')
const moment = require('moment')
const emptyings = require('../lib/emptyings')

const DEFAULT_CITY = 'treviso'
const DEFAULT_ZONE = 'Cintura Urbana'

module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'DayEmptyingIntent'
  },
  async handle (handlerInput) {
    let city = get(handlerInput, 'requestEnvelope.request.intent.slots.City.value', '')
    let zone = get(handlerInput, 'requestEnvelope.request.intent.slots.Zone.value', '')
    const date = get(handlerInput, 'requestEnvelope.request.intent.slots.Date.value', '')

    if (!city) {
      city = DEFAULT_CITY
      zone = zone || DEFAULT_ZONE
    }

    const isZoneNeeded = await emptyings.cityNeedZone(city)

    if (isZoneNeeded && !zone) {
      return handlerInput.responseBuilder
        .speak('Per quale zona?')
        .addElicitSlotDirective('Zone')
        .getResponse()
    }

    const list = await emptyings.findByDate(date, city, zone)

    const day = moment(date, 'YYYY-MM-DD').format('MMDD')
    const dayOfWeek = moment(date, 'YYYY-MM-DD').locale('it').format('dddd')

    if (list.length === 0) {
      const text = `<speak>
      Non sono previsti svuotamenti per ${dayOfWeek} <say-as interpret-as="date">????${day}</say-as>
    </speak>`

      return handlerInput.responseBuilder
        .speak(text)
        .reprompt('Vuoi impostare un promemoria per il giorno prima?')
        .getResponse()
    }

    const text = `<speak>
      Per ${dayOfWeek} <say-as interpret-as="date">????${day}</say-as> sono previsti gli svuotamenti di ${list.join(', ')}. Vuoi impostare un promemoria per il giorno prima?
    </speak>`

    handlerInput.state = {
      what: list,
      when: date
    }

    return handlerInput.responseBuilder
      .speak(text)
      .reprompt('Vuoi impostare un promemoria per il giorno prima?')
      .getResponse()
  }
}
