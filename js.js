var database = firebase.database();
var firebaseVideoRef;
var datas = {
  times: []
};

function updateList() {
  var list = $('.list .mdl-list');

  list.empty();

  datas.times.sort(function(a, b) {
    return a.time - b.time;
  });

  var time;
  var index = 0;
  var slider;
  for (time of datas.times) {
    list.append(`
      <li class="mdl-list__item">
        <div class="list-item-controls"></div>
        <div class="list-item-range"></div>
      </li>
    `);

    slider = list.find('.list-item-range').last().get(0);

    noUiSlider.create(slider, {
      start: [0, parseInt(player.duration)],
      connect: true,
      range: {
        'min': 0,
        'max': parseInt(player.duration)
      }
    });

    slider.noUiSlider.on('slide', function(values, handle) {
      player.currentTime = values[handle];
    })

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
  datas.times.push({
    time: player.currentTime,
    name: 'Slot ' + datas.times.length
  });

  update();
}

function deleteTimestamp(i) {
  datas.times.splice(i, 1);
  update();
}

var editDialog = document.querySelector('.edit-timestamp');
var newVideoDialog = document.querySelector('.new-video');
if (! newVideoDialog.showModal) {
  dialogPolyfill.registerDialog(newVideoDialog);
}
function editTimestamp(i) {
  var time = datas.times[i];
  $('#name').val(time.name);

  editDialog.showModal();
}

function edit(i) {
  datas.times[i].name = $('#name').val();

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
  var start = datas.times[startIndex].time;
  var stop;
  if (stopIndex < datas.times.length) {
    stop = datas.times[stopIndex].time;
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
database.ref('videos').once('value').then(function(snapshot) {
  var vals = snapshot.val();
  if (!vals) {
    return;
  }
  Object.keys(vals).forEach(function(k) {
    var item = vals[k];
    $('.video-list').append(`
      <span class="mdl-navigation__link" onclick="changeVideoRef('${item.id}')">${item.name}</span>
    `);
  });
});

function changeVideoRef(md5) {
  database.ref('videos/' + md5).once('value').then(function(snapshot) {
    if (snapshot.val()) {
      datas = snapshot.val();
    }
    updateVideo();
  });
}

var player = $('#player').get(0);
var waitingForCanPlay = false;
function updateVideo() {
  $(player).empty();
  $(player).append(`
    <source src="${datas.url}" type="video/mp4"/>
  `);
  player.load();
  waitingForCanPlay = true;
}

player.oncanplay = function() {
  if (waitingForCanPlay) {
    update();
    waitingForCanPlay = false;
  }
}

function saveOnline() {
  return database.ref('videos/' + datas.id).set(datas);
}

function update() {
  updateList();
  saveOnline();
}

function uploadVideo() {
  newVideoDialog.close();
  cloudinary.openUploadWidget({
    upload_preset: 'keavjhk2',
    resource_type: 'video'
  }, function(error, result) {
    newVideoDialog.showModal();
    $('.upload-video').before(`
      <span class="new-video-url">${result[0].secure_url}</span>
    `);
  });
}

function addTutorial() {
  datas = {
    id: MD5($('.new-video-url').html()),
    name: $('#newVideoName').val(),
    url: $('.new-video-url').html(),
    times: [
      {
        name: 'Slot 0',
        time: 0
      }
    ]
  };

  saveOnline()
    .then(function(res) {
      newVideoDialog.close();
      changeVideoRef(datas.id);
    });
}

function openNewVideoDialog() {
  $('#newVideoName').val('');
  $('.new-video-url').remove();
  newVideoDialog.showModal();
}
