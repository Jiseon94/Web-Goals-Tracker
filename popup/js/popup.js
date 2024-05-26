// 여기 있는 코드 자체가 popup.html이 열려야 시작되는 코드들임.

console.log(">>>> popup.js ");

//popup.js 자체적으로도 만들어놔야할 tabTree, TABTREE_APP
var tabTree;  
var TABTREE_APP;

// port 를 connect 해서 백그라운드와 영구적으로 소통 채널 만들기 
// 목적 : tabTree 공유를 위해서 
const port = chrome.runtime.connect({ name: 'popupChannel' });
var currentTabId;

function generateD3Data(node){
	console.log("#pop - generateD3Data() called");
	var data = {};
	
	//limit title to first x characters
	data.name = node.tab.title.substring(0, 6);  // 여기서 에러가 나네
	data.id = node.tab.id;
	data.parent = node.tab.parent;
	data.iconURL = node.tab.favIconUrl;
	data.children = [];

	for(var i = 0; i < node.children.length; i++){
		data.children.push(generateD3Data(node.children[i]));	
	}

	return data;
};


// tabTree의 정보를 받아서 html 에 그리는 과정
function drawTabTree(message, tabs) {
	console.log("#pop - drawTabTree() called");

	console.log(message);
	TABTREE_APP = message.TABTREE_APP;
	tabTree = JSON.parse(message.tabTree);
	// JSON 변환된 tabTree 객체를 다시 원상복구.

	console.log("#pop - ", TABTREE_APP);
	console.log("#pop - ",tabTree);

	// 본격적으로 popup.html 에 트리노드 그리기  시작
	currentTabId = tabs[0].id;	
	console.log("#pop - currentTabId : ", currentTabId);

	var treeData = [];
	console.log("#pop - treeData[] 생성 : ", treeData);
	treeData.push(generateD3Data(tabTree));

	
	// 트리 노드를 구성하는 이미지 요소에 대한 정보
	var margin = {top: 40, right: 120, bottom: 20, left: 120};
	var width = 960 - margin.right - margin.left;
	var height = 500 - margin.top - margin.bottom;

	var i = 0;

	var tree = d3.layout.tree().size([height, width]);

	var diagonal = d3.svg.diagonal().projection(function(d) {
						return [d.x, d.y];
					});

	var svg = d3.select("#container").append("svg")
			.attr("width", width + margin.right + margin.left)
			.attr("height", '1000px')
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	root = treeData[0];
	update(root);

	// 노드 정보를 업데이트 해주는 함수
	function update(source){
		console.log("#pop - update() called");
		var nodes = tree.nodes(root).reverse();
		var links = tree.links(nodes);

		nodes.forEach(	function(d){
					d.y = d.depth * 100;	
				});

		var node = svg.selectAll("g.node")
				.data(nodes,	function(d){
							return d.id || (d.id = ++i);
						});

		var nodeEnter = node.enter().append("g")
				.attr("class", "node")
				.attr("transform",	function(d){
								return "translate(" + d.x + "," + d.y + ")"; 
							});

		/*
		nodeEnter.append("circle")
				.attr("r", 10)
				.style("fill", "#fff");
	*/
		
		nodeEnter.append("svg:image")
			.attr("class", "circle")
			.attr("xlink:href", function(d){
				var url = d.iconURL;
				console.log("#pop - url : ", url);
				if(url == null){
					const imageUrl = chrome.runtime.getURL('image/website.png');
					return imageUrl;
				}else if(url.indexOf("http") == -1){
					const imageUrl = chrome.runtime.getURL('image/website.png');
					return imageUrl;
				}else{
					return d.iconURL;	
				}
			})
			.attr("x", "-8px")
			.attr("y", "-8px")
			.attr("width", "16px")
			.attr("height", "16px");

		// 클릭이벤트 감지
		nodeEnter.on("click", function(d){
			// 백그라운드에 메세지 보내기
			port.postMessage({
				message: 'shiftLevel', 
				targetId: d.id
			});
			port.onMessage.addListener(message => {
				if (message.status != 'success') {
					console.log("#pop - 노드 클릭 실패!");
				}
			})
		});
	
		// 노드 아이콘 밑의 텍스트 -> 키워드로 보여줘야해
		nodeEnter.append("text")
				.attr("y", 	function(d){
							return d.children || d._children ? -18 : 18;
						})
				.attr("dy", ".35em")
				.attr("fill", function(d){
							if(d.id == currentTabId)
								return 'red';
							else
								return 'black';			
						})
				.attr("text-anchor", "middle")
				.text(	function(d){
						return d.name;
					})
				.style("fill-opacity", 1);

		var link = svg.selectAll("path.link")
				.data(links,	function(d){
							return d.target.id;
				});

		link.enter().insert("path", "g")
				.attr("class", "link")
				.attr("d", diagonal);

	} //update() END

};


// 3. 백그라운드 스크립트 준비 여부를 체크하는 함수
function checkBackgroundScriptReady(tabs) {
	console.log("#pop - checkBackgroundScriptReady() called");
	return new Promise((resolve, reject) => {
		port.postMessage('requestTabTree');

		port.onMessage.addListener(message => {
			if (message.type === 'tabTreeData') {
				drawTabTree(message, tabs);

			} else if(message.type ==='tabTreeUnavailable'){
				alert("현재 목표 키워드를 설정하지 않았습니다!");
				reject(new Error('아직 서비스 실행 안됐습니다.')); // 아직 탭트리 없으면 reject 호출
			}
		});
	});	
}

// 1. 팝업창 열리면 실행될 쿼리문
chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
	console.log("#pop -setupPopup() called"); //popup.html 을 누르면 실행될 함수

	try {
        checkBackgroundScriptReady(tabs);   // 3. 백그라운드 스크립트 준비될 때까지 대기
		// 성공시, 트리까지 받음
    } catch (error) {
        console.log(error); // 서비스 실행이 안 된 경우 에러 출력        
    }

});



