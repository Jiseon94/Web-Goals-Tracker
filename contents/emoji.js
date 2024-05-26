console.log(" >>>> emoji.js <<<<")


var myKeyword;
let intervalText=null;

// DOM 에 이모지 리셋해주고, 새로 추가해주기
function checkEmoji() {
    console.log("#Emoji - checkEmoji() called");
    const emoji = document.querySelector('.your-emoji-class');
    const score = document.querySelector('.your-box-class');
    if(emoji) {
        emoji.remove(); //우선 초기화
        score.remove();
        addImageToDOM();
        addScoreToDOM();
    } else {
        addImageToDOM();
        addScoreToDOM();
    }

}

function clearEmoji() {
    console.log("#Emoji - clearEmoji() called");
    const emoji = document.querySelector('.your-emoji-class');
    const score = document.querySelector('.your-box-class');
    if(emoji) {
        emoji.remove(); // 'OFF' 상태일 때 기존 박스가 있으면 삭제
        score.remove();
        // 이전 인터벌 종료 및 새로운 인터벌 설정
        clearInterval(intervalText);
        intervalText=null;
    }
}

function addImageToDOM() {
    console.log("#Emoji - addImageToDOM() called");
    const imageUrl = chrome.runtime.getURL('image/surfer.png');
    const img = document.createElement('img');
    img.classList.add('your-emoji-class'); // 이미지에 클래스명 추가
    img.src = imageUrl;

    document.body.appendChild(img); 

    // img.addEventListener('click', (event) => {
    //     console.log("클릭이벤트");
    //     console.log('Clicked element:', event.target);

    img.addEventListener('click', function() {
        console.log("클릭이벤트");
        if (chrome.runtime.openOptionsPage) {
            console.log("옵션페이지 열어야지");
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('/popup/popup.html'));
            
        }

    })

    img.addEventListener('mouseover', function() {
        console.log("마우스오버이벤트");
        // scoreUpdate();
        // requestScore();

    })

}
function addScoreToDOM() {
    console.log("#Emoji - addScoreToDOM() called");
    const box = document.createElement('div');
    box.classList.add('your-box-class'); // 이미지에 클래스명 추가

    chrome.storage.local.get('keyword', (data) => {
        console.log('#Emoji - keyword:', data);
        myKeyword = data.keyword;
    
        const textContainer = document.createElement('span'); // 텍스트를 감싸는 요소 생성
        textContainer.innerHTML  = data.keyword + " <br> 실시간 집중도 <br> " + "loading...";
        textContainer.classList.add('your-text-class');
        box.appendChild(textContainer);


        setTimeout(() => {
            chrome.storage.local.get('keyword', (data) => {
                console.log('#Emoji - keyword:', data);
                // let roundedScore = Math.round(score * 100);
                // let formattedScore = roundedScore.toFixed(0); 
                innerScore = data.keyword + " <br> 실시간 집중도 <br> " + formattedScore || "loading...";
                if(isNaN(formattedScore)) {
                    innerScore = data.keyword + " <br> 실시간 집중도 <br> " + "loading...";
                }
                textContainer.innerHTML = innerScore; // 2초 후에 텍스트 노드 업데이트
            });
        }, 2000);
 
    });

    
    document.body.appendChild(box); 

}




chrome.storage.local.get('storedState', (data) => {
    let intervalID = null;

    console.log('#Emoji - storedState:', data);
    const result = data.storedState;
    console.log(result);
    if(result==='ON') {

        checkEmoji();
        intervalID = setInterval(stayTimeUpdate,1000); //시간은 계속 흐름.

    } else {
        clearEmoji();
        clearInterval(intervalID);
        intervalID=null;
    }
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'removeImage') {
        clearEmoji();
    
    }
});