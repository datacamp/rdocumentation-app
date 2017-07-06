var Promise = require('bluebird');

module.exports = {
    getListPromise: function(prefix){
        var params = {
          Bucket: process.env.AWS_BUCKET,
          Delimiter: '/',
          Prefix: prefix
        };
        
        return s3.listObjects(params).promise();
    },

    getAllFilesInFolder: function(folderPrefix, recursive = false){
        return s3Service.getListPromise(folderPrefix).then(function(result) {
            var currentFiles = result.Contents;
            var folders = [];
            var promises;

            if(recursive){
                // Create promises for subdirs
                promises = result.CommonPrefixes.map(function(prefixObject) {
                    return s3Service.getAllFilesInFolder(prefixObject.Prefix);
                });
            }
            else{
                // Add folders when not recursive
                folders = folders.concat(result.CommonPrefixes);
            }

            // To prevent Promise.all(undefined)
            if(promises === undefined)
                promises =  []; 
            
            return Promise.all(promises).then(function(data){
                // Change the list of lists of files in subdirs to one list
                var wantedList = [];
                for(var sublist of data){
                    wantedList = wantedList.concat(sublist.list);
                }

                // Add files and folders in current dir and return                
                return {
                    list: wantedList.concat(currentFiles),
                    folders: folders
                }
            });
        });
    },

    getObject: function(prefix){
        console.log("key " + prefix);
        var params = {
          Bucket: process.env.AWS_BUCKET,
          Key: prefix,
          ResponseContentType: 'text/plain',
        };
        
         return s3.getObject(params).promise().then(function(object){
            // Convert result to utf-8 string
            return object.Body.toString('utf-8');
         });
    }


};