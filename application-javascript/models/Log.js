const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
});

module.exports = mongoose.model('Log', logSchema);