function errorHandler(error, req, res, next) {
  const isBadJson = error.type === 'entity.parse.failed';
  if (isBadJson) {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }

  const isOurError = Boolean(error.statusCode);
  if (isOurError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  res.status(500).json({ error: 'Something went wrong on the server' });
}

module.exports = errorHandler;
