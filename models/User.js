const mongoose = require('mongoose');

const User = mongoose.model('User', {
    userName: String,
    email: String,
    password: String
});

module.exports = User;