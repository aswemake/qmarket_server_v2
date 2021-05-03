const jwt = require('jsonwebtoken');
const resMessage = require('../module/response/responseMessage'); // 응답 메시지
const statusCode = require('../module/response/statusCode'); // 응답 코드
const utils = require('../module/response/utils'); // 응답 코드, 응답 메시지를 전달하는 모듈
const options = {
	algorithm: "HS256", // 알고리즘 종류
	expiresIn: "14d", // 만료 기간
	issuer: "seongjin" // 발행자
};

// sign 함수 : JWT 토큰을 발행하는 함수
exports.sign = (user) => { // 'DB에서 조회한 user'를 인자로 받는다.
	// payload : JWT 토큰에 담을 내용
	const payload = {
		user_idx: user.user_idx,
		authType: user.authType,
		email: user.email
	};
	// sign 함수 : JWT 토큰을 발행하는 함수
	// 첫 번째 인자(payload) : JWT 토큰에 담은 내용
	// 두 번째 인자(secretOrPrivateKey) : JWT를 암호화시킬 비밀번호
	// 세 번째 인자(options) : 기타 옵션
	const token = jwt.sign(payload, process.env.JWT_SECRET, options)
	return token;
}

// verify 함수 : JWT 토큰을 해독하는 함수
const verify = (token) => {
	try {
		// verify 함수 : JWT 토큰을 해독하는 함수
		// 첫 번째 인자(token) : 해독할 JWT 토큰
		// 두 번째 인자(secretOrPublicKey) : JWT를 암호화시켰던 비밀번호
		// 출력값 : JWT 토큰에 담겨있었던 payload
		let decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
		// console.log(decodedPayload)
		return decodedPayload;
	} catch (err) {
		console.log('에러 던지기!!')
		throw err
	}
}
exports.verify = verify;

// 대부분의 라우터에 쓰이므로, 사용하기 쉽게 미들웨어 형태(req, res, next를 인자로 받는 함수)로 만들었다.
// 미들웨어의 기능
// 1. token이 있는지 없는지 확인
// - token이 있다면 verify 함수를 이용해서 JWT 토큰의 정보를 해독

// 2.1. token이 있다면 verify 함수를 이용해서 JWT 토큰의 정보를 해독
// && 해독한 정보를 req.decoded에 할당해서, 다음 미들웨어에서 쓸 수 있도록 만들기
// (req.decoded가 있는지 없는지를 통해서 로그인 유무를 확인하는 용도로 쓸 수 있다.)

// 2.2. token이 없다면 에러 응답 메시지 출력

// 3. token은 있는데, 만료된 token이거나 잘못된 token일 경우 에러 응답 메시지 출력
exports.isLoggedIn = async(req, res, next) => {
	try {
		const token = req.headers.token;
		if (!token) {
			//토큰이 헤더에 없으면
			return res.json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.EMPTY_TOKEN));
		} else {
			//만든 jwt 모듈 사용하여 토큰 확인
			const user = verify(token);
			req.decoded = user;
			next();
		}
	} catch (err) {
		console.log('verify에서 throw한 err를 받음');
		if (err.name === 'TokenExpiredError') {
			res.json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.EXPRIED_TOKEN));
		} else if (err.name === 'JsonWebTokenError') {
			res.json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.INVALID_TOKEN));
		} else {
			res.json(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.INVALID_TOKEN))
		}
	}
};