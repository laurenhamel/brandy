module.exports = function(grunt) {
  
  const {exec} = require('child_process');
  const path = require('path');
  const Deferred = require('deferred-js');
  const chalk = require('chalk');
  const _ = require('lodash');
  
  const dartSass = {
    dev: {
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
        outputStyle: 'compressed'
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
      files: [{
        expand: true,
        cwd: 'test/',
        src: ['*.scss'],
        dest: '.',
        ext: '.css'
      }]
    }
  };
  
  grunt.file.expand('test/*.scss').forEach((scss) => {
    
    const name = path.basename(scss, '.scss');
    const css = scss.replace('.scss', '.css');
    const files = {};
    
    files[css] = scss;
    
    dartSass[name] = {files};
    
  });

  grunt.initConfig({
    
    pkg: grunt.file.readJSON('package.json'),
    
    watch: {
      options: {
        livereload: true
      },
      handlebars: {
        files: ['src/*.{handlebars,hbs}', 'src/{partials,layouts}/**/*.{handlebars,hbs}', 'data/*.{json,yml}'],
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
      },
      assets: {
        files: ['src/fonts/**/*', 'src/assets/**/*'],
        tasks: ['copy']
      }
    },
    
    assemble: {
      options: {
        assets: 'site/assets',
        partials: ['src/partials/**/*.{handlebars,hbs}'],
        layouts: ['src/layouts/**/*.{handlebars,hbs}'],
        data: ['data/*.{json,yml}', 'package.json'],
        plugins: [],
        helpers: ['helper-moment']
      },
      site: {
        files: [{
          expand: true,
          flatten: true,
          src: ['src/*.{handlebars,hbs}'],
          dest: 'site/'
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
              ].map((script) => `<script src="${script}"></script>`).join("\n")
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
              replacement: () => [].map((script) => `<script src="${script}"></script>`).join("\n")
            }
          ]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['site/*.html'],
          dest: 'site/'
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
    },
    
    'gh-pages': {
      options: {
        base: 'site'
      }, 
      src: ['**']
    },
    
    'dart-sass': dartSass
    
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test', 'Run tests', ( ...args ) => {
    
    // Get the test name.
    const name = args.join(':') == '' ? false : args.join(':');
    
    // Get tests.
    const tests = Object.keys(dartSass).filter((task) => !['dev', 'prod', 'test'].includes(task));

    // Verify that test exists.
    if( name && tests.includes(name) ) grunt.task.run(`dart-sass:${name}`);
    else if( !name ) grunt.task.run(`dart-sass:test`);
    else grunt.fail.warn(`Test \`${name}\` could not be found.`);
    
  });
  grunt.registerTask('site:dev', [
    'clean',
    'assemble',
    'replace:dev',
    'dart-sass:dev',
    'postcss',
    'copy'
  ]);
  grunt.registerTask('site:prod', [
    'clean',
    'assemble',
    'replace:prod',
    'dart-sass:prod',
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
  grunt.registerTask('prod', [
    'build:prod',
    'gh-pages'
  ]);
  grunt.registerTask('default', ['dev']);

};