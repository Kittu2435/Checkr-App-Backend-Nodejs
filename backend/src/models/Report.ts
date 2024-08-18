import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const reportSchema = new Schema({
  status: {
    type: String,
    enum: ['Clear', 'Consider'],
    required: true,
  },
  adjudication: String,
  package: String,
  createdAt: Date,
  completedData: Date,
  turnAroundTime: String,
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
});

module.exports = mongoose.model('Report', reportSchema);
