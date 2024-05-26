// >>> 처음 익스텐션이 깔리거나 or 처음 배지를 눌렀을 때(ON) or 다시 배지를 눌렀을때(OFF)
// 관리하는 첫 startpoint 를 담당하는 background.js 이다.

console.log(">>>>> 백그라운드.js <<<< ");

importScripts ('lib/jquery.js');
importScripts ('tabTree.js');
importScripts ('badge.js');
importScripts ('event.js');
importScripts ('time.js');

var TABTREE_APP = {};



async function initializeTree(keyword) {
	console.log("#Back - initializeTree() called");
	chrome.tabs.query({},function(tabs){
		chrome.tabs.query({active: true, currentWindow: true}, function(activeTabs){
			var tab = activeTabs[0];
			// console.log(tab); //option.html 정보임
			TABTREE_APP.activeWindowId = tab.windowId;

			// keyword와 option.url 로 tabTree 루트 만들기
			tabTree = creatRootTab(keyword, tab.url);
			
			for(var i = 0; i < tabs.length; i++){
				// console.log("실행되고 있는건가?");
				if(tabs[i].windowId == TABTREE_APP.activeWindowId){
					var newTab = createTabNode(tabs[i]);
					// console.log(newTab);
					newTab.parent = tabTree;
					tabTree.children.push(newTab);
				}
			}
	
			console.log(tabTree);
		});		
	});
}

function finalizeTree() {
	console.log("#Back - finalizeTree() called");
	// 완전 초기화...
	TABTREE_APP = {};
	tabTree={};

	// console.log("#Back - TABTREE_APP, tabTree : ", TABTREE_APP, tabTree);

}

// 3-2.option 에서 만들어준 url 쿼리스트링으로 탭 업데이트
async function goToGoogleSearchPage(url) {
    try {
		console.log("#Back - goToGoogleSearchPage() called");
	    await chrome.tabs.update({ url });
    } catch (error) {
        console.log('#Back - 에러ㅜㅜ:', error);
    }
}


// 크롬창이 띄워지자마자 실행되는 구문!
chrome.tabs.query({},async (tabs) => {
    console.log("#Back - 첫 동작 chrome.tabs.query()");
	try {
		// 최초 배지 상태 설정
		chrome.action.setBadgeText({text: 'OFF'});
		chrome.action.setBadgeBackgroundColor({ 'color': "#777" });
		// 사전 확인
		// await storageStoredValueCheck();
		//혹시나 값이 남아있을까봐, 키워드 및 상태 다 지워줌.
		await chrome.storage.local.clear();
		console.log("#Back - storage 리셋");

		await chrome.storage.local.set({ 'storedState': 'OFF' });
		console.log("#Back - storage → OFF");

		await storageStoredValueCheck();

	} catch (error) {
		console.log('#Back - 에러ㅜㅜ:', error);
	}
});


// 2. 배지를 클릭하는 이벤트리스너
chrome.action.onClicked.addListener(async (tab) => {
    console.log("#Back - 배지 click event");

	// 배지Text 상태로 판단할려고 함.
    const prevBadge = await chrome.action.getBadgeText({ tabId: tab.id });

    // 3. 배지 OFF -> ON 으로 변경할 때.
    if (prevBadge === "OFF") {
        // console.log("#Back - option.html 로 이동 ");
		chrome.tabs.create({
			url: "../contents/onboarding.html"
		});


	// 4. 배지 ON -> OFF 로 변경할때	
    } else if (prevBadge === "ON") {
        console.log("#Back - 서비스 종료");
        try {
            await updateStorageOFF();
			finalizeTree();
			// 모든 탭 리로드.
			// 백그라운드 스크립트에서 content script로 메시지 전송
			chrome.tabs.query({}, function(tabs) {
				tabs.forEach(function(tab) {
					chrome.tabs.sendMessage(tab.id, { action: 'removeImage' });
				});
			});
	
        } catch (error) {
            console.log('#Back - 에러ㅜㅜ:', error);
        }
		// console.log("#Back - TABTREE_APP, tabTree : ", TABTREE_APP, tabTree);
    }
});

//==========================================================================
// 3-1. onboarding 에서 키워드 입력 받은 후, 진행 될 코드
chrome.runtime.onMessage.addListener(async(request, sender, sendResponse) => {
	if (request.message === "keyword") {
		console.log("#Back - MessageListener");
		const keyword = request.keyword;
		const url = request.url;  //onboarding 만들어준 url
		const nickname = request.nickname;
		const limitTime = request.limitTime;
		const degree = request.degree;

		console.log("#Back - form 태그 내용 확인 : ", nickname, limitTime, degree);
		// 잘 전달 되는거 확인 됨. 이걸 어떻게 활용할지는 일단... 잠시...

		// 3-2. 구글 검색페이지로 이동
		await goToGoogleSearchPage(url);

		// 3-3. 구글로 이동 시켜놓고, storage 상태 ON 으로 변경
		await updateStorageON();
		
		await initializeTree(keyword);
		//여기까지 다 완료되면 -> 이벤트리스너.js 에서 바톤을 이어받을거임.

		

		
		
	}
});
