import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const recruiterSchema = new Schema({
  name: String,
  email: String,
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
});

module.exports = mongoose.model('Recruiter', recruiterSchema);
