const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema(
  {
    clickId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    shortCode: {
      type: String,
      required: true,
      index: true,
    },

    timestamp: {
      type: Date,
      required: true,
    },

    ip: {
      type: String,
    },

    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Click", clickSchema);