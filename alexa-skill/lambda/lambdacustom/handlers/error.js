const ErrorHandler = {
  canHandle () {
    return true
  },
  handle (handlerInput, error) {
    console.log(`Error handled: ${error.message}`)

    handlerInput.attributesManager.setSessionAttributes({
      error: error.message
    })

    return handlerInput.responseBuilder
      .speak('Scusa non sono riuscita a capire il comando, ripeti per favore.')
      .reprompt('Scusa non sono riuscita a capire il comando, ripeti per favore.')
      .getResponse()
  }
}

module.exports = ErrorHandler
