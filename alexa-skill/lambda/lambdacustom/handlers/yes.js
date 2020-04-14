const moment = require('moment')

const HelpIntentHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
  },
  handle (handlerInput) {
    const remindersApiClient = handlerInput.serviceClientFactory.getReminderManagementServiceClient()
    const { permissions } = handlerInput.requestEnvelope.context.System.user

    if (!permissions) {
      return handlerInput.responseBuilder
        .speak('Non hai attivato i permessi per poter creare dei promemoria')
        .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
        .getResponse()
    }

    const { what, when } = handlerInput.state

    const paredWhat = Array.isArray(what) ? what.join(', ') : what

    const text = `Portare fuori ${paredWhat}`

    const scheduledTimeMoment = moment(when, 'YYYY-MM-DD').startOf('day').subtract(1, 'day').add(17, 'hours')

    const reminderRequest = {
      trigger: {
        type: 'SCHEDULED_ABSOLUTE',
        scheduledTime: scheduledTimeMoment.format('YYYY-MM-DDTHH:mm:ss')
      },
      alertInfo: {
        spokenInfo: {
          content: [{
            locale: 'it-IT',
            text
          }]
        }
      },
      pushNotification: {
        status: 'ENABLED'
      }
    }

    remindersApiClient.createReminder(reminderRequest)

    const speechText = `Promemoria impostato per ${scheduledTimeMoment.locale('it-IT').format('dddd, DD MMMM [alle] HH')}`

    return handlerInput.responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse()
  }
}

module.exports = HelpIntentHandler
