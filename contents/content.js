// 1. 단순히 알전체 context 안에 keyword 가 포함되어있는지 확인
// 2. 단순히 전체 context 안에 keyword 가 몇개나 포함되어있는지 확인 (수량)

// 3. 키워드와 유사한 단어가 존재하는지 확인..

var keyword; //스토리지에 저장된 키워드
var keyRe; //정규식패턴화된 키워드
var head;  //페이지로딩하자마자 타이틀
var body;  //페이지로딩하자마자 내용
var matchResult; //위의 것들이 준비되면 알 수있는 매칭결과

var real_score; //위의 것들이 준비되면 알 수 있는 score


// ==========================================================
// // FastAPI 로 데이터를 전달하는 함수
function connectFastAPI(data1, data2, data3) {
    console.log("connectFastAPI() call");
    console.log("data1, data2, data3 : ", data1, data2, data3);
    // 서버에 요청을 보내는 코드
    fetch('http://127.0.0.1:8000/api/preprocessing/list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data1, data2, data3 }), // 추출한 데이터를 서버로 전송
    })
    .then(response => {
        // 응답 처리
        if (response.ok) {
            return response.json(); // JSON 데이터로 변환
        }
    })
    .then(data => {
        // 응답 처리
        console.debug("받은 데이터 확인:", data);
        if (data.score <0) {
            real_score = 0;
        }
        real_score = data.score;
        
        // 받은 데이터를 이용한 작업 수행
        // 예: UI 업데이트, 데이터 처리 등
        // getBodyText(data);
    })
    .catch(error => {
        // 오류 처리
        console.log('서버 요청 중 오류가 발생했습니다:', error);
        console.log('서버 없이 유사도 검사를 진행합니다.');
        
        
    });
}



// google페이지가 아닐때, 각 페이지의 헤드라인 뽑기
function getContextTitle() {
    console.log("#Content - getContextTitle() called")
    
    // H태그만 취급
    let allHeadTags = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let allHeadTagsContents = Array.from(allHeadTags).map(heading => heading.textContent);
    if(allHeadTagsContents.length >0) {
        // console.log("allHeadTagsContents : ", allHeadTagsContents, typeof(allHeadTagsContents));
        return allHeadTagsContents;
    } else {
        return [''];
    }                                                                      
}


// const news = document.querySelector('article').innerText;
// console.log(news);



function getContextContents() {
    console.log("#Content - getContextContents() called");
    
    // p 태그와 span 태그만 취급
    let allBodyTags = document.querySelectorAll('p, span');
    let allBodyTagsContents = Array.from(allBodyTags).map(tag => tag.textContent);
    // 나무위키에서 모든 div 태그의 텍스트 추출
    const divContents = Array.from(document.querySelectorAll(' div')).map(div => {
        const textNodes = Array.from(div.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(textNode => textNode.textContent.trim());
            
        return textNodes.join(' ');
    });
    // console.log(divContents, typeof(divContents));

    // 두 배열을 합치기
    const combinedContents = allBodyTagsContents.concat(divContents);
    // console.log(combinedContents, typeof(combinedContents));
  
    if (combinedContents.length > 0) {

        // console.log("allbodyText : ", combinedContents, typeof(combinedContents));
        
        return combinedContents;
    } else {
        return [''];
    }

}

chrome.storage.local.get('storedState', (data) => {
    console.log('#Content - storedState:', data);
    const result = data.storedState;
    console.log(result);
    // storage 에 저장된 keyword 추출
    if(result==='ON') {
        chrome.storage.local.get('keyword', (data) => {
            console.log('#Content - keyword:', data.keyword);
            keyword = data.keyword; //전역
            keyRe = keywordRegExp(keyword);
            console.log("#Content - 정규식패턴 : ", keyRe); //전역
            head = getContextTitle();
            console.log("#Content - head : ", head);  //전역
            body = getContextContents();
            console.log("#Content - body : ", body);  //전역
            checkKeywordBoolean(keyRe,head,body);
            connectFastAPI(keyword, head, body);
        });

    } else {

    }
});

console.log(">>>>> 컨텐츠 js <<<<")


