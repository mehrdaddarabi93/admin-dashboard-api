const mongoose = require("mongoose");

/**
 * بررسی معتبر بودن ObjectId
 *
 * @param {String} id
 * @returns {Boolean}
 */
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = validateObjectId;
