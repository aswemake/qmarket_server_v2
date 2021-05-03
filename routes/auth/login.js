var express = require('express');
var router = express.Router();

const passport = require('passport');
const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const axios = require('axios');
const pool = require('../../config/dbConfig');
const jwt = require('../../module/jwt');

// kakao 로그인 구현
router.post('/kakao', async (req, res) => {
    let { accessToken } = req.body;
    if (!accessToken) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            // 사용자 정보 받기
            const getInfo = await axios({
                url: `https://kapi.kakao.com/v2/user/me`,
                method: "GET", // GET method
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (!getInfo.data.kakao_account.age_range) {
                var age = null;
            } else {
                var age = getInfo.data.kakao_account.age_range.replace('~', '-');
                console.log(age);
            }
            if (!getInfo.data.kakao_account.birthday) {
                var birth = null;
            } else {
                var birth = (getInfo.data.kakao_account.birthday.substring(0, 2) + "-" + getInfo.data.kakao_account.birthday.substring(2, 4));
                console.log(birth);
            }
            if (!getInfo.data.kakao_account.gender) {
                var gender = null;
            } else if (getInfo.data.kakao_account.gender == 'male') {
                var gender = 1;
            } else {
                var gender = 0;
            }
            if (getInfo.data.properties.profile_image == undefined) {
                var profile_img = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/기본프로필사진.png'
            } else {
                var profile_img = getInfo.data.properties.profile_image;
            }
            let login_data = {
                authType: 1,
                email: getInfo.data.kakao_account.email,
                id: getInfo.data.id,
                name: null,
                nickname: getInfo.data.properties.nickname,
                profile_img: profile_img,
                birth: birth,
                gender: gender,
                age: age
            }
            try {
                var connection = await pool.getConnection();
                const chkUserQuery = 'SELECT * FROM users WHERE email = ? AND authType = 1';
                const insertUserQuery = 'INSERT INTO users (authType, name, nickname, email, profile_img, birth, gender, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

                const chkUserResult = await connection.query(chkUserQuery, [login_data.email]);
                console.log(chkUserResult.length);
                if (!chkUserResult) {

                } else if (chkUserResult.length == 1) { //기존 유저 로그인처리
                    if (getInfo.data.kakao_account.profile.profile_image_url) {
                        let new_profile_img = getInfo.data.kakao_account.profile.profile_image_url;
                        let updateQuery = 'UPDATE users SET profile_img = ? WHERE user_idx = ?';
                        if (chkUserResult[0].profile_img != new_profile_img) {
                            let dataString = `properties={"profile_image":"${new_profile_img}"}`;
                            const update_kakao_Profile = await axios({
                                url: `https://kapi.kakao.com/v1/user/update_profile`,
                                method: "POST", // POST method
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                                },
                                data: dataString
                            });
                            let updateProfile = await connection.query(updateQuery, [new_profile_img, chkUserResult[0].user_idx]);
                        }
                    } else if (!getInfo.data.kakao_account.profile.profile_image_url) {
                        let updateQuery = 'UPDATE users SET profile_img = ? WHERE user_idx = ?';
                        let new_profile_img = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/기본프로필사진.png';
                        let updateProfile = await connection.query(updateQuery, [new_profile_img, chkUserResult[0].user_idx]);
                    }
                    let user_info = {
                        user_idx: chkUserResult[0].user_idx,
                        authType: chkUserResult[0].authType,
                        email: chkUserResult[0].email
                    }
                    let data = {
                        token: jwt.sign(user_info)
                    }
                    res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.LOGIN_SUCCESS, data));
                } else { //신규 유저 회원가입
                    const insertUserResult = await connection.query(insertUserQuery, [login_data.authType, login_data.name, login_data.nickname, login_data.email, login_data.profile_img, login_data.birth, login_data.gender, login_data.age]);
                    const chkUserResult = await connection.query(chkUserQuery, [login_data.email]);
                    if (!insertUserResult) {
                        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
                    } else {
                        let user_info = {
                            user_idx: chkUserResult[0].user_idx,
                            authType: chkUserResult[0].authType,
                            email: chkUserResult[0].email
                        }
                        let data = {
                            token: jwt.sign(user_info)
                        }
                        res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.LOGIN_SUCCESS, data));
                    }
                }
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

// apple 로그인
router.post('/apple', async (req, res) => {
    let { name, email, apple_idx } = req.body;
    if (!apple_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            // 기존 회원 여부 쿼리문
            let query = 'SELECT EXISTS (SELECT * FROM users WHERE apple_idx = ?) as success';
            // 회원 정보 쿼리문
            let find_user_query = 'SELECT user_idx, email, authType FROM users WHERE apple_idx = ?';
            // 신규 회원 가입 쿼리문
            let query2 = 'INSERT INTO users (authTYPE, name, email, apple_idx, profile_img) VALUES (3,?,?,?,?)';
            let find_user = await connection.query(query, [apple_idx]);
            console.log(find_user[0].success);
            // 기존 회원일 경우
            if (find_user[0].success === 1) {
                let check_user = await connection.query(find_user_query, [apple_idx]);
                if (check_user.length == 1) {
                    let user_info = {
                        user_idx: check_user[0].user_idx,
                        authType: check_user[0].authType,
                        email: check_user[0].email
                    }
                    let data = {
                        token: jwt.sign(user_info)
                    }
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, data));
                }
                // 신규 회원일 경우
            } else {
                if (!name || !email) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
                } else {
                    var profile_img = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/기본프로필사진.png';
                    console.log(name);
                    let fullName = (name.familyName + name.givenName);
                    console.log(fullName);
                    let insertUser = await connection.query(query2, [fullName, email, apple_idx, profile_img]);
                    let check_user = await connection.query(find_user_query, [apple_idx]);
                    if (check_user.length == 1) {
                        let user_info = {
                            user_idx: check_user[0].user_idx,
                            authType: check_user[0].authType,
                            email: check_user[0].email
                        }
                        let data = {
                            token: jwt.sign(user_info)
                        }
                        res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.LOGIN_SUCCESS, data));
                    }
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// naver 로그인
router.get('/naver',
    passport.authenticate('naver')
);
// naver 로그인 연동 콜백
router.get('/naver/callback',
    passport.authenticate('naver', {
        successRedirect: '/auth/login/success',
        failureRedirect: '/auth/login/fail'
    })
);

router.get('/success', (req, res) => {
    console.log('success');
    const userSession = req._passport.session;
    const userInfo = {
        user_idx: userSession.user.user_idx,
        authType: userSession.user.authType,
        email: userSession.user.email
    }
    let data = {
        token: jwt.sign(userInfo)
    };
    console.log(data);
    req.session.destroy();
    res.render('login_success', { data });
});

router.get('/fail', (req, res) => {
    console.log('fail');
    res.render('login_false');
});

module.exports = router;