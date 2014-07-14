var gum = require('gumhelper')
var socketio = require('socket.io-client')

var $msg = document.getElementById('msg')
var $input = document.getElementById('input')
var waiting = true
$input.focus()

gum.startVideoStreaming(function (err, stream, el) {
  if (err) {
    $msg.textContent = err
    return
  }
  el.id = 'you'
  document.getElementById('youbox').appendChild(el)
  el.play()
})


function getRoom() {
  if (!window.location.hash) {
    window.location.hash = encodeURIComponent(prompt('enter a room name'))
  }
  return 'jden-pond-' + window.location.hash.substr(1)
}

function send(x) {
  send._(x)
}
send._ = function () {
  // console.log('noop')
}

var saddr = 'http://rooms-a.herokuapp.com/'
console.log(saddr)
var socket = socketio(saddr)
  .on('connect', function () {
    socket.emit('rm', getRoom())

    socket.on('message', incoming)
    send._ = socket.emit.bind(socket, 'message')
  })

var canvas = document.getElementById('still')
var context = canvas.getContext('2d')
function getSnapshot(cb) {
  var video = document.getElementById('you')
  var x = video.offsetWidth
  var y = video.offsetHeight
  canvas.width = x
  canvas.height = y

  // console.log('getSnapshot', video)
  context.drawImage(video, 0, 0, x, y)
  var d = canvas.toDataURL('image/png')
// console.log(d.length, d)

  cb(null, d)
}

var count = 0

function incomingPic(e) {
  // if (count) {
  //   count--
  // } else {
  //   count++
  // }

  // var them = document.getElementById('them'+count)
  // them.style.opacity = 1
  

  // console.log('incoming pic')
  // them.style.backgroundImage = 'url(' + e.data + ')'
  document.body.style.backgroundImage = 'url(' + e + ')'
}

function incomingMsg(e) {
  msg.textContent = e
}

function incoming(data) {
  if (waiting) {
    waiting = false
    $msg.textContent = ''
  }

  if (typeof data !== 'string') {
    return
  }
  if (data.indexOf('data:image/png') === 0) {
    incomingPic(data)
  } else {
    incomingMsg (data)
  }
}


setInterval(function () {
  if (!document.getElementById('you')) {
    console.log('not yet')
    return
  }
  getSnapshot(function (e, data) {
    // incomingPic({data: data})
    send(data)
    // document.body.style.backgroundImage = 'url(' + data + ')'
  })
}, 1500)

// var t = [document.getElementById('them0'), document.getElementById('them1')]
// setInterval(function () {
//   t.forEach(function (them) {
//     var opacity = parseFloat(them.style.opacity)
//     them.style.opacity = Math.max(0, opacity - .1)
//   })
// }, 50)

$input.addEventListener('keypress', function (e) {
  if (e.charCode !== 13) { // enter
    return
  }

  var msg = $input.value
  $input.value = ''
  $input.focus()

  sendMessage(msg)
})

$input.addEventListener('blur', function () {
  console.log('lost focus')
  $input.focus()
})

function sendMessage(msg) {
  // incomingMsg(msg)
  send(msg)
}