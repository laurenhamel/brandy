module.exports = function(grunt) {
  
  const {exec} = require('child_process');
  const extend = require('extend');
  const path = require('path');
  const Deferred = require('deferred-js');
  const chalk = require('chalk');

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
    
    'dart-sass': {
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
    }
    
  });

  require('load-grunt-tasks')(grunt);
  
  const sass = function( options, targets = [] ) { 
    
    const deferred = new Deferred();
    
    const settings = extend({
      sourcemap: true,
      style: 'expanded',
      update: false
    }, options);

    let params = ' ';

    params += `--${settings.sourcemap ? '' : 'no-'}source-map `;
    params += `--style=${settings.style} `;
    params += settings.update ? '--update ' : '';

    let files = [];

    targets.forEach((target) => {

      const config = {};

      if( target.cwd ) config.cwd = target.cwd;
      if( target.flatten ) config.flatten = target.flatten;
      if( target.ext ) config.ext = target.ext;
      if( target.extDot ) config.extDot = target.extDot;
      if( target.rename ) config.rename = target.rename;

      const globs = grunt.file.expandMapping(target.src, target.dest, config);

      files = files.concat(globs);

    });
    
    const subtasks = [];
    
    const logs = [];

    files.forEach((file) => {
      
      const subdeferred = new Deferred();

      exec(`sass ${file.src} ${file.dest} ${params}`, (error, stdout, stderr) => {

        if( error ) subdeferred.reject(error);

        let stderrType = 'log';
        
        if( stderr.indexOf('ERROR') === 0 ) stderrType = 'error';
        if( stderr.indexOf('WARN') === 0 ) stderrType = 'warn';
        if( stderr.indexOf('DEBUG') === 0 ) stderrType = 'debug';

        if( stdout ) logs.push({type: 'log', message: stdout});
        if( stderr ) logs.push({type: stderrType, message: stderr});
        
        subdeferred.resolve();

      });
      
      subtasks.push(subdeferred.promise());

    });
    
    Deferred.when(...subtasks)
      .done(() => { 
      
        const styles = {
          log: [],
          error: ['red'],
          warn: ['yellow'],
          debug: ['blue']
        };
      
        logs.forEach((log) => {
          
          if( styles[log.type].length > 0 ) {
          
            console[log.type](chalk`{${styles[log.type].join('.')} ${log.message}}`);
          
          }
          
          else {
            
            console[log.type](log.message);
            
          }
            
        });
      
        deferred.resolve(logs);
      
      })
      .fail((error) => deferred.reject(error));
    
    return deferred.promise();
    
  };

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
  grunt.registerTask('test', [
    'sass:test'
  ]);
  grunt.registerTask('prod', [
    'build:prod',
    'gh-pages'
  ]);
  grunt.registerTask('default', ['dev']);

};