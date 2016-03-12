var lng = require('./config/config.js').general.lng

module.exports = function (grunt) {
  grunt.initConfig({
    less: {
      bootstrap: {
        options: {
          compress: false
        },
        files: {
          './public/css/bootstrap.css': ['./less/bootstrap.less']
        }
      },
      main: {
        options: {
          compress: false
        },
        files: {
          './public/css/main.css': ['./less/main.less']
        }
      }
    },
    concat: {
      main: {
        src: ['./bower_components/raphael/raphael-min.js',
          './bower_components/morrisjs/morris.js',
          './bower_components/timeago/jquery.timeago.js',
          './bower_components/timeago/locales/jquery.timeago.' + lng + '.js',
          './public/js/main.js'
        ],
        dest: './public/js/scripts.js',
        nonull: true
      }
    },
    uglify: {
      main: {
        options: {
          preserveComments: false
        },
        files: {
          './public/js/scripts.min.js': ['./public/js/scripts.js']
        }
      },
      jquery: {
        options: {
          preserveComments: false
        },
        files: {
          './public/js/jquery.min.js': ['./bower_components/jquery/dist/jquery.js']
        }
      }
    },
    combine_mq: {
      main: {
        expand: true,
        src: './public/css/bootstrap.css'
      }
    },
    autoprefixer: {
      main: {
        options: {
          map: false,
          browsers: ['last 3 versions', 'ie 11']
        },
        src: ['./public/css/bootstrap.css', './public/css/main.css']
      }
    },
    cssmin: {
      main: {
        options: {
          keepSpecialComments: 0
        },
        files: {
          './public/css/style.min.css': ['./bower_components/morrisjs/morris.css',
            './public/css/bootstrap.css',
            './public/css/main.css'
          ]
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-combine-mq')
  grunt.loadNpmTasks('grunt-autoprefixer')
  grunt.loadNpmTasks('grunt-contrib-cssmin')

  grunt.registerTask('default', [
    'less',
    'autoprefixer',
    'combine_mq',
    'cssmin',
    'concat',
    'uglify:main'
  ])

  grunt.registerTask('js', [
    'concat',
    'uglify:main'
  ])

  grunt.registerTask('css', [
    'less:main',
    'autoprefixer',
    'cssmin'
  ])
}
