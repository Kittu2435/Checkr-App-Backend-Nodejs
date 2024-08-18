import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const candidateSchema = new Schema({
  name: String,
  email: String,
  dob: String,
  phoneNumber: String,
  location: String,
  date: String,
  zipcode: String,
  socialSecurity: String,
  driversLicense: String,
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
  report: { type: Object, ref: 'Report' },
  searches: [{ type: Object, ref: 'CourtSearch' }],
});

module.exports = mongoose.model('Candidate', candidateSchema);
