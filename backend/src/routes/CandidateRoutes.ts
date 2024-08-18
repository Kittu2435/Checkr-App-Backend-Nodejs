import express from 'express';

const CandidateController = require('../controllers/CandidateController');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.get('/', isAuth, CandidateController.getCandidates);

router.get('/:candidateId', isAuth, CandidateController.getCandidateById);

router.get(
  '/:candidateId/report',
  isAuth,
  CandidateController.getReportByCandidateId
);

router.get(
  '/:candidateId/searches',
  isAuth,
  CandidateController.getCourtSearchesByCandidateId
);

module.exports = router;
