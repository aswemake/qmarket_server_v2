const passport = require('passport');
const NaverStrategy = require('passport-naver').Strategy;
const axios = require('axios');

const pool = require('./dbConfig');
const secret_config = require('./secret');
const responseMessage = require('../module/response/responseMessage');

module.exports = () => {
    passport.serializeUser((user, done) => { // Strategy 성공 시 호출됨 / done을 return처럼 생각
        //사용자의 정보(user)가 세션에 저장
        done(null, user); // 여기의 user가 deserializeUser의 첫 번째 매개변수로 이동
        console.log('ser');
    });

    passport.deserializeUser((user, done) => { // 매개변수 user는 serializeUser의 done의 인자 user를 받은 것 -> 동일시 해야 함
        //로그인에 성공하게 되면 Session정보를 저장을 완료했기에 이제 페이시 접근 시마다 사용자 정보를 갖게 Session에 갖게 해줌
        done(null, user);
        console.log(user);
        console.log('des');
    });

    passport.use(new NaverStrategy({
        clientID: secret_config.federation.naver.clientId,
        clientSecret: secret_config.federation.naver.secretId,
        callbackURL: secret_config.federation.naver.callbackUrl
    }, async (accessToken, refreshToken, profile, done) => {
        var _profile = profile._json;
        console.log('Naver login info');
        console.log(_profile);

        const getInfo = await axios({
            url: `https://openapi.naver.com/v1/nid/me`,
            method: "GET", // GET method
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (typeof _profile.profile_image == 'undefined') {
            var img = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/기본프로필사진.png';
        } else {
            var img = _profile.profile_image
        }
        if (typeof _profile.age == 'undefined') {
            var age = null;
        } else {
            var age = _profile.age;
        }
        if (typeof _profile.birthday == 'undefined') {
            var birthday = null;
        } else {
            var birthday = _profile.birthday;
        }
        if (!getInfo.data.response.gender) {
            var gender = null;
        } else if (getInfo.data.response.gender == 'M') {
            var gender = 1;
        } else {
            var gender = 0;
        }
        try {
            await loginLogic({
                authType: 2,
                email: getInfo.data.response.email,
                name: getInfo.data.response.name,
                nickname: null,
                profile_img: img,
                birth: birthday,
                gender: gender,
                age: age
            }, done);
        } catch (err) {
            console.log("Naver Error => " + err);
            done(err);
        }
    }
    ));

    async function loginLogic(info, done) {
        try {
            console.log(info);
            var connection = await pool.getConnection();
            console.log('process : ' + info.authType);
            const chkUserQuery = 'SELECT * FROM users WHERE email = ?';
            const insertUserQuery = 'INSERT INTO users (authType, name, nickname, email, profile_img, birth, gender, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

            const chkUserResult = await connection.query(chkUserQuery, [info.email]);
            console.log(chkUserResult.length);

            if (!chkUserResult) {
                console.log('chkUser');
                return done(null, false, {
                    message: responseMessage.INTERNAL_SERVER_ERROR
                });
            } else if (chkUserResult.length == 1) { //기존 유저 로그인처리
                done(null, {
                    user_idx: chkUserResult[0].user_idx,
                    authType: chkUserResult[0].authType,
                    email: chkUserResult[0].email
                });
            } else { //신규 유저 회원가입
                console.log('test');
                const insertUserResult = await connection.query(insertUserQuery, [info.authType, info.name, info.nickname, info.email, info.profile_img, info.birth, info.gender, info.age]);
                const chkUserResult = await connection.query(chkUserQuery, [info.email]);
                if (!insertUserResult) {
                    return done(null, false, {
                        message: responseMessage.INTERNAL_SERVER_ERROR
                    });
                } else {
                    done(null, {
                        user_idx: chkUserResult[0].user_idx,
                        authType: chkUserResult[0].authType,
                        email: chkUserResult[0].email
                    });
                }
            }
        } catch (err) {
            console.log(err);
            return done(null, false, {
                message: responseMessage.INTERNAL_SERVER_ERROR
            });
        } finally {
            connection.release();
        }
    }
};