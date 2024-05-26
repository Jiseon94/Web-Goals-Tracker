var formattedScore;

// 종합 점수 (p1 + p3) * p2
function requestScore(inverseDepth, res, proTime) {
    console.log("#Con - requestScore() called");
    let alpha = 0.9;
    let beta = (1-alpha);
    ((inverseDepth*alpha) + (proTime*beta))*res
    const num = ((inverseDepth*alpha) + (proTime*beta))*res;
    console.log(num);
    score = num > 0 ? num : 0;
    let roundedScore = Math.round(score * 100);
    formattedScore = roundedScore.toFixed(0); 
    console.log("종합점수..? : ", formattedScore);
    let alertscore = formattedScore;
    if (alertscore < 35 && alertscore>0) {
        // alert("집중 중 입니까?");
    }
    return formattedScore;

}
// 구글 애널리틱스에서 체류 시간은 '페이지 체류 시간'과 '평균 세션 시간'이라는 것이 존재합니다. 각각 [잠재고객-개요]에서 '평균 세션 시간', [행동-개요]에서 '평균 페이지에 머문 시간'을 확인할 수 있습니다.
// 평균체류시간의 기준이 너무나도 제각각 이라서...
// 우선은 쇼핑몰에서 가장 보편적인 체류시간인 2분 38초로 삼겟다..ㅠㅠ
// ============================================================
const mean = 158; // 평균 체류시간(2분38초)
const standardDeviation = 100; // 표준편차

function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    // 상수들
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p =  0.3275911;

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

// 체류시간에 대한 확률분포 CDF
function calculateProbability(siteStayTime, mean, standardDeviation) {
    const z = (siteStayTime - mean) / (standardDeviation * Math.sqrt(2));

    // 정규 분포의 CDF 근사치 반환
    return (1 + erf(z)) / 2;
}


// ==============================================================

var durationTime; //실제 머문 시간
var proTime;  //확률값..

// 
function getDateString(nDate){
    let nDateDate=nDate.getDate();
    let nDateMonth=nDate.getMonth()+1;
    let nDateYear=nDate.getFullYear();
    if(nDateDate<10){nDateDate="0"+nDateDate;};
    if(nDateMonth<10){nDateMonth="0"+nDateMonth;};
    let presentDate = nDateYear+"-"+nDateMonth+"-"+nDateDate;
    return presentDate;
}

// 페이지 말고 탭 아이디로 저장
function stayTimeUpdate() {
    console.log("#score - stayTimeUpdate() called");
    let today = new Date();
    let presentDate = getDateString(today);
    console.log("#score - getDateString(today) called: ", presentDate);
    chrome.storage.local.get(presentDate,function(storedObject){
        // 현재는 {brunch.co.kr: 70, hgk5722.tistory.com: 62, www.google.com: 15}brunch.co.kr: 70hgk5722.tistory.com: 62www.google.com: 15[[Prototype]]: Object
        //이런식으로 나옴.. -> tab.id 를 통해서 매번, 내가 현재 있는 탭의 시간을 뽑아줘야함. 그러므로 백그라운드의 time.js 를 수정해야할 필요가 있음.
        // console.log(storedObject[presentDate]);
        // console.log(storedObject[presentDate][domain]);  //원본
        if(real_score >=0) {
            durationTime = storedObject[presentDate][currentTabId];
            console.log("현재페이지의 탭 id :", currentTabId);
            console.log("현재페이지에서 머무른 시간 :", durationTime);
            proTime = calculateProbability(durationTime, mean, standardDeviation);
            console.log("현재페이지에서 머무른 시간을 확률값으로? :", proTime);
    
            // return proTime;
            console.log("현재페이지의 뎁스의 역수 : ", scaledReciprocal);
            // checkKeywordBoolean(keyword, allText);
            // 서버에서 계산한 값과 단순매칭의 결과를 결합해주기
            let temp_score = (matchResult+real_score)/2 
            if(temp_score <=0 ) {
                temp_score = 0.5
            }
            console.log("서버+클라 점수 취합: ", temp_score);
            score = requestScore(scaledReciprocal, temp_score, proTime);
            console.log("1초간격의 종합점수 : ", score);
        } else {
            durationTime = storedObject[presentDate][currentTabId];
            console.log("현재페이지의 탭 id :", currentTabId);
            console.log("현재페이지에서 머무른 시간 :", durationTime);
            proTime = calculateProbability(durationTime, mean, standardDeviation);
            console.log("현재페이지에서 머무른 시간을 확률값으로? :", proTime);

            // return proTime;
            console.log("현재페이지의 뎁스의 역수 : ", scaledReciprocal);
            // checkKeywordBoolean(keyword, allText);
            console.log("현재페이지의 매치 결과 : : ", matchResult);
            score = requestScore(scaledReciprocal, matchResult, proTime);
            console.log("1초간격의 종합점수 : ", score);
        }
        
    })

}
// 시간을 구하기 위한 key 값이 되는 tabId..
var currentTabId;

// 우선 tabId 를 알아야 머무른 시간을 알 수 있다.
function getTabId() {
    (async () => {
        const response = await chrome.runtime.sendMessage({message: "tabId"});
        
        currentTabId = response.tabId;
        console.log("현재페이지의 탭 id :", currentTabId);

      })();

}
getTabId();
// =======================================================
// 뎁스 구하기
var depth;
var scaledReciprocal; //로그로 구해진 역수

// 완만한 역수를 구하는 방법
function calculateSmoothReciprocal(input) {
    scaledReciprocal = (1 / (1 + Math.log(input)))+0.45; // 로그 함수를 활용하여 완만한 역수 계산
    if (scaledReciprocal >= 1){
        scaledReciprocal = 0.99999;

    }
    console.log(`입력값 - ${input}, 완만한 뎁스의 역수 - ${scaledReciprocal}`);
    return scaledReciprocal;
}

// event.js 에서 받아온 뎁스값
function requestDepth() {
    console.log("#Score - requestDepth() called");

    (async () => {
        const response = await chrome.runtime.sendMessage({message: "depth"});
        console.log(response);
        if(response) {
            depth = response.result;
            // console.log(depth);
            // inverseDepth = (1/depth);
            console.log("현재페이지의 뎁스 : ", depth);
            scaledReciprocal = calculateSmoothReciprocal(depth);
            return scaledReciprocal;
        } else {
            scaledReciprocal = 0.3;  //통신이 잘 안될때..
            return scaledReciprocal;
        }

      })();
}
requestDepth();  //페이지 업로드 될때마다 그냥 준비해놓기..

// =======================================================



// ====================================================
// 매칭 결과
// 서버 O 


// 서버 X===================================

// 종합점수.. contents.js 에서 호출함
// function noServerScore(keyword, title, context) {
//     console.log("#score - currentScale() called");
    
//     let matchResult =  checkKeywordBoolean(keyword, title, context);
//     let depthResult = requestDepth();  //뎁스의 역수 구하기.
//     let stayTime = stayTimeUpdate();
//     console.log("#score - 매칭 :", matchResult, ", deqth : ", depthResult, ", 시간점수 : ", stayTime);
//     let score = requestScore(depthResult, matchResult, stayTime);
//     console.log("#score - 종합점수는? : ", score);
//     return score;
// }



// 키워드 분해 필요
function keywordRegExp(keyword) {
    console.log("#Content - keywordRegExp() called");
    console.log(keyword);
    let keySplit = keyword.replace(/[^ㄱ-ㅎ^ㅏ-ㅣ^가-힣^a-z^A-Z^0-9]/g, '').replace(/\s/gi, '').split('');
    keySplit = keySplit.map((item, index) => (index === 0 ? "\\s*" + item : item));
    keyRe = keySplit.join("\\s*") + "\\s*";

    // for (let i = 0; i < keySplit.length; i++) {
    //     text = keySplit.slice(0, i+1).join("\\s*");
    //     keyRe = new RegExp(text, 'gi');
    // }
    keyRe = new RegExp(keyRe, 'gi');
    console.log("keyRe : ", keyRe);  //  \s*자\s*연\s*어\s*처\s*리\s*
    return keyRe;

}
// 단순히 전체 context 안에 keyword 가 포함되어있는지 확인
function checkKeywordBoolean(keyRe, title, context) {
    console.log("#Content - checkKeywordBoolean() called");

    // title 에서 매칭 확인
    let titleMatch = title.map(title => title.match(keyRe));
    console.log('Matches in texts:', titleMatch);
    // context 에서 매칭 확인
    let contextMatch = context.map(context => context.match(keyRe));
    console.log('Matches in texts:', contextMatch);
    
    // 일부 값이 null이 아닌지 확인하는 함수
    let titleMatchResult = titleMatch.filter(match => match !== null);
    let contextMatchResult = contextMatch.filter(match => match !== null);
    console.log("결과:::: ", titleMatchResult.length, contextMatchResult.length);
    let titleMaNum = titleMatchResult.length;
    let contextMaNum = contextMatchResult.length;

    if (titleMaNum>0 && contextMaNum>0) {
        console.log("#Content - 매치결과 : 1 (실제 매칭수 :", titleMaNum + contextMaNum, ")");
        matchResult = 1;
        return matchResult;
    }else if (titleMaNum>0 || contextMaNum>0) {
        console.log("#Content - 매치결과 : 0.9 (실제 매칭수 :", titleMaNum + contextMaNum, ")");
        matchResult = 0.8;
        return matchResult;
    } else {
        console.log("#Content - 매치결과 : 0");
        matchResult = 0.4;
        return matchResult;
    }

    // if (matchRe !== null) {
    //     matchResult = matchRe.length;
    //     console.log("#Content - 매치결과 : 1 (실제 매칭수 :", matchResult, ")");
    //     matchResult = matchResult > 0 ? 1 : 0;
    // } else {
    //     console.log("#Content - 매치결과 : 0");
    //     matchResult = matchResult > 0 ? 1 : 0;
    // }


}
