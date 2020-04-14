const getState = handlerInput => {
  const session = handlerInput.attributesManager.getSessionAttributes()
  if (session && session.state) {
    return session.state
  }

  return { }
}

const StateInterceptor = {
  Request: {
    process (handlerInput) {
      const state = getState(handlerInput)
      handlerInput.state = state
    }
  },
  Response: {
    process (handlerInput) {
      const state = handlerInput.state || {}
      handlerInput.attributesManager.setSessionAttributes({ state })
    }
  }
}

module.exports = StateInterceptor
