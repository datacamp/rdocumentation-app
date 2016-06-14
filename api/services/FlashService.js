// FlashService.js
module.exports = {
  success: function(req, message) {
    req.session.messages['success'].push(message);
  },
  warning: function(req, message) {
    req.session.messages['warning'].push(message);
  },
  error: function(req, message) {
    req.session.messages['error'].push(message);
  }
};
