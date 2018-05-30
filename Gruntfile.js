module.exports = function(grunt) {

  grunt.initConfig({
    
    pkg: grunt.file.readJSON('package.json'),
    
    watch: {
      options: {
        livereload: true
      },
      handlebars: {
        files: ['src/*.{handlebars,hbs}', 'src/partials/**/*.{handlebars,hbs}'],
        tasks: ['assemble', 'replace:dev']
      },
      scss: {
        files: ['src/scss/**/*.scss'],
        tasks: ['sass:dev', 'postcss']
      },
      config: {
        files: ['package.json', 'Gruntfile.js', '.sassdocrc'],
        tasks: ['build:dev'],
        options: {reload: true}
      },
      brandy: {
        files: ['scss/**/*.scss'],
        tasks: ['docs']
      }
    },
    
    assemble: {
      options: {
        assets: 'assets',
        partials: ['src/partials/**/*.{handlebars,hbs}'],
        layouts: ['src/layouts/**/*.{handlebars,hbs}'],
        data: ['data/*.{json,yml}'],
        plugins: [],
        helpers: []
      },
      site: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['*.{handlebars,hbs}'],
          dest: 'site/'
        }]
      }
    },
    
    sass: {
      dev: {
        options: {
          noCache: true,
          style: 'nested',
          sourcemap: 'none',
          update: true,
        },
        files: [{
          expand: true,
          cwd: 'src/scss/',
          src: ['*.scss'],
          dest: 'site/css/',
          ext: '.css'
        }]
      },
      prod: {
        options: {
          noCache: true,
          style: 'compressed'
        },
        files: [{
          expand: true,
          cwd: 'src/scss/',
          src: ['*.scss'],
          dest: 'site/css/',
          ext: '.css'
        }]
      },
      test: {
        options: {
          noCache: true
        },
        files: [{
          expand: true,
          cwd: 'test/',
          src: ['*.scss'],
          dest: '.',
          ext: '.css'
        }]
      }
    },
    
    cssmin: {
      prod: {
        files: [{
          expand: true,
          cwd: 'site/css/',
          src: ['*.css', '!*.min.css'],
          dest: 'site/css/',
          ext: '.min.css'
        }]
      }
    },
    
    postcss: {
      options: {
        processors: [
          require('autoprefixer')({broswers: ['last 2 versions']})
        ]
      },
      site: {
        src: 'site/css/*.css'
      }
    },
    
    replace: {
      dev: {
        options: {
          patterns: [
            {
              match: 'css',
              replacement: () => [
                'css/style.css'
              ].map((stylesheet) => `<link rel="stylesheet" href="${stylesheet}">`).join("\n")
            },
            {
              match: 'js',
              replacement: () => [
                '//localhost:35729/livereload.js'
              ].map((script) => `<script src="${script}">`).join("\n")
            }
          ]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['site/*.html'],
          dest: 'site/'
        }]
      },
      prod: {
        options: {
          patterns: [
            {
              match: 'css',
              replacement: () => [
                'css/style.min.css'
              ].map((stylesheet) => `<link rel="stylesheet" href="${stylesheet}">`).join("\n")
            },
            {
              match: 'js',
              replacement: () => [].map((script) => `<script src="${script}">`).join("\n")
            }
          ]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['site/*.html']
        }]
      }
    },
    
    copy: {
      site: {
        files: [
          {expand: true, cwd: 'src/assets/', src: ['**/*'], dest: 'site/assets/'},
          {expand: true, cwd: 'src/fonts/', src: ['**/*'], dest: 'site/fonts/'}
        ]
      }
    },
    
    clean: {
      site: ['site/']
    },
    
    sassdoc: {
      docs: {
        src: 'scss/',
        options: {
          dest: 'site/docs/',
          config: '.sassdocrc'
        }
      }
    }
    
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('site:dev', [
    'clean',
    'assemble',
    'replace:dev',
    'sass:dev',
    'postcss',
    'copy'
  ]);
  grunt.registerTask('site:prod', [
    'clean',
    'assemble',
    'replace:prod',
    'sass:prod',
    'postcss',
    'cssmin',
    'copy'
  ]);
  grunt.registerTask('docs', [
    'sassdoc'
  ]);
  grunt.registerTask('build:dev', [
    'site:dev',
    'docs'
  ]);
  grunt.registerTask('build:prod', [
    'site:prod',
    'docs',
  ]);
  grunt.registerTask('dev', [
    'build:dev',
    'watch'
  ]);
  grunt.registerTask('test', [
    'sass:test'
  ]);
  grunt.registerTask('prod', [
    'build:prod'
  ]);
  grunt.registerTask('default', ['dev']);

};