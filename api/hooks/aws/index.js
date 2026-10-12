module.exports = function aws_init(sails) {
  // Import the v3 S3 client.
  const { S3Client } = require('@aws-sdk/client-s3');

  return {
    initialize: function(next) {
      // Create a new S3 client using default configuration (region etc. can be set via env vars).
      const s3 = new S3Client({});
      global['s3'] = s3;
      next();
    }
  };
};