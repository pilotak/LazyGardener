var logger = require('../lib/logger')
var config = require('../config/config')
var util   = require('util')
var email  = require('nodemailer').createTransport(config.push_messages.email.settings)

var mailOptions = {
    from: config.push_messages.email.settings.auth.user,
    to: config.push_messages.email.settings.auth.user,
    subject: '',
    text: '',
    html: ''
};

/*new cron(config.push_messages.email.interval, function(){
    mailOptions.html = util.format("Baterie sensoru '%d' jsou téměř vybité: %d V", sensor_id, voltage);
      email.sendMail(mailOptions, function(error, info){
          if(!error){
              logger("info", 'Message sent: ' + info.response);
          }
          else{
              logger("err", "Error when sending email: "+error);
          }
      });
}, null, true);*/