module.exports = function(grunt) {
grunt.initConfig({
  less: {
    dev: {
      options: {
        compress: false
      },
      files: {
        "./public/css/dev.css": "./less/main.less" // destination file and source file
      }
    },
    main: {
      options: {
        compress: false
      },
      files: {
        "./public/css/style.css": ["./less/bootstrap.less"]
      }
    }
  },
  concat: {
      dev: {
        src: "./js/dev.js",
        dest: "./public/js/dev.js",
        nonull: true
      },
      main: {
        src: ["./bower_components/raphael/raphael-min.js",
              "./bower_components/morrisjs/morris.min.js",
              "./bower_components/timeago/jquery.timeago.js",
              "./bower_components/timeago/locales/jquery.timeago.cs.js",
              "./node_modules/date-format-lite/dist/index-min.js",
            ],
        dest: "./public/js/build.js",
        nonull: true
      }
    },
    uglify: {
      main: {
          options: {
            preserveComments: false
          },
          files: {
              './public/js/jquery.min.js': ['./bower_components/jquery/dist/jquery.js'],
              './public/js/scripts.min.js': ["./public/js/build.js", "./js/dev.js"]
          }
      }
    },
    combine_mq: {
      main: {
        expand: true,
        src: './public/css/style.css'
      },
    },
    autoprefixer: {
      main: {
        options: {
          map: false,
          browsers: ['last 3 versions', 'ie 11']
        },
        src: './public/css/style.css'
      },
    },
    cssmin: {
      main: {
        options: {
          keepSpecialComments: 0
        },
        files: {
          './public/css/style.min.css':["./bower_components/morrisjs/morris.css",
                                        "./public/css/style.css"
                                       ]
        }
      },
    },
    watch: {
      less: {
        files: ['./less/*.less'],
        tasks: ['less:dev'],
        options: {
          livereload: true,
        }
      },
      js: {
        files: ['./js/*.js'],
        tasks: ['concat:dev'],
        options: {
          livereload: true,
        }
      }
    }
});

grunt.loadNpmTasks('grunt-contrib-less');
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-combine-mq');
grunt.loadNpmTasks('grunt-autoprefixer');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-contrib-watch');

grunt.registerTask('default', [
    'less:main',
    'autoprefixer',
    'combine_mq',
    'cssmin',
    'concat:main',
    'uglify',
  ]);
};