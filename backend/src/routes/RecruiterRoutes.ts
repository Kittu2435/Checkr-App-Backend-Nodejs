import express from 'express';
import { check } from 'express-validator';

const RecruiterController = require('../controllers/RecruiterController');

const Recruiter = require('../models/Recruiter');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.get('/login', RecruiterController.getLogin);

router.get('/signup', RecruiterController.getSignup);

router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Enter a valid email address. '),
    check('password', 'Password has to be Valid.')
      .isLength({ min: 4, max: 10 })
      .isAlphanumeric()
      .trim(),
  ],
  RecruiterController.postLogin
);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Enter a Valid Email.')
      .custom((value: any, { req: any }) => {
        return Recruiter.findOne({ email: value }).then((recruiter: any) => {
          if (recruiter) {
            return Promise.reject(
              'Email already exists, enter a different one. '
            );
          }
        });
      }),
    check(
      'password',
      'Please enter a password with only numbers and text and at least 4 characters to max 10 characters.'
    )
      .isLength({ min: 4, max: 10 })
      .isAlphanumeric()
      .trim(),
    check('name', 'Please enter a valid name with only text.').matches(
      /^[a-zA-Z\s]+$/
    ),
  ],
  RecruiterController.postSignup
);

router.post('/logout', isAuth, RecruiterController.postLogout);

router.get('/reset', isAuth, RecruiterController.getResetPassword);

router.post('/reset', isAuth, RecruiterController.postResetpassword);

router.get('/reset/:token', isAuth, RecruiterController.getNewPassword);

router.post('/new-password', isAuth, RecruiterController.postNewPassword);

router.post(
  '/:recruiterId/candidates/:candidateId/update-status',
  isAuth,
  RecruiterController.updateCandidateStatus
);

module.exports = router;
