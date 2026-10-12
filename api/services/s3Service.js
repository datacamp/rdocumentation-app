const { ListObjectsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
// The S3 client is created by the aws hook and published as global.s3 during
// initialize, which runs after services are loaded — so it is looked up at
// call time (as in the v2 code), not captured at module load.

module.exports = {
  // Returns a promise resolving to the ListObjects result.
  getListPromise: function (prefix) {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Delimiter: '/',
      Prefix: prefix
    };
    return global.s3.send(new ListObjectsCommand(params));
  },

  // Recursively (or not) collects files and folders under a prefix.
  getAllFilesInFolder: function (folderPrefix, recursive = false) {
    return this.getListPromise(folderPrefix).then(async (result) => {
      const currentFiles = result.Contents || [];
      let folders = [];
      let promises = [];

      if (recursive) {
        // Create promises for subdirectories.
        promises = (result.CommonPrefixes || []).map((prefixObject) => {
          return this.getAllFilesInFolder(prefixObject.Prefix, true);
        });
      } else {
        // Non‑recursive: just collect immediate sub‑folders.
        folders = (result.CommonPrefixes || []).map((p) => p);
      }

      // Resolve all recursive promises (if any).
      const subResults = await Promise.all(promises);
      const wantedList = subResults.reduce((acc, sub) => acc.concat(sub.list), []);

      return {
        list: wantedList.concat(currentFiles),
        folders: folders
      };
    });
  },

  // Retrieves an object and returns its body as a UTF‑8 string, matching previous Buffer behavior.
  getObject: function (prefix) {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: prefix,
      ResponseContentType: 'text/plain'
    };
    return global.s3.send(new GetObjectCommand(params)).then(async (data) => {
      const chunks = [];
      for await (const chunk of data.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString('utf-8');
    });
  }
};