/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    oldname: "listentoitlater",
    static_path : '<%= oldname %>/static',
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      // js file used by login(index) and script(app) pages
      dist: {
        src: ['<%= static_path %>/js/plugins.js', '<%= static_path %>/js/requestInvite.js'],
        dest: '<%= static_path %>/js/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      login: {
        src: '<%= static_path %>/js/login.js',
        dest: '<%= static_path %>/js/login.min.js'
      },
      script: {
        src: '<%= static_path %>/js/script.js',
        dest: '<%= static_path %>/js/script.min.js'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: '<%= static_path %>/js/<%= pkg.name %>.min.js'
      }
    },
    jshint: {
      options: {
        curly:   true,
        eqeqeq:  true,
        immed:   true,
        latedef: true,
        newcap:  true,
        noarg:   true,
        sub:     true,
        undef:   true,
        unused:  true,
        boss:    true,
        eqnull:  true,
        browser: true,
        globals: {
          jQuery: true,
          $: false,
          ko: true,
          soundManager: false,
          noty: false,
          Spinner: false,
          Sammy: false,
          analytics: false,
          log: false,
          DO: false,
          ViewModelVar: true,
          playerModelVar: true,
          devmode: true,
          index_clicked_track: true,
          alert: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: '<%= concat.dist.src %>'
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile', 'targethtml', 'less:dev']
      },
      lib_test: {
        files: '<%= concat.dist.src %>',
        tasks: ['jshint:lib_test', 'qunit']
      },
      jsfiles: {
        files: '<%= concat.dist.src %>',
        tasks: ['uglify:script', 'uglify:dist', 'uglify:login'],
        options: {
          livereload: true
        }
      },
      templates_src: {
        files: ['<%= oldname %>/templates_src/*.html'],
        tasks: ['targethtml:dev'],
        options: {
          livereload: true
        }
      },
      less: {
        files: ['<%= static_path %>/css/*.less'],
        tasks: ['less:dev'],
        options: {
          livereload: true
        }
      }
    },
    targethtml: {
      dev: {
        files: {
          '<%= oldname %>/index.html': '<%= oldname %>/templates_src/index.html',
          '<%= oldname %>/templates/app.html': '<%= oldname %>/templates_src/app.html'
        }
      },
      prod: {
        options: {
          curlyTags: {
            pkg_title: '<%= pkg.name %>'
          }
        },
        files: {
          '<%= oldname %>/index.html': '<%= oldname %>/templates_src/index.html',
          '<%= oldname %>/templates/app.html': '<%= oldname %>/templates_src/app.html'
        }
      }
    },
    less: {
      dev: {
        options: {
          paths: '<%= static_path %>/css'
        },
        files: {
          '<%= static_path %>/css/app-bootstrap.2.1.0.css': '<%= static_path %>/css/app-bootstrap.2.1.0.less',
          '<%= static_path %>/css/bootstrap.2.1.0.css': '<%= static_path %>/css/bootstrap.2.1.0.less',
          '<%= static_path %>/css/bootstrap-responsive.css': '<%= static_path %>/css/bootstrap-responsive.less'
        }
      },
      prod: {
        options: {
          paths: '<%= less.dev.options.paths %>',
          yuicompress: true
        },
        files: {
          '<%= static_path %>/css/app-bootstrap.2.1.0.css': '<%= static_path %>/css/app-bootstrap.2.1.0.less',
          '<%= static_path %>/css/bootstrap.2.1.0.css': '<%= static_path %>/css/bootstrap.2.1.0.less',
          '<%= static_path %>/css/bootstrap-responsive.css': '<%= static_path %>/css/bootstrap-responsive.less'
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-targethtml');

  // Default task.
  grunt.registerTask('qcu', [/* 'qunit', */'concat', 'uglify']);
  grunt.registerTask('default', ['targethtml:dev', 'less:dev', 'concat', 'watch']);
  grunt.registerTask('prod', ['qcu', 'less:prod', 'targethtml:prod']);

};
