const CANCEL_INTENTS = [
  'AMAZON.CancelIntent',
  'AMAZON.NoIntent',
  'AMAZON.StopIntent'
]

const isSessionEndedRequest = handlerInput => handlerInput.requestEnvelope.request.type === 'SessionEndedRequest'
const isExitIntent = handlerInput => handlerInput.requestEnvelope.request.type === 'IntentRequest' && CANCEL_INTENTS.includes(handlerInput.requestEnvelope.request.intent.name)

const ExitHandler = {
  canHandle (handlerInput) {
    return isSessionEndedRequest(handlerInput) || isExitIntent(handlerInput)
  },
  handle (handlerInput) {
    const speechText = 'Ok alla prossima'

    return handlerInput.responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse()
  }
}

module.exports = ExitHandler
