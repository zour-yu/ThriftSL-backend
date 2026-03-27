const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
{
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },

  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },

  description: { 
    type: String, 
    default: '' 
  },

  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },

  images: [
    {
      type: String
    }
  ],

  negotiable: { 
    type: Boolean, 
    default: false 
  },

  swappable: { 
    type: String, 
    default: 'no' 
  },

  contactNumber: { 
    type: String,
    required: true,
    trim: true
  },

  category: {                   
    type: String,
    required: true,
    enum: [
      "electronics",
      "fashion",
      "vehicles",
      "books",
      "home",
      "other"
    ]
  },

  postDate: { 
    type: Date, 
    default: Date.now 
  }

},
{ timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
