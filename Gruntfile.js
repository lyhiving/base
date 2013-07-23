module.exports = function (grunt) {

  "use strict";

  grunt.initConfig({
    uglify: {
      my_target: {
        files: {
          'dist/seajs-intro.js': ['src/seajs-intro.js'],
          'dist/seajs-outro.js': ['src/seajs-outro.js']
        }
      }
    }
  });
  grunt.loadNpmTasks("grunt-contrib-uglify");

  // Default grunt
  grunt.registerTask("build", [ "uglify" ]);
  grunt.registerTask("default", ["build"]);
};
