
module.exports = function(grunt) {

  grunt.config.set('sails_tasks', {
    authorCleaning: {
      functions: [
        function (callback) {
          AuthorService.aggregateAuthors().then(function(result) {
            console.log("Finished cleaning authors");
            callback();
          });
        }
      ]
    },
  });


  grunt.loadNpmTasks('grunt-sails-tasks');
};
