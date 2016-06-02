
module.exports = function(grunt) {

  grunt.config.set('apidoc',{
    doc: {
      src: "api/",
      dest: ".tmp/public/docs",
      options: {
        includeFilters: [ ".*\\.js$" ],
      }
    }
  });

  grunt.loadNpmTasks('grunt-apidoc');

};
