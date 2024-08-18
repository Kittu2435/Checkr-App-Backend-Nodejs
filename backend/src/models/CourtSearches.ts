import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const courtSearchesSchema = new Schema({
  search: String,
  status: String,
  date: Date,
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
});

module.exports = mongoose.model('CourtSearch', courtSearchesSchema);
