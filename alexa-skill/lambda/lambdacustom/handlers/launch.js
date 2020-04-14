const LaunchRequestHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
  },
  handle (handlerInput) {
    const speechText = 'Benvenuto nella skill di Contarina. Puoi chiedermi quando ci sarà il prossimo ritiro di rifiuti nel tuo comune.'

    return handlerInput.responseBuilder
      .speak(speechText)
      .withShouldEndSession(false)
      .getResponse()
  }
}

module.exports = LaunchRequestHandler
