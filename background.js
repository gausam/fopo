var piccUrl = null;

function fetchNewThings(tagName, latestPiccId)
{
  var url = 'http://piccing.com/services/rest/search/community/tags?page=1,curr,24&noProducts=1&marks=1&viewCount=1';

  var payload = {
    criteria: tagName,
    exact: true
  };

  xhr('POST', url, payload)
    .success(function (data){

      //Fetch the first
      var picc = data.results[0][0];

      if (picc.id === latestPiccId) {
          //Pick a random one
          var picc = data.results[0][Math.floor(Math.random() * data.results[0].length)];
      } else {
          //Note the new result's id
          chrome.storage.sync.set({'latestPiccId': picc.id});
      }

      piccUrl = picc.shareURL;

      chrome.notifications.create('fopo-notification', {
        "type": "image",
        "iconUrl": chrome.extension.getURL("icon_128.png"),
        "imageUrl": picc.url,
        "title": "Picc by " + picc.profileName + " for tag " + tagName,
        "message": picc.caption
      });

    })
    .error(function (data) {
      //alert('Was an error');
      //console.log(data);
    });
}

function uplook()
{
  chrome.storage.sync.get(["picc", "latestPiccId"], function (data) {
  	//Check if there's a tag set
  	if (!data.picc) {
		return;
	}

	if (!data.latestPiccId) data.latestPiccId = null;

	fetchNewThings(data.picc, data.latestPiccId);
  });
}

//============ Context menu

function extractTargetTag(url)
{
	var regex = new RegExp('http://piccing.com/tag/([a-z]+)');
	var r = url.match(regex);
	return r[1];
}

function handleClick(info, tab) {
  var picc = extractTargetTag(info.linkUrl);
  chrome.storage.sync.set({'picc': picc});
}

//=========== Recurring timer

function handleAlarm(alarm)
{
	uplook();
}

function stopWatch()
{
	chrome.notifications.clear('fopo-notification');
	chrome.alarms.clear("fopo");
	chrome.storage.sync.remove('picc');
}

function updateSchedule(periodInMinutes)
{
	chrome.notifications.clear('fopo-notification');
	chrome.alarms.clear("fopo");

	chrome.storage.sync.set({'schedule': periodInMinutes});
	chrome.alarms.create("fopo", {periodInMinutes: parseInt(periodInMinutes) });
}

// Notification click events
chrome.notifications.onClicked.addListener(function (notificationId){
  chrome.notifications.clear('fopo-notification');
  chrome.tabs.create({ url: piccUrl });
});


//Bring it all together

function bootstrap(){
	chrome.contextMenus.create({
		"title": "Get notified of new Piccs for this tag",
		"contexts":["link"],
		"onclick": handleClick,
		"targetUrlPatterns": ["*://piccing.com/tag/*"],
	});

	chrome.storage.sync.get("schedule", function (data) {

	  	//Check if there's a tag set
	  	if (!data.schedule) {
			chrome.alarms.create("fopo", {periodInMinutes: 1});
		} else {
			chrome.alarms.create("fopo", {periodInMinutes: parseInt(data.schedule) });
		}

		chrome.alarms.onAlarm.addListener(handleAlarm);

	});

}

bootstrap();

//== XHR wrapper
//Slightly modified https://gist.github.com/lyoshenka/a8643e559e5c073300f7
xhr = function (type, url, data) {
  var methods = {
    success: function () {},
    error: function () {}
  };

  var parse = function (req) {
    var result;
    if (type === 'JSONP') {
      result = req;
      req = null;
    }
    else {
      try {
        result = JSON.parse(req.responseText);
      } catch (e) {
        result = req.responseText;
      }
    }
    return [result, req];
  };

  var returnObj = {
    success: function (callback) {
      methods.success = callback;
      return returnObj;
    },
    error: function (callback) {
      methods.error = callback;
      return returnObj;
    }
  };

  if (type === 'JSONP') {
    var fnName = 'callback'+Math.floor(Math.random()*1000001);
    window[fnName] = function(request) { methods.success.apply(methods, parse(request)); };
    var script = document.createElement('script');
    script.src = url+'&callback='+fnName;
    document.getElementsByTagName('head')[0].appendChild(script);
  }
  else {
    var request = new (XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
    request.open(type, url, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status === 200) {
          methods.success.apply(methods, parse(request));
        }
        else {
          methods.error.apply(methods, parse(request));
        }
      }
    };
    request.send(JSON.stringify(data));
  }

  return returnObj;
};

