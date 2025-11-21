module.exports.success = (data) => ({
  statusCode: 200,
  body: JSON.stringify({ response: data }),
});

module.exports.error = (statusCode, message) => ({
  statusCode,
  body: JSON.stringify({ response: { message } }),
});