module.exports = function(grunt) {

    grunt.initConfig({
        watch: {
            scripts: {
                files: [ 'src/css/*.css'],
                tasks: ['cssnext'],
                options: {
                    spawn: false,
                },
            },
        },

        cssnext: {
            dist: {
                options: {
                    style: 'expanded'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/css/',
                        src:  'app.css',
                        dest:  'css/',
                        ext: '.css'
                    }
                ]
            }
        },
         jshint: {
             all: ['Gruntfile.js', 'js/**/*.js']
        },
        htmlhint: {
          prod: {
            options: {
              'tag-pair': true
            },
            src: ['index.html']
          }
        }
    });

    grunt.loadNpmTasks('grunt-cssnext');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-htmlhint');

    grunt.registerTask('build', ['cssnext']);
    grunt.registerTask('default', ['cssnext']);
};

