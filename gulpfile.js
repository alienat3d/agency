const gulp = require('gulp'),
  concat = require('gulp-concat'),
  autoprefixer = require('gulp-autoprefixer'),
  cleanCSS = require('gulp-clean-css'),
  uglify = require('gulp-uglify'),
  del = require('del'),
  browserSync = require('browser-sync').create();

// Подключим весьма спорным методом Normalize, чтобы потестить concat. Т.к. обычно подключаем через препроцессор или с помощью bower. Но сейчас подключим его напрямую. Хоть способ и топорный, но это самый быстрый способ подключить Normalize.css без препроцессоров.
// Если бы мы работали с препроцессорами, то всё было куда проще, но здесь мы рассмотрим сборку под CSS, то для упорядочивания подключения создадим массив.
const cssFiles = [
  './node_modules/normalize.css/normalize.css',
  './app/css/style.css',
  './app/css/media.css'
]

const jsFiles = [
  './app/js/lib.js',
  './app/js/index.js',
]

// Начинается с return gulp.src() и заканчивается .pipe(gulp.dest()). Т.е. откуда мы что-то берём и куда направляем.
// '> 0.1%' означает, что для всех браузеров, которые используются в мире на более, чем 1\10 процента, для них нужно префиксы расставить.
// 'level: 2' для cleanCSS означает самый жёстки предустановленный способ минификации. О других можно почитать в доке к пакету.
function styles() {
  return gulp.src(cssFiles)
    .pipe(concat('main.min.css'))
    .pipe(autoprefixer({
      overrideBrowserslist: [
        '> 0.1%'
      ],
      cascade: false
    }))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream())
}

function scripts() {
  return gulp.src(jsFiles)
    .pipe(concat('main.min.js'))
    .pipe(uglify({
      toplevel: true
    }))
    .pipe(gulp.dest('./dist/js'))
    .pipe(browserSync.stream())
}
// Следит за изменениями любых файлов CSS и запускает функцию styles при малейшем изменении. Тоже делаем и для JS-скриптов.
// Если работаем с PHP, то в настройках к browserSync можно прописать proxy (ссылку на localhost в нём прописать). Можно затуннелить это всё прописав "tunnel: true". Таким образом можно будет смотреть на проект по ссылке вообще из любого места и сети.
function watch() {
  browserSync.init({
    server: {
      baseDir: "./"
    },
    notify: false,
    // tunnel: true
  })

  gulp.watch('./app/*.html').on('change', browserSync.reload)
  gulp.watch('./app/css/**/*.css', styles)
  gulp.watch('./app/js/**/*.js', scripts)
}

function grid(done) {
  const settings = {
    
  }
}

// Функция clean() - поможет нам подчищать старые файлы в папке dist при помощи плагина del, во избежание неприятных багов при перезаписывании. Но как отдельную задачу нам его его не нужно регистрировать, вместо этого мы включим его в специальную задачу "build", которая выполнит ряд действий. Которая при помощи parallel() будет запускать задачи в параллельном режиме.
function clean() {
  return del('dist/*')
}

gulp.task('styles', styles);
gulp.task('scripts', scripts);
gulp.task('watch', watch);
// Альтернативно этому можно зарегистрировать функцию Gulp d в новом формате так:
/* exports.styles = styles;
exports.scripts = scripts;
exports.watch = watch; */

gulp.task('build', gulp.series(clean,
  gulp.parallel(styles, scripts)
));
// Для разработки также сделаем. Кстати, когда у нас таски, а не функции, то можно писать и с одинарными кавычками.
gulp.task('dev', gulp.series('build', 'watch'))
/* exports.build.series(clean,
  parallel(styles, scripts)
); */

// TODO: Добавить sourcemap, imagemin, font-converter, может PUG, в CSS-стилях разные сборки в прод и в дев, препроцессоры. Для JS либо webpack-stream, либо бревсирифай для модульности. Babel.