// 근데 업데이트 될 때마다 리셋을 해주면, 
// 같은 페이지를 리로드 할때도 리셋이 된다..ㅠ.ㅠ 흠..

// 이전에 저장된 탭의 시간 데이터를 초기화하는 함수
function resetTimeForTab(tabId, presentDate) {
  let resetObj = {};
  resetObj[presentDate] = {};
  resetObj[presentDate][tabId] = 0;

  chrome.storage.local.set(resetObj, function() {
      console.log("Time reset for tabId: " + tabId);
  });
}

// 탭이 업데이트될 때 실행되는 이벤트 리스너
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
      let today = new Date();
      let presentDate = getDateString(today);

      resetTimeForTab(tabId, presentDate);
  }
});



function isValidURL(givenURL){
  if(givenURL){
    if(givenURL.includes(".")){
      return true;
    }
    else{
      return false;
    }
  }
  else{
    return false;
  }
}
function secondsToString(seconds,compressed=false){
    let hours = parseInt(seconds/3600);
    seconds = seconds%3600;
    let minutes= parseInt(seconds/60);
    seconds = seconds%60;
    let timeString = "";
    if(hours){
      timeString += hours + " hrs ";
    }
    if(minutes){
      timeString += minutes + " min ";
    }
    if(seconds){
      timeString += seconds+ " sec ";
    }
    if(!compressed){
      return timeString;
    }
    else{
      if(hours){
        return(`${hours}h`);
      }
      if(minutes){
        return(`${minutes}m`);
      }
      if(seconds){
        return(`${seconds}s`);
      }
    }
  };

function getDateString(nDate){
  let nDateDate=nDate.getDate();
  let nDateMonth=nDate.getMonth()+1;
  let nDateYear=nDate.getFullYear();
  if(nDateDate<10){nDateDate="0"+nDateDate;};
  if(nDateMonth<10){nDateMonth="0"+nDateMonth;};
  let presentDate = nDateYear+"-"+nDateMonth+"-"+nDateDate;
  return presentDate;
}
function getDomain(tablink){
  if(tablink){
    let url =  tablink[0].url;
    return url.split("/")[2];
  }
  else{
    return null;
  }
};

function updateTime(){
    chrome.tabs.query({"active":true,"lastFocusedWindow": true},function(activeTab){
        let domain = getDomain(activeTab);
        
        // 탭 아이디를 저장해주려고 해서 내가 수정한 부분
        let tabId = activeTab[0].id;
        // console.log("★★★★★★★ tabId : ", tabId);

        if(isValidURL(domain)){
          // console.log("★★★isValidURL(domain)");

          let today = new Date();
          let presentDate = getDateString(today);
          let myObj = {};
          myObj[presentDate]={};
          
          
          // myObj[presentDate][domain] = "";   //원본
          myObj[presentDate][tabId] = "";  // 내가 수정한 부분

          let timeSoFar = 0;
          chrome.storage.local.get(presentDate,function(storedObject){
              if(storedObject[presentDate]){
                // console.log("★★★if(storedObject[presentDate])");

                // 이미 탭을 가지고 있을때,
                // if(storedObject[presentDate][domain]){ //원본
                if(storedObject[presentDate][tabId]){ //내가 수정한 코드
                  // console.log("★★★if(storedObject[presentDate][tabId]), 기존 있던거");
                  // console.log(storedObject[presentDate]);
                  // timeSoFar = storedObject[presentDate][domain]+1;   //원본

                  timeSoFar = storedObject[presentDate][tabId]+1;       //내가 수정한 코드
                
                  // storedObject[presentDate][domain] = timeSoFar;   //원본
                  storedObject[presentDate][tabId] = timeSoFar;   //내가 수정한 코드

                  chrome.storage.local.set(storedObject,function(){
                      // console.log("Set "+domain+" at "+storedObject[presentDate][domain]);  //원본
                      // console.log("Set "+domain+" at "+storedObject[presentDate][tabId]); //내가 수정
                  });
                }
                else{
                  // console.log("★★★else 구문1 :새로 생성");
                  timeSoFar++;

                  // storedObject[presentDate][domain] = timeSoFar;   //원본
                  storedObject[presentDate][tabId] = timeSoFar;   //내가 수정


                  chrome.storage.local.set(storedObject,function(){
                    // console.log("Set "+domain+" at "+storedObject[presentDate][domain]);  //원본
                    // console.log("Set "+domain+" at "+storedObject[presentDate][tabId]); //내가 수정
                  })
                }
              }
              else{
                // console.log("★★★else 구문2 :완전 처음?");
                timeSoFar++;
                storedObject[presentDate] = {};

                // storedObject[presentDate][domain] = timeSoFar;   //원본
                storedObject[presentDate][tabId] = timeSoFar;   //내가 수정한 코드
                
                chrome.storage.local.set(storedObject,function(){
                  // console.log("Set "+domain+" at "+storedObject[presentDate][domain]);  //원본
                  // console.log("Set "+domain+" at "+storedObject[presentDate][tabId]); //내가 수정
                  
                })
              }
          });
        } else{
          
        }
    });

};



// //여기까지 함수 ==========================================


// // 시간 간격에 대한 변수 선언
var intervalID;

//setInterval () 메소드 : 이 메서드는 간격(interval)을 고유하게 식별할 수 있는 interval ID를 반환하므로 나중에 clearInterval() (en-US) 함수를 호출하여 제거할 수 있습니다.
intervalID = setInterval(updateTime,1000); //1초 후, updateTime 함수 실행한 결과를 intervalID에 대입.
setInterval(checkFocus,500) //0.5초 후, checkFocus 함수 실행.

function checkFocus(){
  //Gets the current window.
  chrome.windows.getCurrent(function(window){
    // console.log(intervalID);
    // alert(intervalID);
    //Whether the window is currently the focused window. => boolean
    if(window.focused){
      if(!intervalID){
        intervalID = setInterval(updateTime,1000);
      }
    }
    else{
      if(intervalID){
        clearInterval(intervalID);
        intervalID=null;
      }
    }
  });
}