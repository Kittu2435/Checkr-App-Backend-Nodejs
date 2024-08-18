const mongoose = require('mongoose');

const { Schema } = mongoose;

const AdverseActionSchema = new Schema({
  pre_notice_date: {
    type: Date,
    required: true,
  },
  post_notice_date: {
    type: Date,
    required: true,
  },
  adjudication: {
    type: String,
    enum: ['Engage', 'Pre-adverse'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Pending'],
    required: true,
  },
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
});

module.exports = mongoose.model('AdverseAction', AdverseActionSchema);
