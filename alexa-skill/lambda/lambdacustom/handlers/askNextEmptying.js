const get = require('lodash.get')
const moment = require('moment')
const emptyings = require('../lib/emptyings')

const DEFAULT_ZONE = 'Cintura Urbana'

const getUserCity = async (handlerInput) => {
  const { permissions } = handlerInput.requestEnvelope.context.System.user
  if (!permissions) {
    return
  }

  const { deviceId } = handlerInput.requestEnvelope.context.System.device
  const deviceAddressServiceClient = handlerInput.serviceClientFactory.getDeviceAddressServiceClient()
  try {
    const address = await deviceAddressServiceClient.getFullAddress(deviceId)

    return address.city
  } catch (e) {

  }
}

module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'AskNextEmptying'
  },
  async handle (handlerInput) {
    let city = get(handlerInput, 'requestEnvelope.request.intent.slots.City.value', '')
    const zone = get(handlerInput, 'requestEnvelope.request.intent.slots.Zone.value', DEFAULT_ZONE)
    const what = get(handlerInput, 'requestEnvelope.request.intent.slots.What.value', '')

    if (!city) {
      const userCity = await getUserCity(handlerInput)
      if (!userCity) {
        return handlerInput.responseBuilder
          .speak('Non hai attivato i permessi per poter leggere il tuo indirizzo')
          .withAskForPermissionsConsentCard(['alexa::devices:all:address:full:read'])
          .getResponse()
      }

      city = userCity
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
