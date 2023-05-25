const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const mastertable = new mongoose.Schema({
  fileData: {
    required: true,
    type: 'string',
  }
});

const Portal = mongoose.model('portal', mastertable);

module.exports = Portal;
