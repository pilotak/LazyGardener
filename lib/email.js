var logger = require('./logger')
var config = require('../config/config')
var util = require('util')
var email = require('nodemailer').createTransport(config.email)
var striptags = require('striptags')

module.exports = function (subject, text, html_enabled) {
  var mailOptions = {
    from: '"LazyGardener" <' + config.email.auth.user + '>',
    to: config.email.auth.user,
    subject: util.format('%s', subject),
    text: function () {
      if (!html_enabled) return JSON.stringify(text)
      else striptags(text)
    },
    enabled: function () {
      return html_enabled
    }
  }

  email.sendMail(mailOptions, function (error, info) {
    if (!error) {
      logger.info('EMAIL', 'Sent: ' + info.response)
    } else {
      logger.error('EMAIL', 'Error when sending: ' + error)
    }
  })
}
