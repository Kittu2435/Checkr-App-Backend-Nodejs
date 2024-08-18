const Candidate = require('../models/Candidate');

export const getCandidates = async (req: any, res: any, next: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const recruiterId = req.session.recruiter._id;

    const candidates = await Candidate.find({ recruiterId })
      .skip(skip)
      .limit(limit);

    const totalCandidates = await Candidate.countDocuments({ recruiterId });

    return res.json({ candidates, totalCandidates });
  } catch (error) {
    next(error);
  }
};

export const getCandidateById = async (req: any, res: any, next: any) => {
  try {
    const candidateId = req.params.candidateId;
    const recruiterId = req.session.recruiter._id;

    const candidate = await Candidate.findOne({
      _id: candidateId,
      recruiterId,
    });

    if (candidate) {
      return res.json(candidate);
    } else {
      return res.status(404).json({ error: 'Candidate not found' });
    }
  } catch (error) {
    console.error('Error in getCandidateById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReportByCandidateId = async (req: any, res: any, next: any) => {
  const candidateId = req.params.candidateId;
  const recruiterId = req.session.recruiter._id;

  try {
    const candidate = await Candidate.findOne({
      _id: candidateId,
      recruiterId,
    });
    if (candidate) {
      return res.json(candidate.report);
    } else {
      return res.status(404).json({ error: 'Report not found' });
    }
  } catch (error) {
    next(error);
  }
};

export const getCourtSearchesByCandidateId = async (
  req: any,
  res: any,
  next: any
) => {
  const candidateId = req.params.candidateId;
  const recruiterId = req.session.recruiter._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const candidate = await Candidate.findOne({
      _id: candidateId,
      recruiterId,
    });
    if (!candidate) {
      return res
        .status(404)
        .json({ error: 'Candidate Court Searches not found' });
    }

    const searches = candidate.searches.slice(skip, skip + limit);
    const totalCourtSearches = candidate.searches.length;

    return res.json({ searches, totalCourtSearches });
  } catch (error) {
    next(error);
  }
};
