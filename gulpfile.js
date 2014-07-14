var gulp = require('gulp')
var watchify = require('watchify')
var es6ify = require('es6ify')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var httpServer = require('http-server')
var opener = require('opener')
var portfinder = require('portfinder')
var del = require('del')

function Bundler () {
  return browserify('./index.js')
    // .add(es6ify.runtime)
    // .transform(es6ify)
}

var watch = !!~process.argv.indexOf('--watch')
if (watch) {
  console.log('watching for updates')
}

gulp.task('browserify', ['clean'], function () {
  var bundler = Bundler()

  if (watch) {
    bundler = watchify(bundler)
    bundler.on('update', rebundle)
  }

  
  function rebundle() {
    console.log('rebuilding app.js')
    return bundler
      .bundle({debug: true})
      .pipe(source('app.js'))
      .pipe(gulp.dest('./build'))    
  }

  return rebundle()
})

gulp.task('serve', function (cb) {
  portfinder.getPort(function (err, port) {
    port = 80
    if (err) { console.error(err); return cb(err) }
    httpServer.createServer({
      root:'./build'
    }).listen(port, function () {
      console.log('listening on ', port)
      opener('http://localhost:'+port)
    })  
  })
  
})

gulp.task('clean', function (cb) {
  del('./build', cb)
})

gulp.task('html', ['clean'], function () {
  if (watch) {
    gulp.watch('./index.html', function () {
      console.log('copied updated index.html')
      gulp.src('./index.html')
        .pipe(gulp.dest('./build'))
    })
  }
  return gulp.src('./index.html')
    .pipe(gulp.dest('./build'))
})

gulp.task('build', ['browserify', 'html'])
