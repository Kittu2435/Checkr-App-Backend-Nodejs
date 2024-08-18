const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Recruiter = require('../models/Recruiter');
const Candidate = require('../models/Candidate');
const Report = require('../models/Report');
const AdverseAction = require('../models/AdverseAction');

const { validationResult } = require('express-validator');

export const getLogin = (req: any, res: any, next: any) => {
  const responseData = {
    path: '/recruiters/login',
    errorMessage: req.flash('error'),
  };
  res.json(responseData);
};

export const getSignup = (req: any, res: any, next: any) => {
  const responseData = {
    path: '/recruiters/signup',
    errorMessage: req.flash('error'),
  };
  res.json(responseData);
};

export const postLogin = (req: any, res: any, next: any) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const responseData = {
      path: '/recruiters/login',
      errorMessage: errors.array(),
    };
    return res.status(422).json(responseData);
  }
  Recruiter.findOne({ email: email })
    .then((recruiter: any) => {
      if (!recruiter) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/recruiters/login');
      }
      bcrypt
        .compare(password, recruiter.password)
        .then((doMatch: any) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.recruiter = recruiter;
            return req.session.save((err: any) => {
              console.log(err);
              res.redirect('/candidates');
            });
          }
          req.flash('error', 'Invalid email or password.');
          res.redirect('/recruiters/login');
        })
        .catch((err: any) => {
          return console.log(err);
        });
    })
    .catch((err: any) => console.log(err));
};

export const postSignup = (req: any, res: any, next: any) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const responseData = {
      path: '/recruiters/signup',
      errorMessage: errors.array(),
    };
    return res.status(422).json(responseData);
  }
  bcrypt
    .hash(password, 12)
    .then((hashPassword: any) => {
      const recruiter = new Recruiter({
        name: name,
        email: email,
        password: hashPassword,
      });
      return recruiter.save();
    })
    .then((savedRecruiter: any) => {
      res.status(201).json(savedRecruiter);
    })
    .catch((err: any) => {
      console.log(err);
    });
};

export const postLogout = (req: any, res: any, next: any) => {
  req.session.destroy((err: any) => {
    console.log(err);
    res.redirect('/recruiters/login');
  });
};

export const getResetPassword = (req: any, res: any, next: any) => {
  const responseData = {
    path: '/recruiters/reset',
    errorMessage: req.flash('error'),
  };
  res.json(responseData);
};

export const postResetpassword = (req: any, res: any, next: any) => {
  crypto.randomBytes(32, (err: any, buffer: any) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'An error occurred.' });
    }
    const token = buffer.toString('hex');
    Recruiter.findOne({ email: req.body.email })
      .then((recruiter: any) => {
        if (!recruiter) {
          return res
            .status(404)
            .json({ error: 'No account with that email found.' });
        }
        recruiter.resetToken = token;
        recruiter.resetTokenExpiration = Date.now() + 3600000;
        return recruiter.save();
      })
      .then((result: any) => {
        res
          .status(200)
          .json({ message: 'Password reset token generated.', token });
      })
      .catch((err: any) => {
        console.log(err);
        res.status(500).json({ error: 'An error occurred.' });
      });
  });
};

export const getNewPassword = (req: any, res: any, next: any) => {
  const token = req.params.token;
  const recruiterId = req.params.recruiterId;

  Recruiter.findOne({
    _id: recruiterId,
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((recruiter: any) => {
      if (!recruiter) {
        return res
          .status(404)
          .json({ error: 'Invalid reset token or recruiter ID.' });
      }

      const responseData = {
        path: '/recruiters/new-password',
        errorMessage: req.flash('error'),
        recruiterId: recruiterId,
      };
      res.json(responseData);
    })
    .catch((err: any) => {
      console.log(err);
      res.status(500).json({ error: 'An error occurred.' });
    });
};

export const postNewPassword = (req: any, res: any, next: any) => {
  const newPassword = req.body.password;
  const recruiterId = req.body.recruiterId;
  const passwordToken = req.body.passwordToken;

  let resetRecruiter: any;

  Recruiter.findOne({
    _id: recruiterId,
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((recruiter: any) => {
      resetRecruiter = recruiter;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword: any) => {
      resetRecruiter.password = hashedPassword;
      resetRecruiter.resetToken = undefined;
      resetRecruiter.resetTokenExpiration = undefined;
      return resetRecruiter.save();
    })
    .then((recruiter: any) => {
      res.redirect('/recruiters/login');
    })
    .catch((err: any) => {
      console.log(err);
      res.status(500).json({ error: 'An error occurred.' });
    });
};

export const updateCandidateStatus = async (req: any, res: any, next: any) => {
  try {
    const { recruiterId, candidateId } = req.params;
    const { actionType } = req.body;

    const [recruiter, candidate] = await Promise.all([
      Recruiter.findById(recruiterId),
      Candidate.findById(candidateId),
    ]);

    if (!recruiter) {
      return res
        .status(404)
        .json({ error: 'Recruiter with given id is not found.' });
    }

    if (!candidate) {
      return res
        .status(404)
        .json({ error: 'Candidate with given id is not found.' });
    }

    const report = candidate.report;

    if (!report) {
      return res.status(404).json({
        error: `No report found for Candidate with Id: ${candidateId}`,
      });
    }

    const currentDate = new Date().toISOString();
    let updateData: {
      adjudication?: string;
      status?: string;
    } = {};

    if (actionType === 'pre-adverse') {
      updateData = {
        adjudication: 'Pre-adverse',
        status: 'Scheduled',
      };
    } else if (actionType === 'engage') {
      updateData = {
        adjudication: 'Engage',
        status: 'Scheduled',
      };
    } else {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    if (actionType === 'pre-adverse') {
      await Candidate.updateOne(
        { _id: candidateId },
        {
          $set: {
            'report.adjudication': updateData.adjudication,
            'report.status': 'Consider',
          },
        }
      );
    } else {
      await Candidate.updateOne(
        { _id: candidateId },
        {
          $set: {
            'report.adjudication': updateData.adjudication,
            'report.status': 'Clear',
          },
        }
      );
    }

    let adverseAction = await AdverseAction.findOne({ candidateId });

    if (!adverseAction) {
      adverseAction = new AdverseAction({
        pre_notice_date: currentDate,
        post_notice_date: currentDate,
        candidateId,
        ...updateData,
      });
    } else {
      adverseAction.set(updateData);
    }

    await adverseAction.save();

    res.status(200).json(adverseAction);
  } catch (err: any) {
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || 'Internal Server Error' });
  }
};
