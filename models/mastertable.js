const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.set("bufferTimeoutMS", 90000);


const mastertable = new mongoose.Schema({
  fileData: {
    required: false,
    type: 'string',
  }
});

const DOCxHTML = mongoose.model('html-content', mastertable);

module.exports = DOCxHTML;
