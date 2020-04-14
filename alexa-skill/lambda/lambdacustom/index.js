const Alexa = require('ask-sdk-core')

const LaunchRequestHandler = require('./handlers/launch')
const ErrorHandler = require('./handlers/error')
const HelpIntentHandler = require('./handlers/help')
const AskNextEmptyingIntentHandler = require('./handlers/askNextEmptying')
const ExitIntentHandler = require('./handlers/exit')
const YesIntentHandler = require('./handlers/yes')
const DayEmptyingIntentHandler = require('./handlers/dayEmptying')
const StateInterceptor = require('./interceptors/state')

const skillBuilder = Alexa.SkillBuilders.custom()

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    AskNextEmptyingIntentHandler,
    YesIntentHandler,
    ExitIntentHandler,
    DayEmptyingIntentHandler
  )
  .addRequestInterceptors(
    StateInterceptor.Request
  )
  .addResponseInterceptors(
    StateInterceptor.Response
  )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda()
