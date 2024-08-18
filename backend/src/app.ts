import bodyParser from 'body-parser';
import express from 'express';

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const Recruiter = require('./models/Recruiter');
const flash = require('connect-flash');

const app = express();

const mongoose = require('mongoose');

const globalErrorHandler = require('./util/globalErrorHandler');

require('dotenv').config();

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions',
});

const recruiterRoutes = require('./routes/RecruiterRoutes');
const candidateRoutes = require('./routes/CandidateRoutes');

app.use(bodyParser.json());
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(flash());

app.use((req: any, res: any, next: any) => {
  if (!req.session.recruiter) {
    return next();
  }
  Recruiter.findById(req.session.recruiter._id)
    .then((recruiter: any) => {
      req.recruiter = recruiter;
      next();
    })
    .catch((err: any) => console.log(err));
});

app.use((req: any, res: any, next: any) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use('/recruiters', recruiterRoutes);
app.use('/candidates', candidateRoutes);

app.use(globalErrorHandler);

mongoose
  .connect(process.env.MONGODB_URI)
  .then((res: any) => {
    app.listen(3000);
  })
  .catch((err: any) => console.log(err));
