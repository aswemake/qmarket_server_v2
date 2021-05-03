module.exports = {
    federation: {
        facebook: {
            clientId: '페이스북 앱 ID',
            secretId: '앱 시크릿 코드',
            callbackUrl: '/auth/login/facebook/callback'
        },
        kakao: {
            clientId: '924a91810f70ff25316d2a61021a027d',
            callbackUrl: '/auth/login/kakao/callback'
        },
        naver: {
            clientId: 'Ptz_R_Y9zn9Eca3_H_fb',
            secretId: '6OXAezZhny',
            callbackUrl: '/auth/login/naver/callback'
        }
    }
};