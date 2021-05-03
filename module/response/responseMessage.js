module.exports = {
    // CRUD
    SAVE_SUCCESS: "데이터 저장 성공",
    READ_SUCCESS: "데이터 조회 성공",
    DELETE_SUCCESS: "데이터 삭제 성공",
    UPDATE_SUCCESS: "데이터 수정 성공",
    
    // 토큰
    VERIFY_TOKEN: "유효한 토큰입니다.",
    EXPIRED_TOKEN: "토큰이 만료되었습니다.",
    INVALID_TOKEN: "유효하지 않은 토큰입니다.",
    EMPTY_TOKEN: "입력된 토큰이 없습니다.",

    // 응답 메시지
    NULL_VALUE: "Params나 Body 중 필수적으로 입력해야 하는 값인데, 입력하지 않은 값(NULL)이 존재합니다.",
    NULL_PRODUCT: "해당상품이 존재하지 않습니다.",
    WRONG_PARAMS: "Params나 Body에 잘못된 값이 입력되어서 조회(or 쓰기 or 수정 or 삭제)할 데이터가 없습니다. (또는 서버의 DB에 데이터를 넣지 않아서 발생하는 에러일 수도 있습니다.)",
    INTERNAL_SERVER_ERROR: "서버 측에서 발생한 에러입니다.",
    NULL_ORDER: "주문내역이 없습니다",
    NULL_MISSION: "등록된 미션이 없습니다",
    NULL_NOTIFICATION: "등록된 큐알림이 없습니다",
    NULL_DELETE: "삭제할 데이터가 없습니다",
    NULL_UPDATE: "업데이트할 데이터가 없습니다",
    
    // 로그인 및 회원가입
    ALREADY_USER: "중복된 이메일이 존재합니다.",
    NULL_USER: "로그인 하지 않은 사용자입니다.",
    INVALID_PASSWORD: "비밀번호가 일치하지 않습니다.",
    LOGIN_SUCCESS: "로그인 성공",
    UNAUTHORIZED: "관리자 승인이 필요합니다.",

    // 수량 변화
    MINIMUM: "수량을 0개 이하로 감소시킬 수 없습니다.",
    MAXIMUM: "수량을 100개 이상으로 증가시킬 수 없습니다.",

    // 정기 배송 관련
    WRONG_DAY: "날짜이기 때문에 1~31 범위의 값만 넣을 수 있습니다.",
    ALREADY_CANCEL: "이미 정기 배송이 취소 되어있습니다.",

    // /product/regular 라우팅
    SEARCH_OR_CATEGORY: "query parameter에서 search나 category 중 하나의 파라미터만 입력해야 합니다. 둘 다 NULL이거나 둘 다 값을 입력할 수는 없습니다.",

    // 카드 승인 관련
    APPROVAL_SUCCESS: "주문에 대한 카드 결제가 정상적으로 완료되었습니다.",
    APPROVAL_FAIL: "주문에 대한 카드 결제가 실패하였습니다",
    REFUND_REQUEST_SUCCESS: "환불요청이 정상적으로 신청되었습니다",
    REFUND_REQUEST_FAIL: "환불요청에 실패하였습니다",
    REFUND_SUCCESS: "환불이 정상적으로 완료되었습니다",
    REFUND_FAIL: "환불에 실패하였습니다",

    // 반상회 관련
    PARTY_JOIN_SUCCESS: "반상회 참가 신청이 완료되었습니다.",
    PARTY_JOIN_FAIL: "이미 신청되어있는 회원입니다.",
    PARTY_JOIN_MAX: "반상회 참가 인원이 최대 인원을 초과하였습니다.",


     SAVE_LIKES: "좋아요 설정 성공",
     DELETE_LIKES: "좋아요 해제 성공",
    // LOGIN_SUCCESS: "로그인 성공",
    // SIGNUP_SUCCESS: "회원가입 성공",



    // TOO_MANY_FILES: "첨부 가능한 파일 개수를 확인해주세요.",
    
    // FORBIDDEN_USER: "데이터를 작성한 사용자만 수정 및 삭제할 수 있습니다.",

    
    

    // NEED_LOGIN: "로그인이 필요합니다.",
    // ALREADY_LOGIN: "이미 로그인을 한 상태입니다.",

    SAVE_FAIL: "데이터 저장 실패",
    READ_FAIL: "데이터 조회 실패",

    // NULL_VALUE: "필요한 값이 없습니다",
    // OUT_OF_VALUE: "파라미터 값이 잘못되었습니다",
    // ID_OR_PW_NULL_VALUE: "아이디/비밀번호 값이 없습니다.",
    // CREATED_USER: "회원 가입 성공",
    // DELETE_USER: "회원 탈퇴 성공",

    // ALREADY_USER: "이미 회원입니다.",
    // NO_USER: "존재하지 않는 회원입니다.",
    // MISS_MATCH_PW: "비밀번호가 맞지 않습니다.",
    // LOGIN_SUCCESS: "로그인 성공",
    // LOGIN_FAIL: "로그인 실패",



    // INSUFFICIENT_IMAGES: "이미지가 2개 이상이 아닙니다.",
    

    // STUDENT_SELECT_SUCCESS: "학생 조회 성공",
    // NO_STUDENT: "존재하지 않는 학생입니다",
    // STUDENT_SELECT_FAIL: "학생 조회 실패",
};