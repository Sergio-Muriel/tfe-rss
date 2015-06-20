module.exports = function(grunt) {
    var manifest = JSON.parse(grunt.file.read('manifest.webapp'));


    grunt.initConfig({
        watch: {
            index: {
                files: [ 'src/index.html','manifest.webapp'],
                tasks: ['template'],
                options: {
                    spawn: false,
                },
            },
            scripts: {
                files: [ 'src/css/*.css'],
                tasks: ['cssnext'],
                options: {
                    spawn: false,
                },
            },
        },
        template: {
            'options': {},
            'index':{
                'options': {
                    'data': manifest
                },
                'files':{
                    'index.html': [ 'src/index.html']
                }
            }
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

    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-cssnext');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-htmlhint');

    grunt.registerTask('build', ['template','cssnext']);
    grunt.registerTask('default', ['template','cssnext']);
};

