module.exports = (req: any, res: any, next: any) => {
  if (!req.session.isLoggedIn) {
    return res.redirect('/recruiters/login');
  }
  next();
};
