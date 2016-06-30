module.exports = function(grunt) {

  grunt.config.set('versioning', {
    options: {
      keepOriginal: false
    },
    js: {
      src: [
        '.tmp/public/min/production.min.js',
      ]
    },
    css: {
      src: [
        '.tmp/public/min/production.min.css'
      ]
    },
  });
  grunt.loadNpmTasks('grunt-version-assets');
};
