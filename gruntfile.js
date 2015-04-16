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
        }
    });

    grunt.loadNpmTasks('grunt-cssnext');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['cssnext']);
    grunt.registerTask('default', ['cssnext']);
};

