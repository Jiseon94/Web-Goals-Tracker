console.log(">>>> badge.js");


// 3-4. 모든 탭에 배지상태 적용
async function updateBadgeForAllTabs(text, color) {
    const tabs = await chrome.tabs.query({});
    for (const currentTab of tabs) {
        chrome.action.setBadgeText({
            tabId: currentTab.id,
            text: text
        });
        chrome.action.setBadgeBackgroundColor({ 
            tabId: currentTab.id,
            'color': color 
        });
    }
}


// 스토리지 상태 확인
async function storageStoredValueCheck() {
    console.log("#Back - storageStoredValueCheck() called");

    const keywordData = await new Promise((resolve) => {
        chrome.storage.local.get('keyword', (data) => {
            console.log('#Back - storedKeyword:', data);
            resolve(data);
        });
    });
    const storedStateData = await new Promise((resolve) => {
        chrome.storage.local.get('storedState', (data) => {
            console.log('#Back - storedState:', data);
            resolve(data);
        });
    });
    return { keywordData, storedStateData };
}

// 3-3. 키워드 입력 받은 후, 스토리지 업데이트해주는 함수
async function updateStorageON() {
	console.log("#Back - updateStorageON() called");
	try {
		// await storageStoredValueCheck();  //확인용 코드

		// console.log("#Back - 키워드 전달 받은 후 처리");

		await new Promise((resolve) => {
			// 먼저 storage 리셋해주고 , ON으로 변경
			chrome.storage.local.remove('storedState', () => {
				chrome.storage.local.set({ 'storedState': 'ON' }, () => {
					// 그런다음 배지 변경
					chrome.action.setBadgeText({ text: 'ON' });
					chrome.action.setBadgeBackgroundColor({ 'color': "green" });
					// console.log("#Back - storage : ON 설정");
					resolve();
				});
			});
		});
		// 모든 탭에 배지 변경을 적용한다.
		await updateBadgeForAllTabs('ON', 'green');

	} catch(error) {
		console.log('#Back - 에러ㅜㅜ:', error);
	}
}

// 서비스 종료 요청 후, 스토리지 업데이트해주는 함수
async function updateStorageOFF() {
	try {
		await storageStoredValueCheck();
		console.log("#Back - updateStorageOFF() called");
		console.log("#Back - 서비스 종료 후 처리");
		
		const tabs = await chrome.tabs.query({});

		await new Promise ((resolve) => {
			chrome.storage.local.remove('keyword', () => {
				console.log("#Back - remove [keyword]");
				resolve();
			});
		});
		
		await new Promise((resolve) => {
			chrome.storage.local.remove('storedState', () => {
				chrome.storage.local.set({ 'storedState': 'OFF' }, () => {
					chrome.action.setBadgeText({ text: 'OFF' });
					chrome.action.setBadgeBackgroundColor({ 'color': "#777" });
					console.log("#Back - storage : OFF 설정");
					resolve();
				});
			});
		});

		// 모든 탭에 배지 변경을 적용한다.
		await updateBadgeForAllTabs('OFF', '#777');

		await storageStoredValueCheck();
	} catch (error) {
        console.log('#Back - 에러ㅜㅜ:', error);
    }
}