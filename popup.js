//Build UI
function buildUI()
{
  document.getElementById('noTag').style.display = 'none';
  document.getElementById('hasTag').style.display = 'none';

  chrome.storage.sync.get(["picc", "latestPiccId", "schedule"], function (data) {
      
      //Check if there's a tag set
      if (!data.picc) {
        document.getElementById('noTag').style.display = 'block';
        return;
      }

      if (data.schedule) {
        document.getElementById('fopoSchedule').value = data.schedule;
      }

      document.getElementById('hasTag').style.display = 'block';
      document.getElementById('tagName').innerHTML = data.picc;
    
  });
}

document.addEventListener('DOMContentLoaded', function() {

  buildUI();

  document.getElementById('getInspired').onclick = function () {
    chrome.tabs.create({ url: 'http://piccing.com/tag/inspirational' });
  };

  var btn = document.getElementById('serach');
  btn.onclick = chrome.extension.getBackgroundPage().uplook;

  document.getElementById('stopWatch').onclick = function () {
    chrome.extension.getBackgroundPage().stopWatch();
    buildUI();
  }

  var fopoSchedule = document.getElementById('fopoSchedule');
  
  fopoSchedule.onchange = function () {
      var newSchedule = fopoSchedule.options[fopoSchedule.selectedIndex].value;
      chrome.extension.getBackgroundPage().updateSchedule(newSchedule);

      document.getElementById('toast').style.opacity = 1;

      window.setTimeout(function () {
        document.getElementById('toast').style.opacity = 0;
      }, 2000);
  }
  

});

chrome.browserAction.onClicked.addListener(function () {
  chrome.notifications.clear('fopo-notification');
});
