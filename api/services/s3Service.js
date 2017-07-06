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

    getAllFilesInFolder: function(folderPrefix){
        return s3Service.getListPromise(folderPrefix).then(function(result) {

            // Create promises for subdirs
            var promises = result.CommonPrefixes.map(function(prefixObject) {
                return s3Service.getAllFilesInFolder(prefixObject.Prefix);
            });

            // To prevent Promise.all(undefined)
            if(promises === undefined)
                promises =  []; 
            
            return Promise.all(promises).then(function(list){
                
                // Change the list of lists of files in subdirs to one list
                var wantedList = [];
                for(var sublist of list){
                    wantedList = wantedList.concat(sublist);
                }

                // Add files in current dir and return                
                return wantedList.concat(result.Contents);
            });
        });
    }


};