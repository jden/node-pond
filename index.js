var gum = require('gumhelper')
var quickconnect = require('rtc-quickconnect')

var $msg = document.getElementById('msg')
var $input = document.getElementById('input')

$input.focus()

gum.startVideoStreaming(function (err, stream, el) {
  if (err) {
    $msg.textContent = err
    return
  }
  el.id = 'you'
  document.body.appendChild(el)
  el.play()
})



function send(x) {
  send._(x)
}
send._ = function () {
  console.log('noop')
}

quickconnect('http://rtc.io/switchboard/', {room: 'jden-pond-asdf'})
  .createDataChannel('selfies')
  .on('channel:opened', function (id, dc) {
    incoming('')
    console.log('opened', arguments)
    dc.onmessage = incoming

    send._ = dc.send.bind(dc)
  })

var canvas = document.getElementById('still')
var context = canvas.getContext('2d')
function getSnapshot(cb) {
  var video = document.getElementById('you')
  var x = video.offsetWidth
  var y = video.offsetHeight
  canvas.width = x
  canvas.height = y

  console.log('getSnapshot', video)
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
  

  console.log('incoming pic')
  // them.style.backgroundImage = 'url(' + e.data + ')'
  document.body.style.backgroundImage = 'url(' + e.data + ')'
}

function incomingMsg(e) {
  msg.textContent = e.data
}

function incoming(e) {
  if (!e || !e.data) {
    return
  }
  if (e.data.indexOf('data:image/png') === 0) {
    incomingPic(e)
  } else {
    incomingMsg (e)
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
}, 1000)

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