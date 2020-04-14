const get = require('lodash.get')
const moment = require('moment')
const emptyings = require('../lib/emptyings')

const DEFAULT_CITY = 'treviso'
const DEFAULT_ZONE = 'Cintura Urbana'

module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'AskNextEmptying'
  },
  async handle (handlerInput) {
    let city = get(handlerInput, 'requestEnvelope.request.intent.slots.City.value', '')
    let zone = get(handlerInput, 'requestEnvelope.request.intent.slots.Zone.value', '')
    const what = get(handlerInput, 'requestEnvelope.request.intent.slots.What.value', '')

    if (!city) {
      city = DEFAULT_CITY
      zone = zone || DEFAULT_ZONE
    }

    const isZoneNeeded = await emptyings.cityNeedZone(city)

    if (!what) {
      return handlerInput.responseBuilder
        .speak('Vuoi conoscere il prossimo svuotamento di quale rifiuto?')
        .addElicitSlotDirective('What')
        .getResponse()
    }

    if (isZoneNeeded && !zone) {
      return handlerInput.responseBuilder
        .speak('Per quale zona?')
        .addElicitSlotDirective('Zone')
        .getResponse()
    }

    const emptying = await emptyings.findNext(city, what, zone)

    if (!emptying) {
      const text = `<speak>
        Non abbiamo trovato uno svuotamento di ${what} a ${city}
      </speak>`

      return handlerInput.responseBuilder
        .speak(text)
        .getResponse()
    }

    const day = moment(emptying.giorno, 'YYYY-MM-DD').format('MMDD')
    const dayOfWeek = moment(emptying.giorno, 'YYYY-MM-DD').locale('it').format('dddd')
    const zoneMessage = isZoneNeeded ? `in zona ${zone}` : ''

    const text = `<speak>
      Il prossimo ritiro di ${what} ${zoneMessage} sarà ${dayOfWeek}
      <say-as interpret-as="date">????${day}</say-as>. Vuoi impostare un promemoria per il giorno prima?
    </speak>`

    handlerInput.state = {
      what,
      when: emptying.giorno
    }

    return handlerInput.responseBuilder
      .speak(text)
      .reprompt('Vuoi impostare un promemoria per il giorno prima?')
      .getResponse()
  }
}
