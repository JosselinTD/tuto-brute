var database = firebase.database();
var firebaseVideoRef;
var videoSource;
var times;

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
              <span class="mdl-list__item-secondary-action" onclick="editTimestamp(${index})">
                <i class="material-icons">mode edit</i>
              </span>
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
    time: player.currentTime,
    name: 'Slot ' + times.length
  });

  update();
}

function deleteTimestamp(i) {
  times.splice(i, 1);
  update();
}

var editDialog = document.querySelector('.edit-timestamp');
if (! editDialog.showModal) {
  dialogPolyfill.registerDialog(editDialog);
}
function editTimestamp(i) {
  var time = times[i];
  $(editDialog).html(`
    <h4>Edit this slot</h4>
    <div class="mdl-textfield mdl-js-textfield">
      <input class="mdl-textfield__input" type="text" id="name" value="${time.name}">
      <label class="mdl-textfield__label" for="name">Name</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield">
      <input class="mdl-textfield__input" type="text" id="time" value="${time.time}">
      <label class="mdl-textfield__label" for="time">Time in seconds</label>
    </div>
    <div class="mdl-dialog__actions">
      <button type="button" class="mdl-button" onclick="closeDialog()">Cancel</button>
      <button type="button" class="mdl-button close" onclick="edit(${i})">Edit</button>
    </div>
  `);

  if (window.componentHandler) {
    $(editDialog).find('.mdl-textfield').each(function() {
      componentHandler.upgradeElement(this);
    });
  }

  editDialog.showModal();
}

function edit(i) {
  times[i].name = $('#name').val();
  times[i].time = parseFloat($('#time').val());

  closeDialog();
  update();
}

function closeDialog() {
  editDialog.close();
}

var currentInterval;
function startStopLoop() {
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = undefined;
    $('.start-stop').html('Start Loop');
    player.pause();
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
    stop = player.duration - 1;
  }
  var duration = stop - start;

  player.currentTime = start;
  player.play();

  currentInterval = setInterval(function() {
    player.currentTime = start;
  }, duration * 1000);
}

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

var allVideos = [];
database.ref('slots').once('value').then(function(snapshot) {
  var allIds = Object.keys(snapshot.val());

});

function changeVideoRef(newSource) {
  videoSource = newSource;
  times = [];
  updateVideo();
  update();
  /*firebaseVideoRef = database.ref('slots/' + newId);
  firebaseVideoRef.once('value').then(function(snapshot) {
    if (snapshot.val()) {
      times = snapshot.val();
    } else {
      times = [];
    }
  });*/
}

var player = $('#player').get(0);
function updateVideo() {
  $(player).empty();
  $(player).append(`
    <source src="${videoSource}" type="video/mp4"/>
  `);
}

function saveOnline() {
  // firebaseVideoRef.set(times);
}

function update() {
  updateList();
  saveOnline();
}

$(".new-video").on('keyup', function (e) {
    if (e.keyCode == 13) {
      changeVideoRef($(this).val());
      $(this).val('');
    }
});

changeVideoRef('http://res.cloudinary.com/indie-seller/video/upload/v1519987950/victorspinaosolo_ktutsw.mp4');
