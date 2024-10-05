const mongoose = require('mongoose');

const notificatioinsSchema = new mongoose.Schema({
  title: String,
  description: String,
  icon: String,
  createdAt: Date,
});

const Notifications = mongoose.model('Notifications', notificatioinsSchema);

module.exports = Notifications;