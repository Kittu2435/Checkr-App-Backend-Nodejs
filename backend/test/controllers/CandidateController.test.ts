import {
  getCandidateById,
  getCandidates,
  getCourtSearchesByCandidateId,
  getReportByCandidateId,
} from '../../src/controllers/CandidateController';

const mon = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Candidate = require('../../src/models/Candidate');
require('dotenv').config();
describe('Candidates controller', () => {
  let mongod: any;
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mon.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }, 10000);

  afterAll(async () => {
    await mon.disconnect();
    await mongod.stop();
  }, 10000);

  it('should return candidates for a recruiter', async () => {
    const req = {
      query: {
        page: '1',
        limit: '10',
      },
      session: {
        recruiter: {
          _id: '66192d92901da6beb75e27a5',
        },
      },
    };
    const res = {
      json: jest.fn((data) => data),
    };
    const next = jest.fn();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const recruiterId = req.session.recruiter._id;

    const candidates = await Candidate.find({ recruiterId })
      .skip(skip)
      .limit(limit);

    const totalCandidates = await Candidate.countDocuments({ recruiterId });

    const result = await getCandidates(req, res, next);

    const expectedResponse = { candidates, totalCandidates };

    expect(result).toEqual(expectedResponse);
  });

  it('should return report for existing candidate', async () => {
    const req = {
      params: {
        candidateId: 'candidateId',
      },
      session: {
        recruiter: {
          _id: 'recruiterId',
        },
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    const candidateWithReport = {
      report: {},
    };
    const findOneMock = jest.fn().mockResolvedValueOnce(candidateWithReport);
    const Candidate = require('../../src/models/Candidate');
    Candidate.findOne = findOneMock;

    await getReportByCandidateId(req, res, jest.fn());

    expect(Candidate.findOne).toHaveBeenCalledWith({
      _id: 'candidateId',
      recruiterId: 'recruiterId',
    });
    expect(res.json).toHaveBeenCalledWith(candidateWithReport.report);
  });

  it('should handle candidate not found', async () => {
    const req = {
      params: {
        candidateId: 'candidateId',
      },
      session: {
        recruiter: {
          _id: 'recruiterId',
        },
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    const findOneMock = jest.fn().mockResolvedValueOnce(null);
    const Candidate = require('../../src/models/Candidate');
    Candidate.findOne = findOneMock;

    await getReportByCandidateId(req, res, jest.fn());

    expect(Candidate.findOne).toHaveBeenCalledWith({
      _id: 'candidateId',
      recruiterId: 'recruiterId',
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Report not found' });
  });

  it('should handle error', async () => {
    const req = {
      params: {
        candidateId: 'candidateId',
      },
      session: {
        recruiter: {
          _id: 'recruiterId',
        },
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    const error = new Error('Database error');
    const findOneMock = jest.fn().mockRejectedValueOnce(error);
    const Candidate = require('../../src/models/Candidate');
    Candidate.findOne = findOneMock;

    const next = jest.fn();

    await getReportByCandidateId(req, res, next);

    expect(Candidate.findOne).toHaveBeenCalledWith({
      _id: 'candidateId',
      recruiterId: 'recruiterId',
    });
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should return candidate court searches By Candidate Id', async () => {
    const req = {
      query: {
        page: '1',
        limit: '10',
      },
      params: {
        candidateId: '661bd87dc955bfb413231e1e',
      },
      session: {
        recruiter: {
          _id: '66192d92901da6beb75e27a5',
        },
      },
    };

    const res: any = {
      json: jest.fn((data) => data),
      status: jest.fn().mockReturnThis(),
    };

    const next = jest.fn();

    const recruiterId = req.session.recruiter._id;

    const expectedCandidate = await Candidate.findOne({
      _id: req.params.candidateId,
      recruiterId: recruiterId,
    });

    if (!expectedCandidate) {
      const expectedErrorMessage = {
        error: 'Candidate Court Searches not found',
      };
      const result = await getCourtSearchesByCandidateId(req, res, next);
      expect(result).toEqual(expectedErrorMessage);
      expect(res.status).toHaveBeenCalledWith(404);
      return;
    }

    const searches = expectedCandidate.searches;
    const totalCourtSearches = searches.length;

    const expectedResponse = { searches, totalCourtSearches };

    const result = await getCourtSearchesByCandidateId(req, res, next);

    expect(result).toEqual(expectedResponse);
  });

  it('should return 404 error when candidate does not exist', async () => {
    const req = {
      params: {
        candidateId: '456',
      },
      session: {
        recruiter: {
          _id: 'recruiterId',
        },
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    Candidate.findOne.mockResolvedValueOnce(null);

    await getCandidateById(req, res, jest.fn());

    expect(Candidate.findOne).toHaveBeenCalledWith({
      _id: '456',
      recruiterId: 'recruiterId',
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Candidate not found' });
  });

  it('should handle internal server error', async () => {
    const req = {
      params: {
        candidateId: '789',
      },
      session: {
        recruiter: {
          _id: 'recruiterId',
        },
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    Candidate.findOne.mockRejectedValueOnce(new Error('Database error'));

    await getCandidateById(req, res, jest.fn());

    expect(Candidate.findOne).toHaveBeenCalledWith({
      _id: '789',
      recruiterId: 'recruiterId',
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('should handle candidate not found', async () => {
    const req = {
      params: {
        candidateId: 'candidateId',
      },
      session: {
        recruiter: {
          _id: 'recruiterId',
        },
      },
      query: {
        page: '1',
        limit: '10',
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    const findOneMock = jest.fn().mockResolvedValueOnce(null);
    const Candidate = require('../../src/models/Candidate');
    Candidate.findOne = findOneMock;

    await getCourtSearchesByCandidateId(req, res, jest.fn());

    expect(Candidate.findOne).toHaveBeenCalledWith({
      _id: 'candidateId',
      recruiterId: 'recruiterId',
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Candidate Court Searches not found',
    });
  });

  it('should handle error', async () => {
    const req = {
      params: {
        candidateId: 'candidateId',
      },
      session: {
        recruiter: {
          _id: 'recruiterId',
        },
      },
      query: {
        page: '1',
        limit: '10',
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    const error = new Error('Database error');
    const findOneMock = jest.fn().mockRejectedValueOnce(error);
    const Candidate = require('../../src/models/Candidate');
    Candidate.findOne = findOneMock;

    const next = jest.fn();

    await getCourtSearchesByCandidateId(req, res, next);

    expect(Candidate.findOne).toHaveBeenCalledWith({
      _id: 'candidateId',
      recruiterId: 'recruiterId',
    });
    expect(next).toHaveBeenCalledWith(error);
  });
  it('should return court searches and total count', async () => {
    const req = {
      params: {
        candidateId: '123',
      },
      session: {
        recruiter: {
          _id: '456',
        },
      },
      query: {
        page: '1',
        limit: '2',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const candidateId = req.params.candidateId;
    const recruiterId = req.session.recruiter._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const candidate = {
      _id: candidateId,
      recruiterId: recruiterId,
      searches: [
        { courtSearch: 'Search 1' },
        { courtSearch: 'Search 2' },
        { courtSearch: 'Search 3' },
      ],
    };

    jest.spyOn(Candidate, 'findOne').mockResolvedValueOnce(candidate);

    await getCourtSearchesByCandidateId(req, res, next);

    const expectedSearches = candidate.searches.slice(skip, skip + limit);
    const expectedTotalCourtSearches = candidate.searches.length;

    expect(res.json).toHaveBeenCalledWith({
      searches: expectedSearches,
      totalCourtSearches: expectedTotalCourtSearches,
    });
  });
});
