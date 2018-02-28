var times = [
  {
    time: 0,
    name: 'Slot 1'
  },
  {
    time: 84.59408601335144,
    name: 'Slot 2'
  },
  {
    time: 91.9203089885559,
    name: 'Slot 3'
  },
  {
    time: 94.99626696376038,
    name: 'Slot 4'
  },
  {
    time: 100.27324491416931,
    name: 'Slot 5'
  },
  {
    time: 105.07014784550476,
    name: 'Slot 6'
  },
  {
    time: 108.81039385504151,
    name: 'Slot 7'
  },
  {
    time: 111.96542206484985,
    name: 'Slot 8'
  }
];
document.body.onkeyup = function(e){
  if(e.keyCode == 32){
      times.push(player.getCurrentTime());
  } else if(e.keyCode == 13) {
    if (loop[0] !== undefined) {
      loop = [];
    } else {
      var currentTime = player.getCurrentTime();
      var i;
      for (i = 0; i < times.length - 1; i++) {
        if (times[i] < currentTime && times[i+1] > currentTime) {
          loop = [times[i], times[i+1]];
        }
      }
    }
  }
}

function updateList() {
  var list = $('.list .mdl-list');

  list.empty();

  times.sort(function(a, b) {
    return a.time - b.time;
  });

  var time;
  var index = 0;
  for (time of times) {
    list.append(`
      <li class="mdl-list__item">
        <span class="mdl-list__item-primary-content">
          <span class="mdl-list__item-secondary-action">
            <label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect slot" for="slot-${index}">
              <input type="checkbox" id="slot-${index}" class="mdl-checkbox__input"/>
            </label>
          </span>
          ${fancyTimeFormat(parseInt(time.time))}: ${time.name}
          <span class="mdl-list__item-secondary-content">
              <span class="mdl-list__item-secondary-action"><i class="material-icons">mode edit</i></span>
              <span class="mdl-list__item-secondary-action" onclick="deleteTimestamp(${index})">
                <i class="material-icons">delete</i>
              </span>
          </span>
        </span>
      </li>
    `);

    index++;
  }

  if (window.componentHandler) {
    componentHandler.upgradeElement(list.get(0));
    list.find('.mdl-checkbox').each(function() {
      componentHandler.upgradeElement(this);
    });
  }
}

function addTimestamp() {
  times.push({
    time: player.getCurrentTime(),
    name: 'Slot ' + times.length
  });

  updateList();
}

function deleteTimestamp(i) {
  times.splice(i, 1);
  updateList();
}

var currentInterval;
function startStopLoop() {
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = undefined;
    $('.start-stop').html('Start Loop');
    return;
  }

  var selecteds = $('.slot.is-checked');
  if (!selecteds.length) {
    return;
  }
  $('.start-stop').html('Stop Loop');
  var startIndex = parseInt(selecteds.first().attr('for').replace('slot-', ''));
  var stopIndex = parseInt(selecteds.last().attr('for').replace('slot-', '')) + 1;
  var start = times[startIndex].time;
  var stop;
  if (stopIndex < times.length) {
    stop = times[stopIndex].time;
  } else {
    stop = player.getDuration() - 1;
  }

  currentInterval = setInterval(function() {
    if (player.getCurrentTime() >= stop || player.getCurrentTime() < start) {
      player.seekTo(start, true);
      if (player.getPlayerState() !== 1) {
        player.playVideo();
      }
    }
  }, 100);
}

updateList();

function fancyTimeFormat(time) {   
  // Hours, minutes and seconds
  var hrs = ~~(time / 3600);
  var mins = ~~((time % 3600) / 60);
  var secs = time % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  var ret = "";

  if (hrs > 0) {
      ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }

  ret += "" + mins + ":" + (secs < 10 ? "0" : "");
  ret += "" + secs;
  return ret;
}
