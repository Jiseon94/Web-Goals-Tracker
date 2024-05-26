// >>> 처음 익스텐션이 깔리거나 or 처음 배지를 눌렀을 때(ON) or 다시 배지를 눌렀을때(OFF)
console.log(">>>>> 이벤트.js <<<< ");
importScripts ('lib/jquery.js');
importScripts ('tabTree.js');

var googleCorpus =[]; //구글에서 검색한 키워드 모음집.. (당장 필요한건 아니지만 일단 만들어둠..)

var port;  // 팝업.js 와의 소통채널에 필요한 port 선언


// #pop 팝업으로부터 요청을 받는 함수
function handleRequest(port, message) {
    console.log("#Event - handleRequest() called");
    // 여기 들어오는 메세지 자체가 background가 tabTree 를 만들고나서 준비된 후에 받을 수 있는 메세지임.
    if (message === 'requestTabTree') {  
      if (tabTree) { //탭트리 있는지 한번더 확인
        const serializedTabTree = JSON.stringify(tabTree, getCircularReplacer());
        // console.log("#Event - serializedTabTree : ", serializedTabTree);
        port.postMessage({
            type: 'tabTreeData',
            TABTREE_APP: TABTREE_APP,
            tabTree: serializedTabTree
        });
      } else {
        // 트리가 없는 경우 메시지 전송
        port.postMessage({ type: 'tabTreeUnavailable' });
      }
    }
  }
// 원형 참조 해결해주는 함수 -> PORT 소통 시 사용
function getCircularReplacer() {
    console.log("#Event - getCircularReplacer() called");
	const seen = new WeakSet();
	return function (key, value) {
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) {
				return;
			}
		seen.add(value);
		}
		return value;
	};
} 


chrome.tabs.onCreated.addListener(function(tab){
	if(tab.url.indexOf("chrome-devtools") != -1){
		return;
	}else if(tab.url.indexOf("chrome-extension") != -1 && tab.url.indexOf("option.html") != -1){
		console.log("created hidden window tab");
		TABTREE_APP.hiddenWindowId = tab.windowId;
		return;	
	}else if(TABTREE_APP.activeWindowId == tab.windowId){
		if(tab.title == "New Tab"){
			console.log(tab);
			
			var currentTab = findTabNode(tabTree, tab.openerTabId);
			var parentTab = currentTab.parent;
			var childTab = createTabNode(tab);
			childTab.parent = parentTab;
			parentTab.children.push(childTab);
		}else{
			
			var currentTab = findTabNode(tabTree, tab.openerTabId);
			var childTab = createTabNode(tab);
			childTab.parent = currentTab;
			currentTab.children.push(childTab);
			tabSwapOut(tab.id);
		
			chrome.tabs.query({active: true, currentWindow: true}, 
            function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {message: "tab child created"});	
            });
		}
	}
});


chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
	if(findTabNode(tabTree, tabId) != null){
		console.log("attempting to remove node id " + tabId);
		var removedNode = findTabNode(tabTree, tabId);
		var orphans = removedNode.children;

		
		var parentArray = removedNode.parent.children;
		for(var i = 0; i < parentArray.length; i++){
			if(parentArray[i].tab.id == tabId){
				parentArray.splice(i, 1);
				break;
			}
		}

		
		for(var i = 0; i < orphans.length; i ++){
			orphans[i].parent = removedNode.parent;
			parentArray.push(orphans[i]);
		}
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	
	if(tab.url.indexOf("chrome-devtools") != -1){
		return;
	}else if(findTabNode(tabTree, tabId) != null){	
		console.log("Event - 업데이트된 tabId : ",tabId);
		var updateNode = findTabNode(tabTree, tabId);
		console.log("Event - updateNode : ", updateNode);

		for(var property in changeInfo){
			if(changeInfo.hasOwnProperty(property)){
				updateNode.tab[property] = changeInfo[property];
				console.log(changeInfo[property]);
				console.log(updateNode.tab[property]);
			}
		}	
		


		updateNode.tab.title = tab.title;
	}

});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
	chrome.tabs.query({currentWindow: true}, function(tabs){
		for(var i = 0;i < tabs.length; i++){
			var updateNode = findTabNode(tabTree, tabs[i].id);
			updateNode.tab.index = tabs[i].index;
			updateNode.savedIndex = tabs[i].index;
		}
	});
});


chrome.commands.onCommand.addListener(function(command) {
	if(command == "shift_up"){
		console.log("shifting up");
		treeShiftUp();
	}else if(command == "shift_down"){
		console.log("shifting down");
		treeShiftDown();
	}
});


// Background 스크립트에서 포트를 생성합니다.
chrome.runtime.onConnect.addListener(port => {
	// Popup 스크립트로 데이터를 전송합니다.
	if (port.name === 'popupChannel') {
	  port.onMessage.addListener(message => {
		if (message.message === 'shiftLevel' && message.targetId) {
			var targetId = message.targetId;
			console.log(targetId);
			treeShiftLevel(targetId);	
			port.postMessage({status: "success"});
		}
	  });
	}
});


// 팝업과의 연결을 확인하고 준비되었음을 전달
chrome.runtime.onConnect.addListener(port => {
    if (port.name === 'popupChannel') {
        // 요청을 받는 리스너
        const messageListener = message => {
            handleRequest(port, message);
        };

        // 팝업에서 메시지 받기
        port.onMessage.addListener(messageListener);

  }

});

// 최상위 부모 노드까지의 정보를 가져오는 함수
function traverseToTopParent(node) {
    let currentNode = node;
    let path = [];

    while (currentNode.parent !== null) {
        path.push(currentNode); // 현재 노드 정보를 경로에 추가
        currentNode = currentNode.parent; // 부모 노드로 이동
    }

    // 최상위 부모 노드 정보를 추가
    path.push({ parent: null });

    return path; // 최상위 부모 노드까지의 경로 반환
}

// score.js 에서 받아오는 메세지
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
					"from a content script:" + sender.tab.id :
					"from the extension");
			
		if (request.message === "depth") {
			let currentNode = findTabNode(tabTree, sender.tab.id);
			console.log(currentNode);
			console.log(currentNode['tab']);
			console.log(tabTree['tab']);  //root노드

			let topParentPath = traverseToTopParent(currentNode);
			console.log("최상위 부모 노드까지의 정보:", topParentPath);
			console.log("최상위 부모 노드까지의 거리:", topParentPath.length);
			// 조상이 뎁스 1이라는 설정...
			let depth = topParentPath.length;
			console.log(depth, typeof(depth));
			sendResponse({result: depth});
		}
		if (request.message === "tabId") {
			const tabId = sender.tab.id; // 현재 페이지의 tab.id 가져오기
			sendResponse({ tabId: tabId }); // tab.id를 응답으로 보내기
		}
	}
  );

