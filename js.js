var database = firebase.database();
var firebaseVideoRef;
var datas = {
  times: []
};

var lastSlider;
var lastHandle;
var lastTime;
function updateList() {
  var list = $('.list .mdl-list');

  list.empty();

  datas.times.sort(function(a, b) {
    return a.range[1] - b.range[1];
  });

  var index = 0;
  var slider;
  for (let time of datas.times) {
    list.append(`
      <li class="mdl-list__item">
        <div class="list-item-controls">
          <div class="list-item-title">${time.name}</div>
          <div class="list-item-controls-icons">
            <i class="material-icons" onclick="startStopLoop(${index})">play_arrow</i>
            <i class="material-icons" onclick="editTimestamp(${index})">mode_edit</i>
            <i class="material-icons" onclick="deleteTimestamp(${index})">delete</i>
          </div>
        </div>
        <div class="list-item-range"></div>
      </li>
    `);

    slider = list.find('.list-item-range').last().get(0);

    noUiSlider.create(slider, {
      start: [time.range[0], time.range[1]],
      connect: true,
      step: 0.1,
      range: {
        'min': 0,
        'max': parseInt(player.duration)
      }
    });

    slider.noUiSlider.on('slide', function(values, handle) {
      player.currentTime = values[handle];
    });
    slider.noUiSlider.on('end', function(values, handle) {
      lastSlider = this;
      lastHandle = handle;
      lastTime = time;
      time.range = values;
      saveOnline();
    });

    index++;
  }

  if (window.componentHandler) {
    $('.mdl-list__item').find('.material-icons').each(function() {
      componentHandler.upgradeElement(this);
    });
  }
}

document.onkeydown = function(e) {
  if (lastSlider) {
    var currentValues = lastSlider.get();
    currentValues[0] = parseFloat(currentValues[0]);
    currentValues[1] = parseFloat(currentValues[1]);
    if (e.keyCode === 37 && currentValues[lastHandle] > 0) {
      currentValues[lastHandle] -= 0.1;
    } else if (e.keyCode === 39 && currentValues[lastHandle] < player.duration) {
      currentValues[lastHandle] += 0.1;
    }
    lastSlider.set(currentValues);
    player.currentTime = currentValues[lastHandle];
    lastTime.range = currentValues;
    saveOnline();
  }
}

function addTimestamp() {
  datas.times.push({
    range: [datas.times[datas.times.length - 1].range[1], player.duration],
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

  $('#editButton').attr('onclick', `edit(${i})`);

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
function startStopLoop(i) {
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = undefined;
    $('.start-stop').html('Start Loop');
    player.pause();
    return;
  }

  var start = datas.times[i].range[0];
  var stop = datas.times[i].range[1]
  var duration = stop - start;

  player.currentTime = start;
  player.play();

  currentInterval = setInterval(function() {
    if (player.currentTime < start || player.currentTime >= stop) {
      player.currentTime = start;
    }
  }, 100);
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
        range: [0, 10]
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
