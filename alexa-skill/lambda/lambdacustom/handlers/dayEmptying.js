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
            handlerInput.requestEnvelope.request.intent.name === 'DayEmptyingIntent'
  },
  async handle (handlerInput) {
    let city = get(handlerInput, 'requestEnvelope.request.intent.slots.City.value', '')
    const zone = get(handlerInput, 'requestEnvelope.request.intent.slots.Zone.value', DEFAULT_ZONE)
    const date = get(handlerInput, 'requestEnvelope.request.intent.slots.Date.value', '')

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
