const gulp = require('gulp'),
  del = require('del'),
  browserSync = require('browser-sync').create(),
  concat = require('gulp-concat'),
  sourcemaps = require('gulp-sourcemaps'),
  gulpif = require('gulp-if'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  cssnano = require('gulp-cssnano'),
  sortMediaQueries = require('postcss-sort-media-queries'),
  uglify = require('gulp-uglify'),
  babel = require('gulp-babel'),
  less = require('gulp-less'),
  rename = require("gulp-rename"),
  smartgrid = require('smart-grid');

// * smartgrid будет отдельным таском, который запускается вначале проекта и может быть ещё один или пару раз при каких-то изменениях. Поэтому в сборщик он не входит, а у него будет отдельный таск. 

// uncss = require('postcss-uncss'),

const devDir = './app/', buildDir = './dist/';
/* const cssFiles = [
  devDir + 'css/base.css',
  devDir + 'css/style.css',
  devDir + 'css/media.css'
]; */
const jsFiles = [
  devDir + 'js/lib.js',
  devDir + 'js/index.js'
];

const isDev = process.argv.indexOf('--dev') !== -1,
  isProd = !isDev,
  isSync = process.argv.indexOf('--sync') !== -1;

// * Мы могли бы это всё больше автоматизировать, чтобы вручную не менять true на false в переменных сверху и вообще не трогать gulpfile, управляя всем из консоли. В NodeJS всегда есть объект process, у которого в свойстве "argv" записываются все команды, что мы вводим. Попробуем найти при помощи специальной команды есть ли придуманный нами флажок "--dev". Прописав это всё также в package.json "scripts" мы можем вызывать нужную нам конфигурацию сборки при помощи команд:
// todo npm run dev
// todo npm run build
// todo npm run devns
// process.argv.includes('--dev') !== -1;

// Создаём функцию
function html() {
  return gulp.src(devDir + '*.html')
    .pipe(gulp.dest(buildDir))
    .pipe(gulpif(isSync, browserSync.stream()));
}
// ? uncss - анализирует какие селекторы и атрибуты используются в стилях и удаляет те селекторы, которые теоретически в этом проекте может не существовать. Т.е. он выкидывает CSS-стили, если в HTML документе не находит нужных селекторов. Использовать с осторожностью, ведь может так получиться, что мы будем добавлять какой-то класс тегам через JS-код, а uncss его удалит, не найдя в HTML. А ещё он не умеет понимать какие части HTML мы храним в базе данных. Потому, что этот модуль таит такие опасности, то в реальных проектах его далеко не так часто используют.
// ? concat - когда у нас подключен препроцессор, то concat уже не нужен. Как впрочем нам и не нужен больше массив cssFiles.
function styles() {
  return gulp.src(devDir + 'less/main.less')
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(less())
    // .pipe(concat('main.min.css'))
    // .pipe(autoprefixer({
    //   overrideBrowserslist: ['> 0.1%'],
    //   cascade: false
    // }))
    // .pipe(gulpif(isProd, cleanCSS({ level: 2 })))
    // .pipe(postcss([uncss({
    //   html: [devDir + '*.html']
    // })]))
    .on('error', console.error.bind(console))
    .pipe(postcss(autoprefixer({
      overrideBrowserslist: ['> 0.1%']
    })))
    .pipe(postcss([
      sortMediaQueries({ sort: 'desktop-first' })
    ]))
    .pipe(gulpif(isProd, postcss(cssnano({ level: 2 }))))
    .pipe(gulpif(isDev, sourcemaps.write()))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(buildDir + 'css'))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function scripts() {
  return gulp.src(jsFiles)
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(gulpif(isProd, babel({ presets: ['@babel/env'] })))
    .on('error', console.error.bind(console))
    .pipe(gulpif(isProd, uglify({ toplevel: true })))
    .pipe(concat('main.min.js'))
    .pipe(gulpif(isDev, sourcemaps.write()))
    .pipe(gulp.dest(buildDir + 'js'))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function images() {
  return gulp.src(devDir + 'img/**/*')
    .pipe(gulp.dest(buildDir + 'img'))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function fonts() {
  return gulp.src(devDir + 'fonts/**/*')
    .pipe(gulp.dest(buildDir + 'fonts/'))
    .pipe(gulpif(isSync, browserSync.stream()));
}

function clear() { return del(buildDir + '*'); }
// Здесь, когда мы видим изменения в любом из файлов стилей, то запустим функцию styles.
// Если повозиться то можно сделать туннель через свой сервер.
function watch() {
  if (isSync) {
    browserSync.init({
      server: { baseDir: buildDir },
      notify: false
      // tunnel: true
    })
  };

  gulp.watch(devDir + 'less/**/*.less', styles)
  gulp.watch(devDir + 'js/**/*.js', scripts)
  gulp.watch(devDir + '*.html', html)
}

// Описываем задачу с каким-то названием. И потом будет запускаться функция, когда эта задача будет написана в консоли.
/* gulp.task('html', html)
gulp.task('css', styles)
gulp.task('js', scripts)
gulp.task('img', images)
gulp.task('clear', clear) */
// Для работы Smart-grid библиотеки указываем путь, где будет размещаться сетка Smart-grid’а и вторым параметром настройки.
// Настройки к Smart-grid’у можно подсмотреть по адресу: [./node_modules/smart-grid/system/defaults/settings.js]
// Две настройки, который в нашем случае следует сразу переопределить: "columns" (т.к. у нас в этом макете 24) & "offset" отступ межколоночника. Пока offset у нас в px, но также можно ставить и в других ед. измерения, например в процентах.
// ? В отличии от Bootstrap, не смотря на то, что при добавлении breakpoint’ов сам smart-grid.less файл сильно разрастётся, но т.к. в итоговый CSS-файл попадёт только малая часть примесей, что мы используем, то на самом деле прирост будет незначительным и мы смело можем делать столько breakpoint’ов, сколько потребуется.
function grid(done) {
  const settings = {
    filename: "_smart-grid",
    columns: 12,
    offset: "30px",
    breakPoints: {},
    container: {
      maxWidth: "1170px",
      fields: "50px" // Поля сайта [чтоб контент "не прилипал" к краям экрана устройства] (padding-left & -right у div.container) для того монитора, с которого начинаем вёрстку, т.е. здесь с Dekstop’а. Нельзя (!) задавать их меньше, чем в половину ширины межколоночника. (по мнению Лаврика в компьютерной версии сайта не менее 30px)
    },
    breakPoints: {
      md: {
        width: "920px",
        fields: "15px"
      },
      sm: {
        width: "720px"
      },
      xs: {
        width: "576px"
      },
      xxs: {
        width: "420px"
      }
    },
  }

  smartgrid('./app/less', settings);
  done();
}

const build = gulp.series(clear,
  gulp.parallel(html, styles, scripts, images, fonts)
);

gulp.task('build', build);
gulp.task('watch', gulp.series(build, watch));

gulp.task('grid', grid);