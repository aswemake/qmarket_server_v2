// login.ejs의 login fucntion 잠시 빼놨음 추후 수정

// s3 이미지 업로드
async function addPhoto() {
    var BucketName = "sopt.seongjin.com";
    var bucketRegion = "ap-northeast-2";
    var IdentityPoolId = "ap-northeast-2:e567daad-b0b7-4b0a-a470-ccedafe0758d";
    AWS.config.update({
        "accessKeyId": "AKIAW55266QUGCJAGPYK",
        "secretAccessKey": "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",
        "region": "ap-northeast-2"
    }) 
    var files = document.getElementById("image_main").files;
    if (!files.length) {
        return alert("이미지를 업로드해 주세요.");
    }
    var is_success = false;
    for(var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileName = file.name;
        // Use S3 ManagedUpload class as it supports multipart uploads
        var upload = new AWS.S3.ManagedUpload({
            params: {
                Bucket: BucketName,
                Key: fileName,
                Body: file,
                ACL: "public-read"
            }
        });
        var promise = upload.promise();
        await promise.then(
            function(data) {
                console.log(data);
                is_success = true;
            },
            function(err) {
                console.log(err);
                is_success = false;
            }
        );
    }
    files = document.getElementById("image_detail").files;
    if (!files.length) {
        return alert("이미지를 업로드해 주세요.");
    }
    var is_success = false;
    for(var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileName = file.name;
        // Use S3 ManagedUpload class as it supports multipart uploads
        var upload = new AWS.S3.ManagedUpload({
            params: {
                Bucket: BucketName,
                Key: fileName,
                Body: file,
                ACL: "public-read"
            }
        });
        var promise = upload.promise();
        await promise.then(
            function(data) {
                console.log(data);
                is_success = true;
            },
            function(err) {
                console.log(err);
                is_success = false;
            }
        );
    }
    if(is_success) {
        alert("성공!");
    } else {
        alert("사진을 업로드 하던 도중 문제가 발생했습니다.\n");
    }
}

//영수증 폼
function receipt(i) {
    var data = JSON.parse(i);
    var order_time = new Date(data.order_date).toISOString().substring(0,19).replace('T',' / ');
    var objWin = window.open('', 'print');
    objWin.document.write("<!doctype html>");
    objWin.document.write("<html>");
    objWin.document.write("<head>");
    objWin.document.write("<style>");
    objWin.document.write("body {width: 100%;height: 100%;margin: 0;padding: 0;background-color: #ddd;}");
    objWin.document.write("* {box-sizing: border-box;-moz-box-sizing: border-box;}");
    objWin.document.write(".paper {width: 80mm;min-height: 297mm;padding: 5mm; margin: 10mm auto;border-radius: 5px;background: #fff;box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);}");
    objWin.document.write(".title {text-align : center; font-size : 180%}");
    objWin.document.write(".clearfixed::after{display : block; content : ''; clear : both}");
    objWin.document.write(".f_left {float : left;}");
    objWin.document.write(".f_right {float : right;}");
    objWin.document.write(".text_Center {text-align : center;}");
    objWin.document.write(".pro_count_price {float : right; width : 40mm}");
    objWin.document.write(".pro_count {text-align : right; float : right;  width : 15mm;}");
    objWin.document.write(".pro_price {text-align : right; float : right;  width : 25mm;}");
    objWin.document.write(".pro_sale_title {text-align : center; float : left;  width : 40mm;}");
    objWin.document.write(".pro_sale {text-align : right; float : right;  width : 40mm;}");
    objWin.document.write(".total_title {text-align : center; font-size : 120%; float : left;  width : 30mm;}");
    objWin.document.write(".total_center {text-align : center; font-size : 120%; float : left;  width : 10mm;}");
    objWin.document.write(".total_price {text-align : right; font-size : 120%; float : right;  width : 40mm;}");
    objWin.document.write(".last_title {text-align : center; font-size : 150%; float : left;  width : 30mm;}");
    objWin.document.write(".last_center {text-align : center; font-size : 150%; float : left;  width : 10mm;}");
    objWin.document.write(".last_price {text-align : right; font-size : 150%; float : right;  width : 40mm;}");
    objWin.document.write("@page {size: auto;margin: 0;}");
    objWin.document.write("@media print {");
    objWin.document.write("html, body {width: 90mm;height: 297mm;background: #fff;}");
    objWin.document.write(".paper {margin: 0;border: initial;border-radius: initial;width: initial;min-height: initial;box-shadow: initial;background: initial;page-break-after: always;}");
    objWin.document.write("}");
    objWin.document.write("</style>");
    objWin.document.write("</head>");
    objWin.document.write("<body>");
    objWin.document.write("<div>");
    objWin.document.write("<div class = 'paper'>");
    objWin.document.write("<div class = 'title'>영수증</div>"); 
    objWin.document.write("<div>----------------------------------------------</div>");
    //----------------------주문정보--------------------------
    objWin.document.write("<div>주문ID   : ");
    if(data.order_id != null){
        objWin.document.write(data.order_id);
    }
    objWin.document.write("</div>");
    objWin.document.write("<div>주문시간 : ");
    if(order_time != null){
        objWin.document.write(order_time);
    }
    objWin.document.write("</div>");
    objWin.document.write("<div>수령인   : ");
    if(data.receiver != null){
        objWin.document.write(data.receiver);
    }
    objWin.document.write("</div>");
    objWin.document.write("<div>주소     : ");
    if(data.address != null){
        objWin.document.write(data.address);
    }
    objWin.document.write("</div>");
    objWin.document.write("<div>공동현관 : ");
    if(data.home_pwd != null){
        objWin.document.write(data.home_pwd);
    }
    objWin.document.write("</div>");
    objWin.document.write("<div>배송메모 : ");
    if(data.delivery_memo != null){
        objWin.document.write(data.delivery_memo);
    }
    objWin.document.write("</div>");
    objWin.document.write("<div>주문자 연락처 : ");
    if(data.phone != null){
        objWin.document.write(data.phone);
    }
    objWin.document.write("</div>");
    objWin.document.write("<div>----------------------------------------------</div>");
    //----------------------카테고리-------------------------------
    objWin.document.write("<div class = 'clearfixed'>");
    objWin.document.write("<div class = 'f_left'>품목</div>");
    objWin.document.write("<div class = 'pro_price'>금액</div>");
    objWin.document.write("<div class = 'pro_count'>수량</div>");
    objWin.document.write("</div>");
    objWin.document.write("<div>----------------------------------------------</div>");
    //---------------------품목, 수량 및 가격----------------------------
    for(var j = 0; j < data.products.length; j++){
        objWin.document.write("<div class = 'clearfixed'>");
        objWin.document.write("<div>" + (j+1) + ". " + data.products[j].name + "</div>");
        objWin.document.write("<div class = 'pro_count_price'>");
        objWin.document.write("<div class = 'pro_price'>" + number_WithCommas(data.products[j].original_price) + "</div>");
        objWin.document.write("<div class = 'pro_count'>" + number_WithCommas(data.products[j].count) + "</div>");
        objWin.document.write("</div>");
        objWin.document.write("</div>");
        if(data.products[j].original_price - data.products[j].saled_price > 0){
            objWin.document.write("<div class = 'clearfixed'>");
            objWin.document.write("<div class = 'pro_sale_title'>ㄴ할인</div>");
            objWin.document.write("<div class = 'pro_sale'>" + minus_number_WithCommas(data.products[j].original_price - data.products[j].saled_price) + "</div>");
            objWin.document.write("</div>");
        }
    }
    objWin.document.write("<div>----------------------------------------------</div>");
    //----------------------------합계---------------------------------
    objWin.document.write("<div class = 'clearfixed'>");
    objWin.document.write("<div class = 'total_title'>합  계</div>");
    objWin.document.write("<div class = 'total_center'>:</div>");
    objWin.document.write("<div class = 'total_price'>"+ number_WithCommas(data.total_original_price) +"</div>");
    objWin.document.write("</div>");
    objWin.document.write("<div class = 'clearfixed'>");
    objWin.document.write("<div class = 'total_title'>할인금액</div>");
    objWin.document.write("<div class = 'total_center'>:</div>");
    objWin.document.write("<div class = 'total_price'>"+ minus_number_WithCommas(data.total_original_price - data.total_saled_price) +"</div>");
    objWin.document.write("</div>");
    objWin.document.write("<div class = 'clearfixed'>");
    objWin.document.write("<div class = 'total_title'>포 인 트</div>");
    objWin.document.write("<div class = 'total_center'>:</div>");
    objWin.document.write("<div class = 'total_price'>"+ minus_number_WithCommas(data.qmoney) +"</div>");
    objWin.document.write("</div>");
    objWin.document.write("<div class = 'clearfixed'>");
    objWin.document.write("<div class = 'total_title'>배 송 비</div>");
    objWin.document.write("<div class = 'total_center'>:</div>");
    objWin.document.write("<div class = 'total_price'>"+ plus_number_WithCommas(data.delivery_price) +"</div>");
    objWin.document.write("</div>");
    objWin.document.write("<div class = 'clearfixed'>");
    objWin.document.write("<div class = 'last_title'> 결제금액</div>");
    objWin.document.write("<div class = 'last_center'>:</div>");
    objWin.document.write("<div class = 'last_price'>" + number_WithCommas(data.payment) + "</div>");
    objWin.document.write("</div>");
    objWin.document.write("<div>----------------------------------------------</div>");
    //-----------------------------마트 정보---------------------------------------
    objWin.document.write("<div>마트 주소 : " + data.partner_address + "</div>");
    objWin.document.write("<div>마트 사업자 번호 : " + data.partner_business_registration_number + "</div>");
    objWin.document.write("<div>마트 대표 : " + data.partner_name + "</div>");
    objWin.document.write("<div>----------------------------------------------</div>");
    objWin.document.write("<div>고객정보를 배송목적 외 사용하거나 보관, 공개할 경우 법적 처벌을 받을 수 있습니다.</div>");
    objWin.document.write("<div>----------------------------------------------</div>");
    objWin.document.write("<div>고객문의사항은 카카오톡 플러스친구 큐마켓 또는 0507-1314-9657로 연락주세요.</div>");
    objWin.document.write("<div>----------------------------------------------</div>");
    objWin.document.write("<div class = 'text_Center'>이용해 주셔서 감사합니다.</div>");
    objWin.document.write("</div>");
    objWin.document.write("</div>");
    objWin.document.write("</body>");
    objWin.document.write("</html>");
    objWin.focus();
    objWin.document.close();
    objWin.print();
    objWin.close();
}
function number_WithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function minus_number_WithCommas(number) {
    if(number == 0){
        return "0"
    }
    else{
        return "-" + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}
function plus_number_WithCommas(number) {
    if(number == 0){
        return "0"
    }
    else{
        return "+" + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

//중단 카테고리 로드 function
function child_category_change(category1){
    let category_1 = [
                      ["전체"],
                      
                      ["정육/계란", "두부/콩나물", "채소", "과일", "쌀/잡곡", "수산/건어", "유제품/냉장", "생수/음료", "커피/차"],
                      
                      ["간편식/반찬", "과자/디저트/견과류", "라면/양념/장"],
                      
                      ["생활/주방", "위생/뷰티", "여성/유아"],

                      ["기타"],

                      ["밀키트", "마카롱/디저트", "커피/원두", "꽃/화분", "식기/주방세트", "와인키트", "에코백/업사이클", 
                        "비누/천연제품", "카메라", "전통주키트", "브런치/샐러드", "혼밥키트", "ProHealther", "Salon 21", "24 SEASON"]
                     ];

    let category_2 = [
                      ["전체"],
                      
                      ["돼지고기", "소고기", "닭/오리고기", "계란/메추리알", "기타정육", "가공정육/특수부위"],

                      ["즉석밥/죽/누룽지", "반찬/김", "김치/단무지", "카레/짜장/스프", 
                       "국/탕/찌개", "만두/피자/냉동", "떡/떡볶이/떡국", "통조림/간편조리"],

                      ["화장지/물티슈/일회용품", "주방/생활용품", "세안/욕실용품", "청소/세탁용품", 
                       "생활가전/충전기", "건전지/공구/형광등", "잡화/장난감", "문구/학용품", "성인용품"],

                      ["기타"],

                      ["전체"]
                     ];                
    var selected_value = category1.options[category1.selectedIndex].value;
    var parent_idx = parseInt(selected_value);

    var target1 = document.getElementById("child_category");
    var child_category;

    child_category = category_1[parseInt(selected_value)];
    console.log(child_category);

    target1.options.length = 0;

    for (category_num in child_category) {
        var opt = document.createElement("option");
        opt.value = (parent_idx * 100) + parseInt(category_num);
        opt.innerHTML = child_category[category_num];
        target1.appendChild(opt);
    }
    
    var target2 = document.getElementById("grand_child_category");
    var grand_child_category;

    grand_child_category = category_2[parseInt(selected_value)];
    console.log(grand_child_category);

    target2.options.length = 0;

    for (category_num in grand_child_category) {
        var opt = document.createElement("option");
        opt.value = (parent_idx * 100) + parseInt(category_num);
        opt.innerHTML = grand_child_category[category_num];
        target2.appendChild(opt);
    }
}
//최하위 카테고리 로드 function
function grand_child_category_change(category2){
    let category = [
                    [["전체"]],

                    [["돼지고기", "소고기", "닭/오리고기", "계란/메추리알", "기타정육", "가공정육/특수부위"],
                     ["두부/묵", "콩나물/숙주"],
                     ["양파/파/마늘/생강", "시금치/나물/부추/미나리", "고추/쌈채소", "버섯", "감자/고구마/마/더덕/도라지", "배추/무/김장채소", 
                      "오이/호박/가지/옥수수", "양상추/양배추/샐러드", "당근/우엉/연근", "파프리카/브로콜리/피망", "기타채소"],
                     ["사과/배/감", "딸기/바나나/복숭아/자두", "참외/감귤/오렌지/수박", "토마토/포도/기타", "키위/메론/수입과일", "냉동/간편과일"],
                     ["쌀/찹쌀", "현미/보리", "콩/잡곡"],
                     ["고등어/갈치/삼치", "연어/명태/대구/기타생선", "회/초밥", "새우/해물", "어묵/맛살", "미역/다시마/해조류", "건어물"], 
                     ["우유/두유", "요거트/요구르트", "치즈/버터/마가린", "햄/소시지/베이컨", "기타유제품"], 
                     ["생수", "주스", "탄산수/탄산음료", "건강/이온", "어린이음료"], 
                     ["커피/티", "커피믹스/원두/코코아", "보리차/녹차/전통차", "분말/파우더/에이드", "원액/청/꿀", "캡슐커피/커피용품"]],

                    [["즉석밥/죽/누룽지", "반찬/김", "김치/단무지", "카레/짜장/스프", 
                      "국/탕/찌개", "만두/피자/냉동", "떡/떡볶이/떡국", "통조림/간편조리"], 
                     ["스낵/쿠키", "초콜릿/씨리얼", "사탕/껌/젤리", "아이스크림/얼음", "빵/샌드위치/잼", "디저트/푸딩", "견과류/건과"], 
                     ["라면", "기타 면류", "장류/소스류", "조미료/향신료", "참기름/식용유", "밀가루/부침/튀김가루"]],

                    [["화장지/물티슈/일회용품", "주방/생활용품", "세안/욕실용품", "청소/세탁용품", 
                      "생활가전/충전기", "건전지/공구/형광등", "잡화/장난감", "문구/학용품", "성인용품"], 
                     ["헤어/바디용품", "화장품/뷰티", "방향제/탈취제/방충제/제습제", "마스크/의약외품/소독제",
                      "속옷/양말/스타킹", "건강기능식품", "반려동물용품"], 
                     ["생리대/기저귀", "유아식/유아용품"]],

                    [["기타"]],

                    [["전체"], ["전체"], ["전체"], ["전체"], ["전체"], ["전체"], ["전체"], ["전체"], ["전체"],
                     ["전체"], ["전체"], ["전체"], ["전체"], ["전체"], ["전체"], ["전체"]]
                   ];
    
    var selected_text = category2.options[category2.selectedIndex].text;
    var selected_value = category2.options[category2.selectedIndex].value;
    var selected_parent_value = parseInt(parseInt(selected_value)/100);
    var selected_child_value = parseInt(selected_value)%100;

    var target = document.getElementById("grand_child_category");
    
    var grand_child_category = category[selected_parent_value][parseInt(selected_child_value)];
    console.log(grand_child_category);

    target.options.length = 0;

    for (category_num in grand_child_category) {
        var opt = document.createElement("option");
        opt.value = category_num;
        opt.innerHTML = grand_child_category[category_num];
        target.appendChild(opt);
    }	
}

//상품 검색
function products_search(partner_id, obj){

    var URL = "/manager/" + partner_id + "/products/management?page=1";
    var keyword = document.getElementById("search");
    var category1 = document.getElementById("parent_category");
    var category2 = document.getElementById("child_category");
    var category3 = document.getElementById("grand_child_category");
    console.log(keyword.value);
    console.log(category1.options[category1.selectedIndex].text);
    console.log(category2.options[category2.selectedIndex].text);
    console.log(category3.options[category3.selectedIndex].text);
    
    if(keyword.value !== ""){
        URL = URL + "&keyword=" + keyword.value;
    }
    if(category1.options[category1.selectedIndex].text === "전체"){}
    else if(category2.options[category2.selectedIndex].text === "전체"){
        URL = URL + "&category=" + category1.options[category1.selectedIndex].text;
    }
    else if(category3.options[category3.selectedIndex].text === "전체"){
        URL = URL + "&category=" + category2.options[category2.selectedIndex].text;
    }
    else {
        URL = URL + "&category=" + category3.options[category3.selectedIndex].text;
    }
    console.log(URL)

    document.getElementById('content').src = URL;
}

function products_move_page(partner_id, current_category, current_keyword, a_tag){
    var num = a_tag.text.replace(/(\s*)/g, "")
    var URL = "/manager/" + partner_id + "/products/management?page=" + num;
    
    var keyword = current_keyword;
    var category = current_category;
    console.log("keyword : " + keyword)
    console.log("category : " + category)

    if(keyword){
        URL = URL + "&keyword=" + keyword;
    }
    if(category){
        URL = URL + "&category=" + category;
    }
    console.log(URL)

    var xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            window.location.href = xhttp.responseURL;
        }
    }
    xhttp.open("GET", URL)
    xhttp.setRequestHeader("Content-Type", "application/json")
    xhttp.send();
}
//상품 등록 엑셀 파일 업로드 함수

function onfilechange(file, id) {
    console.log(file.files[0].name.split('.').pop());
    var file_val = file.files[0].name;
    if (id == 'image_detail_name') {
        file_val = file.files[0].name + " 외" + (file.files.length - 1) + "개";
    }
    document.getElementById(id).value = file_val;
}

function renameKey(obj, oldKey, newKey) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
}

async function sendExcelFile(idx) {
    try {
        let input = document.getElementById('product_excel');
        let reader = new FileReader();
        let partner_idx = idx;
        let url = "/manager/" + partner_idx + "/enroll_excel";
        reader.onload = function () {
            let data = reader.result;
            let workBook = XLSX.read(data, { type: 'binary' });
            workBook.SheetNames.forEach(function (sheetName) {
                console.log('SheetName: ' + sheetName);
                let rows = XLSX.utils.sheet_to_json(workBook.Sheets[sheetName]);
                rows.forEach(object => {
                    renameKey(object, '바코드', 'barcode');
                    renameKey(object, '상품이름', 'detail_name');
                    renameKey(object, '규격', 'standard');
                    renameKey(object, '상품 브랜드 이름', 'name');
                    renameKey(object, '상품 카테고리', 'category');
                    renameKey(object, '상품 원가', 'price');
                    renameKey(object, '상품 할인율', 'sale_ratio');
                    renameKey(object, '상품 재고', 'count');
                    renameKey(object, '해시태그1', 'hashtag1');
                    renameKey(object, '해시태그2', 'hashtag2');
                    renameKey(object, '해시태그3', 'hashtag3');
                    renameKey(object, '메인 이미지', 'main_img');
                    renameKey(object, '상세 이미지', 'detail_img');

                })
                if (confirm("상품을 등록하시겠습니까?")) {
                    var xhttp = new XMLHttpRequest()
                    xhttp.onreadystatechange = function () {
                        if (this.readyState == 4 && this.status == 200) {
                            alert('상품이 성공적으로 등록되었습니다.')
                        }
                    }
                    xhttp.open("POST", url, true)
                    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
                    xhttp.send("file=" + JSON.stringify(rows));
                    //window.location.reload()
                }
            })
        };
        reader.readAsBinaryString(input.files[0]);
    } catch (error) {
        alert(error);
    }
}
// 아래 두개 -> 이벤트 등록, 삭제 스크립트 -> 당장은 필요 없어서 주석처리
// function enrollEvent(id) {
//     var event_price = parseInt(prompt('이벤트 가격을 입력해주세요'));
//     if (!(!isNaN(event_price) && 0 < event_price)) {
//         alert("유효하지 않은 가격입니다.")
//     } else {
//         var xhttp = new XMLHttpRequest()
//         var requestBody = {
//             price: event_price
//         }
//         xhttp.onreadystatechange = function () {
//             if (this.readyState == 4 && this.status == 400) {
//                 alert("이벤트 등록에 실패하였습니다.")
//             } else if (this.readyState == 4 && this.status == 202) {
//                 alert("이미 이벤트로 등록되어 있는 상품입니다.")
//             } else if (this.readyState == 4 && this.status == 200) {
//                 alert("이벤트가 정상적으로 등록되었습니다.")
//                 window.location.reload();
//             }
//         }
//         xhttp.open("PUT", "/manager/product/inventory/change/event/register?product_id=" + id);
//         xhttp.setRequestHeader('Content-Type', 'application/json')
//         xhttp.send(JSON.stringify(requestBody))
//     }
// }

// function dismissEvent(id) {
//     if (confirm("이벤트를 해제하시겠습니까?")) {
//         var xhttp = new XMLHttpRequest()
//         var requestBody = {
//             product_id: id,
//         }
//         xhttp.onreadystatechange = function () {
//             if (this.readyState == 4 && this.status == 202) {
//                 alert('이벤트로 등록된 상품이 아닙니다.');
//             } else if (this.readyState == 4 && this.status == 200) {
//                 alert('이벤트가 정상적으로 해제되었습니다.')
//                 window.location.reload();
//             } else if (this.readyState == 4 && this.status == 400) {
//                 alert('이벤트 해제에 실패했습니다.');
//             }
//         }
//         xhttp.open("PUT", "/manager/product/inventory/change/event/terminate");
//         xhttp.setRequestHeader('Content-Type', 'application/json')
//         xhttp.send(JSON.stringify(requestBody));
//     }
// }