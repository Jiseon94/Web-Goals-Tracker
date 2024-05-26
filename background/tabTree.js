console.log(">>>>> tabTree.js");
// importScripts ('lib/jquery.js');
// importScripts ('event.js');
// importScripts ('badge.js');

//서비스 시작 전의 빈 tabTree
var tabTree = {
	'tab': {title: "root", id: -1},
	'savedIndex': -1,
	'active': false,
	'parent': null,
	'children': []
}

// 첫 키워드를 tabTree 로 설정
function creatRootTab(keyword, url){
    console.log("#Event - creatRootTab() called");
    tabTree={}; //탭트리 초기화?

	tabTree = {
        'tab': {title: keyword, id: -1, url:url},
        'savedIndex': -1,
        'active': false,
        'parent': null,
        'children': []
	}	
    console.log("#Event - Root 설정: ", tabTree);

	return tabTree;
}

function createTabNode(tab){
    // console.log("#Event - createTabNode() call")
    var node = {
        'tab': tab,
        'parent': null,
        'children': [], //처음엔 자식 없이 시작. 
        'savedIndex': -1,
    }	
    // console.log("#Event - 만들어진 node : ", node);
    return node;	
}

function findTabNode(node, goalTabId){
    console.log("#Event - findTabNode() called");
	var stack = new Array(); //빈 배열 하나 만들어놓고
	stack.push(node); //기존 tabTree 를 집어넣음.

	while(stack.length != 0){
		var currentNode = stack.pop();
		if(currentNode.tab.id == goalTabId){
			return currentNode;
		}else{
			for(var i = 0; i < currentNode.children.length; i++){
				stack.push(currentNode.children[i]);
			}
		}
	}

	return null;
}
function isSibling(tabid1, tabid2){
	var tabNode1 = findTabNode(tabTree, tabid1);		
	var tabNode2 = findTabNode(tabTree, tabid2);

	if(tabNode1.parent == tabNode2.parent)
		return true;
	else
		return false;	
}


function treeShiftUp(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		console.log("Shift up function called");
		var targetNodeId = findTabNode(tabTree, tabs[0].id).parent.tab.id;

		treeShiftLevel(targetNodeId);	
	});
}

function treeShiftDown(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		console.log("Shift down function called");
		
		var children = findTabNode(tabTree, tabs[0].id).children;	
		var targetNodeId = children[0].tab.id;
		for(var i = 0; i  < children.length; i++){
			if(children[i].active)
				targetNodeId = children[i].tab.id;	
		}
		
		treeShiftLevel(targetNodeId);	
	});
}

function treeShiftLevel(tabId){
	chrome.tabs.query({currentWindow: true}, function(tabs){
		console.log(tabs);
		//find current active tab
		var currentNode;
		for(var i = 0; i < tabs.length; i++){
			if(tabs[i].active){
				currentNode = findTabNode(tabTree, tabs[i].id);	
				console.log(currentNode);
			}
		}

		//find targetNode
		var targetNode = findTabNode(tabTree, tabId);

		if(targetNode.tab.title == "root"){
			//check if user is trying to shift further up than root
			//print some kind of error message***
			return;
		}else if(isSibling(currentNode.tab.id, targetNode.tab.id)){
			//swap active tab
			chrome.tabs.update(currentNode.tab.id, {active: false});
			chrome.tabs.update(targetNode.tab.id, {active: true});
		}else{
			//find tabs to switch in (siblings on tabNode)
			//find targetNode's parent
			var targetNodeParent = targetNode.parent;
			var switchInTabNodes = targetNodeParent.children;

			//find tabs to switch out (current active tabs)
			var switchOutTabs = tabs;

			//record tabOut indexes 
			for(var i = 0; i < switchOutTabs.length; i++){
				var tempNode = findTabNode(tabTree, switchOutTabs[i].id);
				tempNode.savedIndex = tempNode.tab.index;
			}

			//move in tabs
			//save moveOrder
			var moveOrder = [];
			for(var i = 0; i < switchInTabNodes.length; i++){
				moveOrder.push({id: switchInTabNodes[i].tab.id, index: switchInTabNodes[i].savedIndex});	
			}

			//sort moveOrder by index
			moveOrder.sort(function(a, b){
				if(a.index < b.index)
					return -1;
				else if(a.index > b.index)
					return 1;	
				else
					return 0;
			});

			//get savedIndex order
			//add with -1 index but in the correct order
			for(var i = 0; i < moveOrder.length; i++){
				tabSwapIn(moveOrder[i].id, -1);
			}

			//move out tabs
			for(var i = 0; i < switchOutTabs.length; i++){
				var node = findTabNode(tabTree, switchOutTabs[i].id);
				if(switchOutTabs[i].active == true){
					node.active = true;
				}else{
					node.active = false;
				}

				tabSwapOut(switchOutTabs[i].id);
			}

			//activate proper window (for shift up)
			chrome.tabs.update(targetNode.tab.id, {active: true});
		}
	});
}


function tabSwapIn(tabId, savedIndex){
	//find tab
	var tab = findTabNode(tabTree, tabId);
	chrome.tabs.move(tabId, {windowId: TABTREE_APP.activeWindowId, index: savedIndex});
}

function tabSwapOut(tabId){
	//find tab
	var tab = findTabNode(tabTree, tabId);
	chrome.tabs.move(tabId, {windowId: TABTREE_APP.hiddenWindowId, index: -1});
}

function tabReorder(tabId, newIndex){
	//find tab
	chrome.tabs.move(tabId, {index: newIndex});
}