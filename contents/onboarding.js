console.log(">>>> option 페이지 열었다.")
// form태그에 반영된 내용을 전부 background.js 에게 넘겨줄 예정.

// HTML 요소 가져오기
const searchButton = document.getElementById('search_button');
const searchInput = document.getElementById('search_input');
const limitHour = document.getElementById('limit-hour');
const limitMin = document.getElementById('limit-min');
const noLimitCheckbox = document.getElementById('no-limit');
const nicknameInput = document.getElementById('nname');
const slider = document.getElementById('myRange');

// 이미 세팅된 키워드 보여주는 요소
const result = document.getElementById('display_keyword');


// limit-hour와 limit-min 입력 시 체크박스 해제
limitHour.addEventListener('input', updateCheckboxVisibility);
limitMin.addEventListener('input', updateCheckboxVisibility);

// 체크박스를 클릭 제어 x
noLimitCheckbox.addEventListener('click', preventUnchecked);


// 입력 값이 있는 경우에만 이벤트 처리
function updateCheckboxVisibility() {
    const hourValue = parseInt(limitHour.value) || 0;
    const minValue = parseInt(limitMin.value) || 0;
  
    if (hourValue !== 0 || minValue !== 0) {
      noLimitCheckbox.checked = false; // '제한 시간 없음' 체크 해제
    } else {
      noLimitCheckbox.checked = true; // '제한 시간 없음' 체크
    }
  }

// '제한 시간 없음' 체크 해제를 막기
function preventUnchecked(event) {
    if (limitHour.value !== '' || limitMin.value !== '') {
      event.preventDefault();
      return false;
    }
}

// 미리 정해놓은 default 값. => 전역으로 두고, 클릭 및 엔터 이벤트 발생하면 함수를 통해 값이 갱신될거다.
var nickname = '웹 서퍼';    // 닉네임
var degree = 50;            // 채점강도
var totalMinutes =0;        //제한시간

// form 태그에 반영된 제한 시간 확인
function checkLimitTime() {
    const noLimit = noLimitCheckbox.checked;

    if (!noLimit) {   // 제한시간 정해놨으면
        const hour = parseInt(limitHour.value) || 0;
        const minute = parseInt(limitMin.value) || 0;
        totalMinutes = hour * 60 + minute;
      }
}

// form 태그에 반영된 닉네임 확인
function checkNickName() {
    nickname = nicknameInput.value;
    if(nickname =='') {
        nickname = '웹 서퍼';
    }
}

// form 태그에 반영된 채점강도 확인
function checkDegree() {
    degree = slider.value;
}

// form 태그에 반영된 키워드 확인
function checkInput(searchInput) {
    // 여기 조건을 더 넣어야하는데,,, 머리가 안돌아간다...ㅠ
    if (searchInput.value === "") {
        alert("검색어를 입력해 주세요.");
        searchInput.focus();
        return Promise.reject("검색어를 입력해 주세요.");
    } else {
        return Promise.resolve(searchInput.value);
    }
}

function sendMessageSetKeyword(result, url) {
    console.log("#Op - keyword 세팅한 사실을 background.js에게 알림");
    // 더불어서, form 태그에 입력된 값도 같이 보내기.


    chrome.runtime.sendMessage({ 
        message: "keyword", 
        keyword : result, 
        url : url,
        // 전역 변수 업데이트 된 후.
        limitTime : totalMinutes,
        nickname : nickname,
        degree : degree
    }, (response) => {
        console.log('#Op - 데이터 잘 넘겨짐 : ', keyword, url, limitTime, nickname, degree);
    });
};


async function keywordSearch(result) {
    console.log(result);
    // keyword 스토리지에 저장하고 구글 검색결과 보여주기
    await chrome.storage.local.set({ 'keyword': result }, function () {
        chrome.storage.local.get('keyword', (data) => {
			// resolve(data);
            console.log('#Op - Keyword stored:', data);
		});
        chrome.storage.local.get('storedState', (data) => {
			// resolve(data);
            console.log('#Op - stored:', data);
		});
        
        const query = result;
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        // chrome.tabs.update({ url });
        sendMessageSetKeyword(result, url);
    })
    
}


// 검색어 입력 후 버튼 클릭할 경우
searchButton.addEventListener('click', function () {
    checkLimitTime();   // 제한시간 확인 => 0 또는 n분으로 나옴
    checkNickName();    // 닉네임 or '웹 서퍼' 라고 나옴
    checkDegree() ;     // default =50 , 0 or 100 선택가능

    checkInput(searchInput)
    .then(result => {
        keywordSearch(result)
    })
    .catch(error => {
        console.log(error); // 검색어를 입력해 주세요.
    });

    });


// 검색어 입력 후 엔터 친 경우
searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {

    checkLimitTime();   // 제한시간 확인 => 0 또는 n분으로 나옴
    checkNickName();    // 닉네임 or '웹 서퍼' 라고 나옴
    checkDegree() ;     // default =50 , 0 or 100 선택가능

    checkInput(searchInput)
    .then(result => {
        keywordSearch(result)
    })
    .catch(error => {
        console.log(error); // 검색어를 입력해 주세요.
    });
    }
});

function displayKeyword(setkeyword) {
    
    // const text = document.createTextNode(setkeyword);
    // result.appendChild(text); //div에 텍스트 노드 추가
    var innerComment = setkeyword + " <br><br> 키워드에 집중 중 입니다.";
    result.innerHTML = innerComment;
    result.style.width = '400px';
    result.style.padding = '30px';
    result.style.marginLeft = '220px';
    // result.style.height = '400px';
    result.style.textAlign = 'center';
    result.style.fontSize = '30px';
    result.style.backgroundColor = 'rgba(217, 217, 217, 0.3)';
    result.style.borderRadius = '40px';
    result.style.zIndex = '9998';

    const btnContainer = document.createElement('div');
    result.appendChild(btnContainer);
    const btn = document.createElement('button');
    btnContainer.appendChild(btn);
    btn.innerText = '새로운 키워드로 집중하기';
    btn.style.marginTop = '30px';
    btn.style.height = '30px';
    btn.style.cursor = 'pointer';
    btn.style.textAlign ='center';

    btn.addEventListener('click', function() {
        document.querySelector('.display-container').style.display = 'none';
        document.querySelector('.form-container').style.display = 'block';
    })
    
    
}

 // 이미 검색어가 있다면? 저장된 키워드를 보여줄거다.
chrome.storage.local.get('storedState', (data) => {
    const result = data.storedState;
    console.log(result);
    // storage 에 저장된 keyword 추출
    if(result==='ON') {
        chrome.storage.local.get('keyword', (data) => {
            console.log('#Content - keyword:', data.keyword);
            const setkeyword = data.keyword; 
            document.querySelector('.form-container').style.display = 'none';
            displayKeyword(setkeyword);

        });

    } else {
        document.querySelector('.form-container').style.display = 'block';

    }
});