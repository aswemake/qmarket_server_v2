var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();
var mongoose = require('./schemas');

const session = require('express-session'); // 세션 설정
const passport = require('passport');
const passportConfig = require('./config/passport');

var indexRouter = require('./routes/index');

var app = express();

//helmet 적용
app.use(helmet());

// mongoose 연결
mongoose();

//passport setup
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false })); // 세션 활성화
app.use(passport.initialize()); // passport 구동 (꼭 필요)
app.use(passport.session()); // 세션 연결 (꼭 필요)
passportConfig(); // 이 부분 추가

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({ limit : "50mb" })); 
app.use(express.urlencoded({ limit:"50mb", extended: false }));
app.use(cookieParser(process.env.COOKIE_PASSWORD));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
