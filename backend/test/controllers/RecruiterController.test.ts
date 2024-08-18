import {
  getLogin,
  getNewPassword,
  getResetPassword,
  getSignup,
  postLogin,
  postLogout,
  postNewPassword,
  postResetpassword,
  postSignup,
  updateCandidateStatus,
} from '../../src/controllers/RecruiterController';

const mon = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Recruiter = require('../../src/models/Recruiter');
const Candidate = require('../../src/models/Candidate');
const AdverseAction = require('../../src/models/AdverseAction');
require('dotenv').config();

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../../src/models/Recruiter', () => ({
  findOne: jest.fn(),
}));

describe('Recruiter Controller', () => {
  let req: any,
    res: any,
    next: any,
    validationResult: any,
    Recruiter: any,
    bcrypt: any;

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

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password',
      },
      session: {},
      flash: jest.fn(),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };

    next = jest.fn();

    validationResult = require('express-validator').validationResult;
    Recruiter = require('../../src/models/Recruiter');
    bcrypt = require('bcryptjs');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => ['Validation error'],
    });

    await postLogin(req, res, next);

    expect(validationResult).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      path: '/recruiters/login',
      errorMessage: ['Validation error'],
    });
  });

  it('should handle invalid email or password', async () => {
    validationResult.mockReturnValueOnce({ isEmpty: () => true });

    Recruiter.findOne.mockResolvedValueOnce(null);

    await postLogin(req, res, next);

    expect(req.flash).toHaveBeenCalledWith(
      'error',
      'Invalid email or password.'
    );
    expect(res.redirect).toHaveBeenCalledWith('/recruiters/login');
  });

  it('should handle successful login', async () => {
    validationResult.mockReturnValueOnce({ isEmpty: () => true });

    const fakeRecruiter = {
      _id: '123',
      email: 'test@example.com',
      password: 'hashedPassword',
    };
    Recruiter.findOne.mockResolvedValueOnce(fakeRecruiter);

    bcrypt.compare.mockResolvedValueOnce(true);

    const mockSession = {
      isLoggedIn: true,
      recruiter: {
        _id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
      },
      save: jest.fn().mockImplementationOnce((callback) => {
        callback();
      }),
    };
    const req = {
      body: { email: 'test@example.com', password: 'password' },
      session: mockSession,
    };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    await postLogin(req, res, next);
    await new Promise((resolve) => process.nextTick(resolve));

    expect(req.session.isLoggedIn).toBe(true);
    expect(req.session.recruiter).toEqual(fakeRecruiter);
    expect(req.session.save).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/candidates');
  });

  it('should handle unsuccessful login', async () => {
    validationResult.mockReturnValueOnce({ isEmpty: () => true });

    Recruiter.findOne.mockResolvedValueOnce(null);

    const req = {
      body: { email: 'nonexistent@example.com', password: 'password' },
      session: {},
      flash: jest.fn(),
    };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    await postLogin(req, res, next);

    expect(req.flash).toHaveBeenCalledWith(
      'error',
      'Invalid email or password.'
    );
    expect(res.redirect).toHaveBeenCalledWith('/recruiters/login');
  });

  it('should handle validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => ['validation error'],
    });

    const req = { body: { email: 'invalid', password: '' }, session: {} };
    const res = { status: jest.fn().mockReturnValue({ json: jest.fn() }) };
    const next = jest.fn();

    await postLogin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.status().json).toHaveBeenCalledWith({
      path: '/recruiters/login',
      errorMessage: ['validation error'],
    });
  });

  it('should respond with JSON containing path and errorMessage when flash error message exists', () => {
    const req = { flash: jest.fn(() => ['Error message']) };
    const res = {
      json: jest.fn((responseData) => {
        expect(responseData).toEqual({
          path: '/recruiters/signup',
          errorMessage: ['Error message'],
        });
      }),
    };

    getSignup(req, res, null);

    expect(req.flash).toHaveBeenCalledWith('error');
    expect(res.json).toHaveBeenCalled();
  });

  it('should respond with JSON containing path and errorMessage when flash error message exists', () => {
    const req = { flash: jest.fn(() => ['Error message']) };
    const res = {
      json: jest.fn((responseData) => {
        expect(responseData).toEqual({
          path: '/recruiters/reset',
          errorMessage: ['Error message'],
        });
      }),
    };

    getResetPassword(req, res, null);

    expect(req.flash).toHaveBeenCalledWith('error');
    expect(res.json).toHaveBeenCalled();
  });

  it('should respond with JSON containing path and errorMessage when flash error message exists', () => {
    const req = { flash: jest.fn(() => ['Error message']) };
    const res = {
      json: jest.fn((responseData) => {
        expect(responseData).toEqual({
          path: '/recruiters/login',
          errorMessage: ['Error message'],
        });
      }),
    };

    getLogin(req, res, null);

    expect(req.flash).toHaveBeenCalledWith('error');
    expect(res.json).toHaveBeenCalled();
  });

  it('should destroy the session and redirect to /recruiters/login', () => {
    const req = {
      session: {
        destroy: jest.fn((callback) => {
          callback(null);
        }),
      },
    };
    const res = {
      redirect: jest.fn(),
    };
    const next = jest.fn();

    postLogout(req, res, next);

    expect(req.session.destroy).toHaveBeenCalled();

    expect(res.redirect).toHaveBeenCalledWith('/recruiters/login');

    expect(next).not.toHaveBeenCalled();
  });

  it('should sign up a recruiter', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => true,
      array: () => [],
    });

    const req = {
      body: {
        name: 'test',
        email: 'test@test.com',
        password: 'password123',
      },
      session: {
        isLoggedIn: true,
        recruiter: {
          email: 'test@test.com',
          password: 'password123',
        },
        save: jest.fn(),
      },
      flash: jest.fn(),
    };
    const res: any = {
      redirect: jest.fn(),
      status: jest.fn((res) => res),
    };
    const next = jest.fn();

    bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword123');

    req.session.save = jest.fn().mockResolvedValue({
      name: 'test',
      email: 'test@test.com',
      password: 'hashedPassword123',
    });

    await postSignup(req, res, next);

    expect(req.session.isLoggedIn).toBe(true);
  });

  it('should reset password successfully', async () => {
    const req = {
      body: {
        password: 'newPassword123',
        recruiterId: 'recruiterId',
        passwordToken: 'token',
      },
    };

    const res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const expectedResetTokenExpiration = expect.objectContaining({
      $gt: expect.any(Number),
    });
    const fakeRecruiter = {
      _id: 'recruiterId',
      resetToken: 'token',
      resetTokenExpiration: expectedResetTokenExpiration,
      save: jest.fn(),
      password: 'hashedPassword',
    };
    Recruiter.findOne.mockResolvedValueOnce(fakeRecruiter);

    bcrypt.hash.mockResolvedValueOnce('hashedPassword');

    const saveMock = jest.fn().mockResolvedValueOnce(fakeRecruiter);
    fakeRecruiter.save = saveMock;

    await postNewPassword(req, res, jest.fn());

    expect(Recruiter.findOne).toHaveBeenCalledWith({
      _id: 'recruiterId',
      resetToken: 'token',
      resetTokenExpiration: expectedResetTokenExpiration,
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
    expect(fakeRecruiter.password).toEqual('hashedPassword');
    expect(fakeRecruiter.resetToken).toBeDefined();
    expect(fakeRecruiter.resetTokenExpiration).toBeDefined();
  });

  it('should handle invalid token', async () => {
    const req = {
      body: {
        password: 'newPassword123',
        recruiterId: 'recruiterId',
        passwordToken: 'invalidToken',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const expectedResetTokenExpiration = expect.objectContaining({
      $gt: expect.any(Number),
    });

    Recruiter.findOne.mockResolvedValueOnce(null);

    await postNewPassword(req, res, jest.fn());

    expect(Recruiter.findOne).toHaveBeenCalledWith({
      _id: 'recruiterId',
      resetToken: 'invalidToken',
      resetTokenExpiration: expectedResetTokenExpiration,
    });
  });

  it('should generate a password reset token and save it to the database', async () => {
    const req = {
      body: {
        email: 'test@example.com',
      },
    };
    const res: any = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const mockRecruiter = {
      _id: 'recruiterId',
      resetToken: null,
      resetTokenExpiration: null,
      save: jest.fn().mockResolvedValueOnce('default'),
    };

    const mockBuffer = {
      toString: jest.fn().mockReturnValueOnce('passwordToken'),
    };

    const mockRandomBytes = jest
      .fn()
      .mockImplementationOnce((size, callback) => {
        callback(null, mockBuffer);
      });

    crypto.randomBytes = mockRandomBytes;

    Recruiter.findOne.mockResolvedValueOnce(mockRecruiter);

    await postResetpassword(req, res, null);

    expect(crypto.randomBytes).toHaveBeenCalledWith(32, expect.any(Function));
    expect(mockRecruiter.resetToken).toBe('passwordToken');
    expect(mockRecruiter.resetTokenExpiration).toBeGreaterThan(Date.now());
    expect(mockRecruiter.save).toHaveBeenCalled();
  });

  it('should update candidate status and create or update adverse action record', async () => {
    const req = {
      params: {
        recruiterId: 'recruiterId',
        candidateId: 'candidateId',
      },
      body: {
        actionType: 'pre-adverse',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockRecruiter = {
      _id: 'recruiterId',
    };

    const mockCandidate = {
      _id: 'candidateId',
      report: {
        adjudication: null,
        status: null,
      },
    };

    const mockAdverseAction = {
      _id: 'adverseActionId',
      pre_notice_date: new Date().toISOString(),
      post_notice_date: new Date().toISOString(),
      candidateId: 'candidateId',
      adjudication: 'Pre-adverse',
      status: 'Consider',
      save: jest.fn().mockResolvedValueOnce('default'),
    };

    const mockUpdateOne = jest.fn().mockResolvedValueOnce('default');

    const originalFindByIdRecruiter = Recruiter.findById;
    const originalFindByIdCandidate = Candidate.findById;
    const originalFindOneAdverseAction = AdverseAction.findOne;
    const originalUpdateOne = Candidate.updateOne;

    Recruiter.findById = jest.fn().mockResolvedValueOnce(mockRecruiter);
    Candidate.findById = jest.fn().mockResolvedValueOnce(mockCandidate);
    AdverseAction.findOne = jest.fn().mockResolvedValueOnce(null);
    Candidate.updateOne = mockUpdateOne;

    await updateCandidateStatus(req, res, null);

    expect(Recruiter.findById).toHaveBeenCalledWith('recruiterId');
    expect(Candidate.findById).toHaveBeenCalledWith('candidateId');
    expect(AdverseAction.findOne).toHaveBeenCalledWith({
      candidateId: 'candidateId',
    });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'candidateId' },
      {
        $set: {
          'report.adjudication': 'Pre-adverse',
          'report.status': 'Consider',
        },
      }
    );
    expect(AdverseAction.findOne).toHaveBeenCalledWith({
      candidateId: 'candidateId',
    });

    Recruiter.findById = originalFindByIdRecruiter;
    Candidate.findById = originalFindByIdCandidate;
    AdverseAction.findOne = originalFindOneAdverseAction;
    Candidate.updateOne = originalUpdateOne;
  });

  it('should update adjudication with engage', async () => {
    const req = {
      params: {
        recruiterId: 'recruiterId',
        candidateId: 'candidateId',
      },
      body: {
        actionType: 'engage',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockRecruiter = {
      _id: 'recruiterId',
    };

    const mockCandidate = {
      _id: 'candidateId',
      report: {
        adjudication: null,
        status: null,
      },
    };

    const mockAdverseAction = {
      _id: 'adverseActionId',
      pre_notice_date: new Date().toISOString(),
      post_notice_date: new Date().toISOString(),
      candidateId: 'candidateId',
      adjudication: 'Engage',
      status: 'Clear',
      save: jest.fn().mockResolvedValueOnce('default'),
    };

    const mockUpdateOne = jest.fn().mockResolvedValueOnce('default');

    const originalFindByIdRecruiter = Recruiter.findById;
    const originalFindByIdCandidate = Candidate.findById;
    const originalFindOneAdverseAction = AdverseAction.findOne;
    const originalUpdateOne = Candidate.updateOne;

    Recruiter.findById = jest.fn().mockResolvedValueOnce(mockRecruiter);
    Candidate.findById = jest.fn().mockResolvedValueOnce(mockCandidate);
    AdverseAction.findOne = jest.fn().mockResolvedValueOnce(null);
    Candidate.updateOne = mockUpdateOne;

    await updateCandidateStatus(req, res, null);

    expect(Recruiter.findById).toHaveBeenCalledWith('recruiterId');
    expect(Candidate.findById).toHaveBeenCalledWith('candidateId');
    expect(AdverseAction.findOne).toHaveBeenCalledWith({
      candidateId: 'candidateId',
    });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'candidateId' },
      {
        $set: {
          'report.adjudication': 'Engage',
          'report.status': 'Clear',
        },
      }
    );
    expect(AdverseAction.findOne).toHaveBeenCalledWith({
      candidateId: 'candidateId',
    });

    Recruiter.findById = originalFindByIdRecruiter;
    Candidate.findById = originalFindByIdCandidate;
    AdverseAction.findOne = originalFindOneAdverseAction;
    Candidate.updateOne = originalUpdateOne;
  });

  it('should render the new password page with correct data', async () => {
    const req = {
      params: {
        token: 'resetToken',
        recruiterId: 'recruiterId',
      },
      flash: jest.fn(() => ['Error message']),
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const resetTokenExpiration = new Date(Date.now() + 3600000);

    const mockRecruiter = {
      _id: 'recruiterId',
      resetToken: 'resetToken',
      resetTokenExpiration: resetTokenExpiration,
    };
    console.log(mockRecruiter);

    const originalFindOne = Recruiter.findOne;

    Recruiter.findOne = jest.fn().mockResolvedValueOnce(mockRecruiter);

    await getNewPassword(req, res, null);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      path: '/recruiters/new-password',
      errorMessage: ['Error message'],
      recruiterId: 'recruiterId',
    });

    Recruiter.findOne = originalFindOne;
  });
});
