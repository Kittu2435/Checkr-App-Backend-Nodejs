const globalErrorHandler = (err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = globalErrorHandler;
