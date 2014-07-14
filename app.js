(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  document.getElementById('youbox').appendChild(el)
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
},{"gumhelper":3,"rtc-quickconnect":4}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
(function () { 
    
    // A couple of shims for having a common interface

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    navigator.getMedia = ( navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
    );

    //

    var video;
    var cameraStream;


    /**
     * Requests permission for using the user's camera,
     * starts reading video from the selected camera, and calls
     * `okCallback` when the video dimensions are known (with a fallback
     * for when the dimensions are not reported on time),
     * or calls `errorCallback` if something goes wrong
     */
    function startStreaming(errorCallback, onStreaming, okCallback) {

        var videoElement;
        var cameraStream;
        var attempts = 0;
        var readyListener = function(event) {

            findVideoSize();

        };
        var findVideoSize = function() {

            if(videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {

                videoElement.removeEventListener('loadeddata', readyListener);
                onDimensionsReady(videoElement.videoWidth, videoElement.videoHeight);

            } else {

                if(attempts < 10) {

                    attempts++;
                    setTimeout(findVideoSize, 200);

                } else {

                    onDimensionsReady(640, 480);

                }

            }

        };
        var onDimensionsReady = function(width, height) {
            okCallback(cameraStream, videoElement, width, height);
        };
        
        videoElement = document.createElement('video');
        videoElement.autoplay = true;

        videoElement.addEventListener('loadeddata', readyListener);

        navigator.getMedia({ video: true }, function (stream) {

            onStreaming();

            if(videoElement.mozSrcObject) {
                videoElement.mozSrcObject = stream;
            } else {
                videoElement.src = window.URL.createObjectURL(stream);
            }

            cameraStream = stream;
            videoElement.play();

        }, errorCallback);

    }

    /**
     * Try to initiate video streaming, and transparently handle cases
     * where that is not possible (includes 'deceptive' browsers, see inline
     * comment for more info)
     */
    function startVideoStreaming(callback, options) {

        options = options || {};

        var noGUMSupportTimeout;
        var timeoutLength = options.timeout !== undefined ? options.timeout : 0;

        if(navigator.getMedia) {

            // Some browsers apparently have support for video streaming because of the
            // presence of the getUserMedia function, but then do not answer our
            // calls for streaming.
            // So we'll set up this timeout and if nothing happens after a while, we'll
            // conclude that there's no actual getUserMedia support.
            if(timeoutLength > 0) {
                noGUMSupportTimeout = setTimeout(onStreamingTimeout, 10000);
            }

            startStreaming(function() {

                    // ERROR!!!
                    callback(new Error('getUserMedia cannot access the camera'));

                }, function() {
                    
                    // The streaming started somehow, so we can assume /there is/
                    // gUM support
                    clearTimeout(noGUMSupportTimeout);

                }, function(stream, videoElement, width, height) {

                    // Keep references, for stopping the stream later on.
                    cameraStream = stream;
                    video = videoElement;

                    callback(null, stream, videoElement, width, height);

                }
            );

        } else {

            callback(new Error('Native device media streaming (getUserMedia) not supported in this browser.'));

        }


        function onStreamingTimeout() {
            callback(new Error('Timed out while trying to start streaming'));
        }

    }


    function stopVideoStreaming() {
        
        if(cameraStream) {

            cameraStream.stop();

        }

        if(video) {

            video.pause();
            // TODO free src url object
            video.src = null;
            video = null;

        }

    }

    var GumHelper = {
        startVideoStreaming: startVideoStreaming,
        stopVideoStreaming: stopVideoStreaming
    };

    console.log('g', module, module.exports, GumHelper)
    // Make it compatible for require.js/AMD loader(s)
    if(typeof define === 'function' && define.amd) {
        define(function() { return GumHelper; });
    } else if(typeof module !== 'undefined' && module.exports) {
        // And for npm/node.js
        module.exports = GumHelper;
    } else {
        this.GumHelper = GumHelper;
    }

}).call(this);



},{}],4:[function(require,module,exports){
(function (process){
/* jshint node: true */
'use strict';

var rtc = require('rtc-tools');
var cleanup = require('rtc-tools/cleanup');
var debug = rtc.logger('rtc-quickconnect');
var signaller = require('rtc-signaller');
var defaults = require('cog/defaults');
var extend = require('cog/extend');
var getable = require('cog/getable');
var reTrailingSlash = /\/$/;

/**
  # rtc-quickconnect

  This is a high level helper module designed to help you get up
  an running with WebRTC really, really quickly.  By using this module you
  are trading off some flexibility, so if you need a more flexible
  configuration you should drill down into lower level components of the
  [rtc.io](http://www.rtc.io) suite.  In particular you should check out
  [rtc](https://github.com/rtc-io/rtc).

  ## Upgrading to 1.0

  The [upgrading to 1.0 documentation](https://github.com/rtc-io/rtc-quickconnect/blob/master/docs/upgrading-to-1.0.md)
  provides some information on what you need to change to upgrade to
  `rtc-quickconnect@1.0`.  Additionally, the
  [quickconnect demo app](https://github.com/rtc-io/rtcio-demo-quickconnect)
  has been updated which should provide some additional information.

  ## Example Usage

  In the simplest case you simply call quickconnect with a single string
  argument which tells quickconnect which server to use for signaling:

  <<< examples/simple.js

  <<< docs/events.md

  <<< docs/examples.md

  ## Regarding Signalling and a Signalling Server

  Signaling is an important part of setting up a WebRTC connection and for
  our examples we use our own test instance of the
  [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard). For your
  testing and development you are more than welcome to use this also, but
  just be aware that we use this for our testing so it may go up and down
  a little.  If you need something more stable, why not consider deploying
  an instance of the switchboard yourself - it's pretty easy :)

  ## Reference

  ```
  quickconnect(signalhost, opts?) => rtc-sigaller instance (+ helpers)
  ```

  ### Valid Quick Connect Options

  The options provided to the `rtc-quickconnect` module function influence the
  behaviour of some of the underlying components used from the rtc.io suite.

  Listed below are some of the commonly used options:

  - `ns` (default: '')

    An optional namespace for your signalling room.  While quickconnect
    will generate a unique hash for the room, this can be made to be more
    unique by providing a namespace.  Using a namespace means two demos
    that have generated the same hash but use a different namespace will be
    in different rooms.

  - `room` (default: null) _added 0.6_

    Rather than use the internal hash generation
    (plus optional namespace) for room name generation, simply use this room
    name instead.  __NOTE:__ Use of the `room` option takes precendence over
    `ns`.

  - `debug` (default: false)

  Write rtc.io suite debug output to the browser console.

  #### Options for Peer Connection Creation

  Options that are passed onto the
  [rtc.createConnection](https://github.com/rtc-io/rtc#createconnectionopts-constraints)
  function:

  - `iceServers`

  This provides a list of ice servers that can be used to help negotiate a
  connection between peers.

  #### Options for P2P negotiation

  Under the hood, quickconnect uses the
  [rtc/couple](https://github.com/rtc-io/rtc#rtccouple) logic, and the options
  passed to quickconnect are also passed onto this function.

**/
module.exports = function(signalhost, opts) {
  var hash = typeof location != 'undefined' && location.hash.slice(1);
  var signaller = require('rtc-signaller')(signalhost, opts);

  // init configurable vars
  var ns = (opts || {}).ns || '';
  var room = (opts || {}).room;
  var debugging = (opts || {}).debug;
  var profile = {};
  var announced = false;

  // collect the local streams
  var localStreams = [];

  // create the calls map
  var calls = signaller.calls = getable({});

  // create the known data channels registry
  var channels = {};

  function callCreate(id, pc, data) {
    calls.set(id, {
      active: false,
      pc: pc,
      channels: getable({}),
      data: data,
      streams: []
    });
  }

  function callEnd(id) {
    var call = calls.get(id);

    // if we have no data, then do nothing
    if (! call) {
      return;
    }

    debug('ending call to: ' + id);

    // if we have no data, then return
    call.channels.keys().forEach(function(label) {
      var args = [id, call.channels.get(label), label];

      // emit the plain channel:closed event
      signaller.emit.apply(signaller, ['channel:closed'].concat(args));

      // emit the labelled version of the event
      signaller.emit.apply(signaller, ['channel:closed:' + label].concat(args));
    });

    // trigger stream:removed events for each of the remotestreams in the pc
    call.streams.forEach(function(stream) {
      signaller.emit('stream:removed', id, stream);
    });

    // delete the call data
    calls.delete(id);

    // trigger the call:ended event
    signaller.emit('call:ended', id, call.pc);

    // ensure the peer connection is properly cleaned up
    cleanup(call.pc);
  }

  function callStart(id, pc, data) {
    var call = calls.get(id);
    var streams = [].concat(pc.getRemoteStreams());

    // flag the call as active
    call.active = true;
    call.streams = [].concat(pc.getRemoteStreams());

    pc.onaddstream = createStreamAddHandler(id);
    pc.onremovestream = createStreamRemoveHandler(id);

    debug(signaller.id + ' - ' + id + ' call start: ' + streams.length + ' streams');
    signaller.emit('call:started', id, pc, data);

    // examine the existing remote streams after a short delay
    process.nextTick(function() {
      // iterate through any remote streams
      streams.forEach(receiveRemoteStream(id));
    });
  }

  function createStreamAddHandler(id) {
    return function(evt) {
      debug('peer ' + id + ' added stream');
      updateRemoteStreams(id);
      receiveRemoteStream(id)(evt.stream);
    }
  }

  function createStreamRemoveHandler(id) {
    return function(evt) {
      debug('peer ' + id + ' removed stream');
      updateRemoteStreams(id);
      signaller.emit('stream:removed', id, evt.stream);
    };
  }

  function getActiveCall(peerId) {
    var call = calls.get(peerId);

    if (! call) {
      throw new Error('No active call for peer: ' + peerId);
    }

    return call;
  }

  function gotPeerChannel(channel, pc, data) {
    var channelMonitor;

    function channelReady() {
      var call = calls.get(data.id);
      var args = [ data.id, channel, data, pc ];

      // decouple the channel.onopen listener
      debug('reporting channel "' + channel.label + '" ready, have call: ' + (!!call));
      clearInterval(channelMonitor);
      channel.onopen = null;

      // save the channel
      if (call) {
        call.channels.set(channel.label, channel);
      }

      // trigger the %channel.label%:open event
      debug('triggering channel:opened events for channel: ' + channel.label);

      // emit the plain channel:opened event
      signaller.emit.apply(signaller, ['channel:opened'].concat(args));

      // emit the channel:opened:%label% eve
      signaller.emit.apply(
        signaller,
        ['channel:opened:' + channel.label].concat(args)
      );
    }

    debug('channel ' + channel.label + ' discovered for peer: ' + data.id);
    if (channel.readyState === 'open') {
      return channelReady();
    }

    debug('channel not ready, current state = ' + channel.readyState);
    channel.onopen = channelReady;

    // monitor the channel open (don't trust the channel open event just yet)
    channelMonitor = setInterval(function() {
      debug('checking channel state, current state = ' + channel.readyState);
      if (channel.readyState === 'open') {
        channelReady();
      }
    }, 500);
  }

  function handlePeerAnnounce(data) {
    var pc;
    var monitor;

    // if the room is not a match, abort
    if (data.room !== room) {
      return;
    }

    // create a peer connection
    pc = rtc.createConnection(opts, (opts || {}).constraints);

    // add this connection to the calls list
    callCreate(data.id, pc, data);

    // add the local streams
    localStreams.forEach(function(stream, idx) {
      pc.addStream(stream);
    });

    // add the data channels
    // do this differently based on whether the connection is a
    // master or a slave connection
    if (signaller.isMaster(data.id)) {
      debug('is master, creating data channels: ', Object.keys(channels));

      // create the channels
      Object.keys(channels).forEach(function(label) {
       gotPeerChannel(pc.createDataChannel(label, channels[label]), pc, data);
      });
    }
    else {
      pc.ondatachannel = function(evt) {
        var channel = evt && evt.channel;

        // if we have no channel, abort
        if (! channel) {
          return;
        }

        if (channels[channel.label] !== undefined) {
          gotPeerChannel(channel, pc, data);
        }
      };
    }

    // couple the connections
    debug('coupling ' + signaller.id + ' to ' + data.id);
    monitor = rtc.couple(pc, data.id, signaller, opts);

    // once active, trigger the peer connect event
    monitor.once('connected', callStart.bind(null, data.id, pc, data))
    monitor.once('closed', callEnd.bind(null, data.id));

    // if we are the master connnection, create the offer
    // NOTE: this only really for the sake of politeness, as rtc couple
    // implementation handles the slave attempting to create an offer
    if (signaller.isMaster(data.id)) {
      monitor.createOffer();
    }
  }

  function receiveRemoteStream(id) {
    var call = calls.get(id);

    return function(stream) {
      signaller.emit('stream:added', id, stream, call && call.data);
    };
  }

  function updateRemoteStreams(id) {
    var call = calls.get(id);

    if (call && call.pc) {
      call.streams = [].concat(call.pc.getRemoteStreams());
    }
  }

  // if the room is not defined, then generate the room name
  if (! room) {
    // if the hash is not assigned, then create a random hash value
    if (! hash) {
      hash = location.hash = '' + (Math.pow(2, 53) * Math.random());
    }

    room = ns + '#' + hash;
  }

  if (debugging) {
    rtc.logger.enable.apply(rtc.logger, Array.isArray(debug) ? debugging : ['*']);
  }

  signaller.on('peer:announce', handlePeerAnnounce);
  signaller.on('peer:leave', callEnd);

  // announce ourselves to our new friend
  setTimeout(function() {
    var data = extend({}, profile, { room: room });

    // announce and emit the local announce event
    signaller.announce(data);
    signaller.emit('local:announce', data);
    announced = true;
  }, 0);

  /**
    ### Quickconnect Broadcast and Data Channel Helper Functions

    The following are functions that are patched into the `rtc-signaller`
    instance that make working with and creating functional WebRTC applications
    a lot simpler.

  **/

  /**
    #### addStream

    ```
    addStream(stream:MediaStream) => qc
    ```

    Add the stream to active calls and also save the stream so that it
    can be added to future calls.

  **/
  signaller.broadcast = signaller.addStream = function(stream) {
    localStreams.push(stream);

    // if we have any active calls, then add the stream
    calls.values().forEach(function(data) {
      data.pc.addStream(stream);
    });

    return signaller;
  };

  /**
    #### close()

    The `close` function provides a convenient way of closing all associated
    peer connections.
  **/
  signaller.close = function() {
    // end each of the active calls
    calls.keys().forEach(callEnd);

    // call the underlying signaller.leave (for which close is an alias)
    signaller.leave();
  };

  /**
    #### createDataChannel(label, config)

    Request that a data channel with the specified `label` is created on
    the peer connection.  When the data channel is open and available, an
    event will be triggered using the label of the data channel.

    For example, if a new data channel was requested using the following
    call:

    ```js
    var qc = quickconnect('http://rtc.io/switchboard').createDataChannel('test');
    ```

    Then when the data channel is ready for use, a `test:open` event would
    be emitted by `qc`.

  **/
  signaller.createDataChannel = function(label, opts) {
    // create a channel on all existing calls
    calls.keys().forEach(function(peerId) {
      var call = calls.get(peerId);
      var dc;

      // if we are the master connection, create the data channel
      if (call && call.pc && signaller.isMaster(peerId)) {
        dc = call.pc.createDataChannel(label, opts);
        gotPeerChannel(dc, call.pc, call.data);
      }
    });

    // save the data channel opts in the local channels dictionary
    channels[label] = opts || null;

    return signaller;
  };

  /**
    #### reactive()

    Flag that this session will be a reactive connection.

  **/
  signaller.reactive = function() {
    // add the reactive flag
    opts = opts || {};
    opts.reactive = true;

    // chain
    return signaller;
  };

  /**
    #### removeStream

    ```
    removeStream(stream:MediaStream)
    ```

    Remove the specified stream from both the local streams that are to
    be connected to new peers, and also from any active calls.

  **/
  signaller.removeStream = function(stream) {
    var localIndex = localStreams.indexOf(stream);

    // remove the stream from any active calls
    calls.values().forEach(function(call) {
      call.pc.removeStream(stream);
    });

    // remove the stream from the localStreams array
    if (localIndex >= 0) {
      localStreams.splice(localIndex, 1);
    }

    return signaller;
  };

  /**
    #### requestChannel

    ```
    requestChannel(targetId, label, callback)
    ```

    This is a function that can be used to respond to remote peers supplying
    a data channel as part of their configuration.  As per the `receiveStream`
    function this function will either fire the callback immediately if the
    channel is already available, or once the channel has been discovered on
    the call.

  **/
  signaller.requestChannel = function(targetId, label, callback) {
    var call = getActiveCall(targetId);
    var channel = call && call.channels.get(label);

    // if we have then channel trigger the callback immediately
    if (channel) {
      callback(null, channel);
      return signaller;
    }

    // if not, wait for it
    signaller.once('channel:opened:' + label, function(id, dc) {
      callback(null, dc);
    });

    return signaller;
  };

  /**
    #### requestStream

    ```
    requestStream(targetId, idx, callback)
    ```

    Used to request a remote stream from a quickconnect instance. If the
    stream is already available in the calls remote streams, then the callback
    will be triggered immediately, otherwise this function will monitor
    `stream:added` events and wait for a match.

    In the case that an unknown target is requested, then an exception will
    be thrown.
  **/
  signaller.requestStream = function(targetId, idx, callback) {
    var call = getActiveCall(targetId);
    var stream;

    function waitForStream(peerId) {
      if (peerId !== targetId) {
        return;
      }

      // get the stream
      stream = call.pc.getRemoteStreams()[idx];

      // if we have the stream, then remove the listener and trigger the cb
      if (stream) {
        signaller.removeListener('stream:added', waitForStream);
        callback(null, stream);
      }
    }

    // look for the stream in the remote streams of the call
    stream = call.pc.getRemoteStreams()[idx];

    // if we found the stream then trigger the callback
    if (stream) {
      callback(null, stream);
      return signaller;
    }

    // otherwise wait for the stream
    signaller.on('stream:added', waitForStream);
    return signaller;
  };

  /**
    #### profile(data)

    Update the profile data with the attached information, so when
    the signaller announces it includes this data in addition to any
    room and id information.

  **/
  signaller.profile = function(data) {
    extend(profile, data);

    // if we have already announced, then reannounce our profile to provide
    // others a `peer:update` event
    if (announced) {
      signaller.announce(profile);
    }

    return signaller;
  };

  /**
    #### waitForCall

    ```
    waitForCall(targetId, callback)
    ```

    Wait for a call from the specified targetId.  If the call is already
    active the callback will be fired immediately, otherwise we will wait
    for a `call:started` event that matches the requested `targetId`

  **/
  signaller.waitForCall = function(targetId, callback) {
    var call = calls.get(targetId);

    if (call && call.active) {
      callback(null, call.pc);
      return signaller;
    }

    signaller.on('call:started', function handleNewCall(id) {
      if (id === targetId) {
        signaller.removeListener('call:started', handleNewCall);
        callback(null, calls.get(id).pc);
      }
    });
  };

  // pass the signaller on
  return signaller;
};

}).call(this,require("Zbi7gb"))
},{"Zbi7gb":2,"cog/defaults":5,"cog/extend":6,"cog/getable":7,"rtc-signaller":14,"rtc-tools":28,"rtc-tools/cleanup":24}],5:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
## cog/defaults

```js
var defaults = require('cog/defaults');
```

### defaults(target, *)

Shallow copy object properties from the supplied source objects (*) into
the target object, returning the target object once completed.  Do not,
however, overwrite existing keys with new values:

```js
defaults({ a: 1, b: 2 }, { c: 3 }, { d: 4 }, { b: 5 }));
```

See an example on [requirebin](http://requirebin.com/?gist=6079475).
**/
module.exports = function(target) {
  // ensure we have a target
  target = target || {};

  // iterate through the sources and copy to the target
  [].slice.call(arguments, 1).forEach(function(source) {
    if (! source) {
      return;
    }

    for (var prop in source) {
      if (target[prop] === void 0) {
        target[prop] = source[prop];
      }
    }
  });

  return target;
};
},{}],6:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
## cog/extend

```js
var extend = require('cog/extend');
```

### extend(target, *)

Shallow copy object properties from the supplied source objects (*) into
the target object, returning the target object once completed:

```js
extend({ a: 1, b: 2 }, { c: 3 }, { d: 4 }, { b: 5 }));
```

See an example on [requirebin](http://requirebin.com/?gist=6079475).
**/
module.exports = function(target) {
  [].slice.call(arguments, 1).forEach(function(source) {
    if (! source) {
      return;
    }

    for (var prop in source) {
      target[prop] = source[prop];
    }
  });

  return target;
};
},{}],7:[function(require,module,exports){
/**
  ## cog/getable

  Take an object and provide a wrapper that allows you to `get` and
  `set` values on that object.

**/
module.exports = function(target) {
  function get(key) {
    return target[key];
  }

  function set(key, value) {
    target[key] = value;
  }

  function remove(key) {
    return delete target[key];
  }

  function keys() {
    return Object.keys(target);
  };

  function values() {
    return Object.keys(target).map(function(key) {
      return target[key];
    });
  };

  if (typeof target != 'object') {
    return target;
  }

  return {
    get: get,
    set: set,
    remove: remove,
    delete: remove,
    keys: keys,
    values: values
  };
};

},{}],8:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ## cog/jsonparse

  ```js
  var jsonparse = require('cog/jsonparse');
  ```

  ### jsonparse(input)

  This function will attempt to automatically detect stringified JSON, and
  when detected will parse into JSON objects.  The function looks for strings
  that look and smell like stringified JSON, and if found attempts to
  `JSON.parse` the input into a valid object.

**/
module.exports = function(input) {
  var isString = typeof input == 'string' || (input instanceof String);
  var reNumeric = /^\-?\d+\.?\d*$/;
  var shouldParse ;
  var firstChar;
  var lastChar;

  if ((! isString) || input.length < 2) {
    if (isString && reNumeric.test(input)) {
      return parseFloat(input);
    }

    return input;
  }

  // check for true or false
  if (input === 'true' || input === 'false') {
    return input === 'true';
  }

  // check for null
  if (input === 'null') {
    return null;
  }

  // get the first and last characters
  firstChar = input.charAt(0);
  lastChar = input.charAt(input.length - 1);

  // determine whether we should JSON.parse the input
  shouldParse =
    (firstChar == '{' && lastChar == '}') ||
    (firstChar == '[' && lastChar == ']') ||
    (firstChar == '"' && lastChar == '"');

  if (shouldParse) {
    try {
      return JSON.parse(input);
    }
    catch (e) {
      // apparently it wasn't valid json, carry on with regular processing
    }
  }


  return reNumeric.test(input) ? parseFloat(input) : input;
};
},{}],9:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ## cog/logger

  ```js
  var logger = require('cog/logger');
  ```

  Simple browser logging offering similar functionality to the
  [debug](https://github.com/visionmedia/debug) module.

  ### Usage

  Create your self a new logging instance and give it a name:

  ```js
  var debug = logger('phil');
  ```

  Now do some debugging:

  ```js
  debug('hello');
  ```

  At this stage, no log output will be generated because your logger is
  currently disabled.  Enable it:

  ```js
  logger.enable('phil');
  ```

  Now do some more logger:

  ```js
  debug('Oh this is so much nicer :)');
  // --> phil: Oh this is some much nicer :)
  ```

  ### Reference
**/

var active = [];
var unleashListeners = [];
var targets = [ console ];

/**
  #### logger(name)

  Create a new logging instance.
**/
var logger = module.exports = function(name) {
  // initial enabled check
  var enabled = checkActive();

  function checkActive() {
    return enabled = active.indexOf('*') >= 0 || active.indexOf(name) >= 0;
  }

  // register the check active with the listeners array
  unleashListeners[unleashListeners.length] = checkActive;

  // return the actual logging function
  return function() {
    var args = [].slice.call(arguments);

    // if we have a string message
    if (typeof args[0] == 'string' || (args[0] instanceof String)) {
      args[0] = name + ': ' + args[0];
    }

    // if not enabled, bail
    if (! enabled) {
      return;
    }

    // log
    targets.forEach(function(target) {
      target.log.apply(target, args);
    });
  };
};

/**
  #### logger.reset()

  Reset logging (remove the default console logger, flag all loggers as
  inactive, etc, etc.
**/
logger.reset = function() {
  // reset targets and active states
  targets = [];
  active = [];

  return logger.enable();
};

/**
  #### logger.to(target)

  Add a logging target.  The logger must have a `log` method attached.

**/
logger.to = function(target) {
  targets = targets.concat(target || []);

  return logger;
};

/**
  #### logger.enable(names*)

  Enable logging via the named logging instances.  To enable logging via all
  instances, you can pass a wildcard:

  ```js
  logger.enable('*');
  ```

  __TODO:__ wildcard enablers
**/
logger.enable = function() {
  // update the active
  active = active.concat([].slice.call(arguments));

  // trigger the unleash listeners
  unleashListeners.forEach(function(listener) {
    listener();
  });

  return logger;
};
},{}],10:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ## cog/throttle

  ```js
  var throttle = require('cog/throttle');
  ```

  ### throttle(fn, delay, opts)

  A cherry-pickable throttle function.  Used to throttle `fn` to ensure
  that it can be called at most once every `delay` milliseconds.  Will
  fire first event immediately, ensuring the next event fired will occur
  at least `delay` milliseconds after the first, and so on.

**/
module.exports = function(fn, delay, opts) {
  var lastExec = (opts || {}).leading !== false ? 0 : Date.now();
  var trailing = (opts || {}).trailing;
  var timer;
  var queuedArgs;
  var queuedScope;

  // trailing defaults to true
  trailing = trailing || trailing === undefined;
  
  function invokeDefered() {
    fn.apply(queuedScope, queuedArgs || []);
    lastExec = Date.now();
  }

  return function() {
    var tick = Date.now();
    var elapsed = tick - lastExec;

    // always clear the defered timer
    clearTimeout(timer);

    if (elapsed < delay) {
      queuedArgs = [].slice.call(arguments, 0);
      queuedScope = this;

      return trailing && (timer = setTimeout(invokeDefered, delay - elapsed));
    }

    // call the function
    lastExec = tick;
    fn.apply(this, arguments);
  };
};
},{}],11:[function(require,module,exports){
/* jshint node: true */
/* global window: false */
/* global navigator: false */

'use strict';

var browser = require('detect-browser');

/**
  ## rtc-core/detect

  A browser detection helper for accessing prefix-free versions of the various
  WebRTC types.

  ### Example Usage

  If you wanted to get the native `RTCPeerConnection` prototype in any browser
  you could do the following:

  ```js
  var detect = require('rtc-core/detect'); // also available in rtc/detect
  var RTCPeerConnection = detect('RTCPeerConnection');
  ```

  This would provide whatever the browser prefixed version of the
  RTCPeerConnection is available (`webkitRTCPeerConnection`,
  `mozRTCPeerConnection`, etc).
**/
var detect = module.exports = function(target, prefixes) {
  var prefixIdx;
  var prefix;
  var testName;
  var hostObject = this || (typeof window != 'undefined' ? window : undefined);

  // if we have no host object, then abort
  if (! hostObject) {
    return;
  }

  // initialise to default prefixes
  // (reverse order as we use a decrementing for loop)
  prefixes = (prefixes || ['ms', 'o', 'moz', 'webkit']).concat('');

  // iterate through the prefixes and return the class if found in global
  for (prefixIdx = prefixes.length; prefixIdx--; ) {
    prefix = prefixes[prefixIdx];

    // construct the test class name
    // if we have a prefix ensure the target has an uppercase first character
    // such that a test for getUserMedia would result in a
    // search for webkitGetUserMedia
    testName = prefix + (prefix ?
                            target.charAt(0).toUpperCase() + target.slice(1) :
                            target);

    if (typeof hostObject[testName] != 'undefined') {
      // update the last used prefix
      detect.browser = detect.browser || prefix.toLowerCase();

      // return the host object member
      return hostObject[target] = hostObject[testName];
    }
  }
};

// detect mozilla (yes, this feels dirty)
detect.moz = typeof navigator != 'undefined' && !!navigator.mozGetUserMedia;

// set the browser and browser version
detect.browser = browser.name;
detect.browserVersion = detect.version = browser.version;

},{"detect-browser":12}],12:[function(require,module,exports){
var browsers = [
  [ 'chrome', /Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/ ],
  [ 'firefox', /Firefox\/([0-9\.]+)(?:\s|$)/ ],
  [ 'opera', /Opera\/([0-9\.]+)(?:\s|$)/ ],
  [ 'ie', /Trident\/7\.0.*rv\:([0-9\.]+)\).*Gecko$/ ]
];

var match = browsers.map(match).filter(isMatch)[0];
var parts = match && match[3].split('.').slice(0,3);

while (parts.length < 3) {
  parts.push('0');
}

// set the name and version
exports.name = match && match[0];
exports.version = parts.join('.');

function match(pair) {
  return pair.concat(pair[1].exec(navigator.userAgent));
}

function isMatch(pair) {
  return !!pair[2];
}

},{}],13:[function(require,module,exports){
var detect = require('./detect');
var requiredFunctions = [
  'init'
];

function isSupported(plugin) {
  return plugin && typeof plugin.supported == 'function' && plugin.supported(detect);
}

function isValid(plugin) {
  var supportedFunctions = requiredFunctions.filter(function(fn) {
    return typeof plugin[fn] == 'function';
  });

  return supportedFunctions.length === requiredFunctions.length;
}

module.exports = function(plugins) {
  return [].concat(plugins || []).filter(isSupported).filter(isValid)[0];
}

},{"./detect":11}],14:[function(require,module,exports){
var extend = require('cog/extend');

module.exports = function(messenger, opts) {
  return require('./index.js')(messenger, extend({
    connect: require('./primus-loader')
  }, opts));
};

},{"./index.js":19,"./primus-loader":21,"cog/extend":6}],15:[function(require,module,exports){
module.exports = {
  // messenger events
  dataEvent: 'data',
  openEvent: 'open',
  closeEvent: 'close',

  // messenger functions
  writeMethod: 'write',
  closeMethod: 'close',

  // leave timeout (ms)
  leaveTimeout: 3000
};
},{}],16:[function(require,module,exports){
/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-signaller');
var extend = require('cog/extend');
var roles = ['a', 'b'];

/**
  #### announce

  ```
  /announce|%metadata%|{"id": "...", ... }
  ```

  When an announce message is received by the signaller, the attached
  object data is decoded and the signaller emits an `announce` message.

**/
module.exports = function(signaller) {

  function copyData(target, source) {
    if (target && source) {
      for (var key in source) {
        target[key] = source[key];
      }
    }

    return target;
  }

  function dataAllowed(data) {
    var evt = {
      data: data,
      allow: true
    };

    signaller.emit('peer:filter', evt);

    return evt.allow;
  }

  return function(args, messageType, srcData, srcState, isDM) {
    var data = args[0];
    var peer;

    debug('announce handler invoked, received data: ', data);

    // if we have valid data then process
    if (data && data.id && data.id !== signaller.id) {
      if (! dataAllowed(data)) {
        return;
      }
      // check to see if this is a known peer
      peer = signaller.peers.get(data.id);

      // trigger the peer connected event to flag that we know about a
      // peer connection. The peer has passed the "filter" check but may
      // be announced / updated depending on previous connection status
      signaller.emit('peer:connected', data.id, data);

      // if the peer is existing, then update the data
      if (peer && (! peer.inactive)) {
        debug('signaller: ' + signaller.id + ' received update, data: ', data);

        // update the data
        copyData(peer.data, data);

        // trigger the peer update event
        return signaller.emit('peer:update', data, srcData);
      }

      // create a new peer
      peer = {
        id: data.id,

        // initialise the local role index
        roleIdx: [data.id, signaller.id].sort().indexOf(data.id),

        // initialise the peer data
        data: {}
      };

      // initialise the peer data
      copyData(peer.data, data);

      // reset inactivity state
      clearTimeout(peer.leaveTimer);
      peer.inactive = false;

      // set the peer data
      signaller.peers.set(data.id, peer);

      // if this is an initial announce message (no vector clock attached)
      // then send a announce reply
      if (signaller.autoreply && (! isDM)) {
        signaller
          .to(data.id)
          .send('/announce', signaller.attributes);
      }

      // emit a new peer announce event
      return signaller.emit('peer:announce', data, peer);
    }
  };
};
},{"cog/extend":6,"cog/logger":9}],17:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ### signaller message handlers

**/

module.exports = function(signaller, opts) {
  return {
    announce: require('./announce')(signaller, opts),
    leave: require('./leave')(signaller, opts)
  };
};
},{"./announce":16,"./leave":18}],18:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  #### leave

  ```
  /leave|{"id":"..."}
  ```

  When a leave message is received from a peer, we check to see if that is
  a peer that we are managing state information for and if we are then the
  peer state is removed.

**/
module.exports = function(signaller, opts) {
  return function(args) {
    var data = args[0];
    var peer = signaller.peers.get(data && data.id);

    if (peer) {
      // start the inactivity timer
      peer.leaveTimer = setTimeout(function() {
        peer.inactive = true;
        signaller.emit('peer:leave', data.id, peer);
      }, opts.leaveTimeout);
    }

    // emit the event
    signaller.emit('peer:disconnected', data.id, peer);
  };
};
},{}],19:[function(require,module,exports){
/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-signaller');
var detect = require('rtc-core/detect');
var EventEmitter = require('eventemitter3');
var defaults = require('cog/defaults');
var extend = require('cog/extend');
var throttle = require('cog/throttle');
var getable = require('cog/getable');
var uuid = require('./uuid');

// initialise the list of valid "write" methods
var WRITE_METHODS = ['write', 'send'];
var CLOSE_METHODS = ['close', 'end'];

// initialise signaller metadata so we don't have to include the package.json
// TODO: make this checkable with some kind of prepublish script
var metadata = {
  version: '2.3.0'
};

/**
  # rtc-signaller

  The `rtc-signaller` module provides a transportless signalling
  mechanism for WebRTC.

  ## Purpose

  <<< docs/purpose.md

  ## Getting Started

  While the signaller is capable of communicating by a number of different
  messengers (i.e. anything that can send and receive messages over a wire)
  it comes with support for understanding how to connect to an
  [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard) out of the box.

  The following code sample demonstrates how:

  <<< examples/getting-started.js

  <<< docs/events.md

  <<< docs/signalflow-diagrams.md

  ## Reference

  The `rtc-signaller` module is designed to be used primarily in a functional
  way and when called it creates a new signaller that will enable
  you to communicate with other peers via your messaging network.

  ```js
  // create a signaller from something that knows how to send messages
  var signaller = require('rtc-signaller')(messenger);
  ```

  As demonstrated in the getting started guide, you can also pass through
  a string value instead of a messenger instance if you simply want to
  connect to an existing `rtc-switchboard` instance.

**/
module.exports = function(messenger, opts) {
  // get the autoreply setting
  var autoreply = (opts || {}).autoreply;
  var connect = (opts || {}).connect;

  // initialise the metadata
  var localMeta = {};

  // create the signaller
  var signaller = new EventEmitter();

  // initialise the id
  var id = signaller.id = (opts || {}).id || uuid();

  // initialise the attributes
  var attributes = signaller.attributes = {
    browser: detect.browser,
    browserVersion: detect.browserVersion,
    id: id,
    agent: 'signaller@' + metadata.version
  };

  // create the peers map
  var peers = signaller.peers = getable({});

  // initialise the data event name

  var connected = false;
  var write;
  var close;
  var processor;
  var announceTimer = 0;

  function announceOnReconnect() {
    signaller.announce();
  }

  function bindBrowserEvents() {
    messenger.addEventListener('message', function(evt) {
      processor(evt.data);
    });

    messenger.addEventListener('open', function(evt) {
      connected = true;
      signaller.emit('open');
      signaller.emit('connected');
    });

    messenger.addEventListener('close', function(evt) {
      connected = false;
      signaller.emit('disconnected');
    });
  }

  function bindEvents() {
    // if we don't have an on function for the messenger, then do nothing
    if (typeof messenger.on != 'function') {
      return;
    }

    // handle message data events
    messenger.on(opts.dataEvent, processor);

    // when the connection is open, then emit an open event and a connected event
    messenger.on(opts.openEvent, function() {
      connected = true;
      signaller.emit('open');
      signaller.emit('connected');
    });

    messenger.on(opts.closeEvent, function() {
      connected = false;
      signaller.emit('disconnected');
    });
  }

  function connectToHost(url) {
    if (typeof connect != 'function') {
      return signaller.emit('error', new Error('no connect function'));
    }

    // load primus
    connect(url, function(err, socket) {
      if (err) {
        return signaller.emit('error', err);
      }

      // create the actual messenger from a primus connection
      signaller._messenger = messenger = socket.connect(url);

      // now init
      init();
    });
  }

  function createDataLine(args) {
    return args.map(prepareArg).join('|');
  }

  function createMetadata() {
    return extend({}, localMeta, { id: signaller.id });
  }

  function extractProp(name) {
    return messenger[name];
  }

  // attempt to detect whether the underlying messenger is closing
  // this can be tough as we deal with both native (or simulated native)
  // sockets or an abstraction layer such as primus
  function isClosing() {
    var isAbstraction = messenger &&
        // a primus socket has a socket attribute
        typeof messenger.socket != 'undefined';

    return isAbstraction ? false : (
      messenger &&
      typeof messenger.readyState != 'undefined' &&
      messenger.readyState >= 2
    );
  }

  function isF(target) {
    return typeof target == 'function';
  }

  function init() {
    // extract the write and close function references
    write = [opts.writeMethod].concat(WRITE_METHODS).map(extractProp).filter(isF)[0];
    close = [opts.closeMethod].concat(CLOSE_METHODS).map(extractProp).filter(isF)[0];

    // create the processor
    signaller.process = processor = require('./processor')(signaller, opts);

    // if the messenger doesn't provide a valid write method, then complain
    if (typeof write != 'function') {
      throw new Error('provided messenger does not implement a "' +
        writeMethod + '" write method');
    }

    // handle core browser messenging apis
    if (typeof messenger.addEventListener == 'function') {
      bindBrowserEvents();
    }
    else {
      bindEvents();
    }

    // determine if we are connected or not
    connected = messenger.connected || false;
    if (! connected) {
      signaller.once('connected', function() {
        // always announce on reconnect
        signaller.on('connected', announceOnReconnect);
      });
    }

    // emit the initialized event
    setTimeout(signaller.emit.bind(signaller, 'init'), 0);
  }

  function prepareArg(arg) {
    if (typeof arg == 'object' && (! (arg instanceof String))) {
      return JSON.stringify(arg);
    }
    else if (typeof arg == 'function') {
      return null;
    }

    return arg;
  }

  /**
    ### signaller#send(message, data*)

    Use the send function to send a message to other peers in the current
    signalling scope (if announced in a room this will be a room, otherwise
    broadcast to all peers connected to the signalling server).

  **/
  var send = signaller.send = function() {
    // iterate over the arguments and stringify as required
    // var metadata = { id: signaller.id };
    var args = [].slice.call(arguments);
    var dataline;

    // inject the metadata
    args.splice(1, 0, createMetadata());
    dataline = createDataLine(args);

    // perform an isclosing check
    if (isClosing()) {
      return;
    }

    // if we are not initialized, then wait until we are
    if (! connected) {
      return signaller.once('connected', function() {
        write.call(messenger, dataline);
      });
    }

    // send the data over the messenger
    return write.call(messenger, dataline);
  };

  /**
    ### announce(data?)

    The `announce` function of the signaller will pass an `/announce` message
    through the messenger network.  When no additional data is supplied to
    this function then only the id of the signaller is sent to all active
    members of the messenging network.

    #### Joining Rooms

    To join a room using an announce call you simply provide the name of the
    room you wish to join as part of the data block that you annouce, for
    example:

    ```js
    signaller.announce({ room: 'testroom' });
    ```

    Signalling servers (such as
    [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard)) will then
    place your peer connection into a room with other peers that have also
    announced in this room.

    Once you have joined a room, the server will only deliver messages that
    you `send` to other peers within that room.

    #### Providing Additional Announce Data

    There may be instances where you wish to send additional data as part of
    your announce message in your application.  For instance, maybe you want
    to send an alias or nick as part of your announce message rather than just
    use the signaller's generated id.

    If for instance you were writing a simple chat application you could join
    the `webrtc` room and tell everyone your name with the following announce
    call:

    ```js
    signaller.announce({
      room: 'webrtc',
      nick: 'Damon'
    });
    ```

    #### Announcing Updates

    The signaller is written to distinguish between initial peer announcements
    and peer data updates (see the docs on the announce handler below). As
    such it is ok to provide any data updates using the announce method also.

    For instance, I could send a status update as an announce message to flag
    that I am going offline:

    ```js
    signaller.announce({ status: 'offline' });
    ```

  **/
  signaller.announce = function(data, sender) {
    clearTimeout(announceTimer);

    // update internal attributes
    extend(attributes, data, { id: signaller.id });

    // if we are already connected, then ensure we announce on
    // reconnect
    if (connected) {
      // always announce on reconnect
      signaller.removeListener('connected', announceOnReconnect);
      signaller.on('connected', announceOnReconnect);
    }

    // send the attributes over the network
    return announceTimer = setTimeout(function() {
      if (! connected) {
        return signaller.once('connected', function() {
          (sender || send)('/announce', attributes);
        });
      }

      (sender || send)('/announce', attributes);
    }, (opts || {}).announceDelay || 10);
  };

  /**
    ### isMaster(targetId)

    A simple function that indicates whether the local signaller is the master
    for it's relationship with peer signaller indicated by `targetId`.  Roles
    are determined at the point at which signalling peers discover each other,
    and are simply worked out by whichever peer has the lowest signaller id
    when lexigraphically sorted.

    For example, if we have two signaller peers that have discovered each
    others with the following ids:

    - `b11f4fd0-feb5-447c-80c8-c51d8c3cced2`
    - `8a07f82e-49a5-4b9b-a02e-43d911382be6`

    They would be assigned roles:

    - `b11f4fd0-feb5-447c-80c8-c51d8c3cced2`
    - `8a07f82e-49a5-4b9b-a02e-43d911382be6` (master)

  **/
  signaller.isMaster = function(targetId) {
    var peer = peers.get(targetId);

    return peer && peer.roleIdx !== 0;
  };

  /**
    ### leave()

    Tell the signalling server we are leaving.  Calling this function is
    usually not required though as the signalling server should issue correct
    `/leave` messages when it detects a disconnect event.

  **/
  signaller.leave = signaller.close = function() {
    // send the leave signal
    send('/leave', { id: id });

    // stop announcing on reconnect
    signaller.removeListener('connected', announceOnReconnect);

    // call the close method
    if (typeof close == 'function') {
      close.call(messenger);
    }
  };

  /**
    ### metadata(data?)

    Get (pass no data) or set the metadata that is passed through with each
    request sent by the signaller.

    __NOTE:__ Regardless of what is passed to this function, metadata
    generated by the signaller will **always** include the id of the signaller
    and this cannot be modified.
  **/
  signaller.metadata = function(data) {
    if (arguments.length === 0) {
      return extend({}, localMeta);
    }

    localMeta = extend({}, data);
  };

  /**
    ### to(targetId)

    Use the `to` function to send a message to the specified target peer.
    A large parge of negotiating a WebRTC peer connection involves direct
    communication between two parties which must be done by the signalling
    server.  The `to` function provides a simple way to provide a logical
    communication channel between the two parties:

    ```js
    var send = signaller.to('e95fa05b-9062-45c6-bfa2-5055bf6625f4').send;

    // create an offer on a local peer connection
    pc.createOffer(
      function(desc) {
        // set the local description using the offer sdp
        // if this occurs successfully send this to our peer
        pc.setLocalDescription(
          desc,
          function() {
            send('/sdp', desc);
          },
          handleFail
        );
      },
      handleFail
    );
    ```

  **/
  signaller.to = function(targetId) {
    // create a sender that will prepend messages with /to|targetId|
    var sender = function() {
      // get the peer (yes when send is called to make sure it hasn't left)
      var peer = signaller.peers.get(targetId);
      var args;

      if (! peer) {
        throw new Error('Unknown peer: ' + targetId);
      }

      // if the peer is inactive, then abort
      if (peer.inactive) {
        return;
      }

      args = [
        '/to',
        targetId
      ].concat([].slice.call(arguments));

      // inject metadata
      args.splice(3, 0, createMetadata());

      setTimeout(function() {
        var msg = createDataLine(args);
        debug('TX (' + targetId + '): ' + msg);

        write.call(messenger, msg);
      }, 0);
    };

    return {
      announce: function(data) {
        return signaller.announce(data, sender);
      },

      send: sender,
    }
  };

  // remove max listeners from the emitter
  signaller.setMaxListeners(0);

  // initialise opts defaults
  opts = defaults({}, opts, require('./defaults'));

  // set the autoreply flag
  signaller.autoreply = autoreply === undefined || autoreply;

  // if the messenger is a string, then we are going to attach to a
  // ws endpoint and automatically set up primus
  if (typeof messenger == 'string' || (messenger instanceof String)) {
    connectToHost(messenger);
  }
  // otherwise, initialise the connection
  else {
    init();
  }

  // connect an instance of the messenger to the signaller
  signaller._messenger = messenger;

  // expose the process as a process function
  signaller.process = processor;

  return signaller;
};

},{"./defaults":15,"./processor":22,"./uuid":23,"cog/defaults":5,"cog/extend":6,"cog/getable":7,"cog/logger":9,"cog/throttle":10,"eventemitter3":20,"rtc-core/detect":11}],20:[function(require,module,exports){
'use strict';

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = {};
}

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  return Array.apply(this, this._events[event] || []);
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , length = listeners.length
    , len = arguments.length
    , fn = listeners[0]
    , args
    , i;

  if (1 === length) {
    if (fn.__EE3_once) this.removeListener(event, fn);

    switch (len) {
      case 1:
        fn.call(fn.__EE3_context || this);
      break;
      case 2:
        fn.call(fn.__EE3_context || this, a1);
      break;
      case 3:
        fn.call(fn.__EE3_context || this, a1, a2);
      break;
      case 4:
        fn.call(fn.__EE3_context || this, a1, a2, a3);
      break;
      case 5:
        fn.call(fn.__EE3_context || this, a1, a2, a3, a4);
      break;
      case 6:
        fn.call(fn.__EE3_context || this, a1, a2, a3, a4, a5);
      break;

      default:
        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        fn.apply(fn.__EE3_context || this, args);
    }
  } else {
    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    for (i = 0; i < length; fn = listeners[++i]) {
      if (fn.__EE3_once) this.removeListener(event, fn);
      fn.apply(fn.__EE3_context || this, args);
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = [];

  fn.__EE3_context = context;
  this._events[event].push(fn);

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  fn.__EE3_once = true;
  return this.on(event, fn, context);
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  for (var i = 0, length = listeners.length; i < length; i++) {
    if (fn && listeners[i] !== fn) {
      events.push(listeners[i]);
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) this._events[event] = events;
  else this._events[event] = null;

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) this._events[event] = null;
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

try { module.exports = EventEmitter; }
catch (e) {}

},{}],21:[function(require,module,exports){
/* jshint node: true */
/* global document, location, Primus: false */
'use strict';

var reTrailingSlash = /\/$/;

/**
  ### loadPrimus(signalhost, callback)

  This is a convenience function that is patched into the signaller to assist
  with loading the `primus.js` client library from an `rtc-switchboard`
  signaling server.

**/
module.exports = function(signalhost, callback) {
  var anchor = document.createElement('a');
  var script;
  var baseUrl;
  var scriptSrc;

  // if the signalhost is a function, we are in single arg calling mode
  if (typeof signalhost == 'function') {
    callback = signalhost;
    signalhost = location.origin;
  }

  // initialise the anchor with the signalhost
  anchor.href = signalhost;

  // read the base path
  baseUrl = signalhost.replace(reTrailingSlash, '');
  scriptSrc = baseUrl + '/rtc.io/primus.js';

  // look for the script first
  script = document.querySelector('script[src="' + scriptSrc + '"]');

  // if we found, the script trigger the callback immediately
  if (script && typeof Primus != 'undefined') {
    return callback(null, Primus);
  }
  // otherwise, if the script exists but Primus is not loaded,
  // then wait for the load
  else if (script) {
    script.addEventListener('load', function() {
      callback(null, Primus);
    });

    return;
  }

  // otherwise create the script and load primus
  script = document.createElement('script');
  script.src = scriptSrc;

  script.onerror = callback;
  script.addEventListener('load', function() {
    // if we have a signalhost that is not basepathed at /
    // then tweak the primus prototype
    if (anchor.pathname !== '/') {
      Primus.prototype.pathname = anchor.pathname.replace(reTrailingSlash, '') +
        Primus.prototype.pathname;
    }

    callback(null, Primus);
  });

  document.body.appendChild(script);
};

},{}],22:[function(require,module,exports){
/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-signaller');
var jsonparse = require('cog/jsonparse');

/**
  ### signaller process handling

  When a signaller's underling messenger emits a `data` event this is
  delegated to a simple message parser, which applies the following simple
  logic:

  - Is the message a `/to` message. If so, see if the message is for this
    signaller (checking the target id - 2nd arg).  If so pass the
    remainder of the message onto the standard processing chain.  If not,
    discard the message.

  - Is the message a command message (prefixed with a forward slash). If so,
    look for an appropriate message handler and pass the message payload on
    to it.

  - Finally, does the message match any patterns that we are listening for?
    If so, then pass the entire message contents onto the registered handler.
**/
module.exports = function(signaller, opts) {
  var handlers = require('./handlers')(signaller, opts);

  function sendEvent(parts, srcState, data) {
    // initialise the event name
    var evtName = parts[0].slice(1);

    // convert any valid json objects to json
    var args = parts.slice(2).map(jsonparse);

    signaller.emit.apply(
      signaller,
      [evtName].concat(args).concat([srcState, data])
    );
  }

  return function(originalData) {
    var data = originalData;
    var isMatch = true;
    var parts;
    var handler;
    var srcData;
    var srcState;
    var isDirectMessage = false;

    // force the id into string format so we can run length and comparison tests on it
    var id = signaller.id + '';
    debug('signaller ' + id + ' received data: ' + originalData);

    // process /to messages
    if (data.slice(0, 3) === '/to') {
      isMatch = data.slice(4, id.length + 4) === id;
      if (isMatch) {
        parts = data.slice(5 + id.length).split('|').map(jsonparse);

        // get the source data
        isDirectMessage = true;

        // extract the vector clock and update the parts
        parts = parts.map(jsonparse);
      }
    }

    // if this is not a match, then bail
    if (! isMatch) {
      return;
    }

    // chop the data into parts
    parts = parts || data.split('|').map(jsonparse);

    // if we have a specific handler for the action, then invoke
    if (typeof parts[0] == 'string') {
      // extract the metadata from the input data
      srcData = parts[1];

      // if we got data from ourself, then this is pretty dumb
      // but if we have then throw it away
      if (srcData && srcData.id === signaller.id) {
        return console.warn('got data from ourself, discarding');
      }

      // get the source state
      srcState = signaller.peers.get(srcData && srcData.id) || srcData;

      // handle commands
      if (parts[0].charAt(0) === '/') {
        // look for a handler for the message type
        handler = handlers[parts[0].slice(1)];

        if (typeof handler == 'function') {
          handler(
            parts.slice(2),
            parts[0].slice(1),
            srcData,
            srcState,
            isDirectMessage
          );
        }
        else {
          sendEvent(parts, srcState, originalData);
        }
      }
      // otherwise, emit data
      else {
        signaller.emit(
          'data',
          parts.slice(0, 1).concat(parts.slice(2)),
          srcData,
          srcState,
          isDirectMessage
        );
      }
    }
  };
};

},{"./handlers":17,"cog/jsonparse":8,"cog/logger":9}],23:[function(require,module,exports){
// LeverOne's awesome uuid generator
module.exports = function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b};

},{}],24:[function(require,module,exports){
/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc/cleanup');

var CANNOT_CLOSE_STATES = [
  'closed'
];

var EVENTNAMES = [
  'addstream',
  'datachannel',
  'icecandidate',
  'iceconnectionstatechange',
  'negotiationneeded',
  'removestream',
  'signalingstatechange'
];

/**
  ### rtc-tools/cleanup

  ```
  cleanup(pc)
  ```

  The `cleanup` function is used to ensure that a peer connection is properly
  closed and ready to be cleaned up by the browser.

**/
module.exports = function(pc) {
  // see if we can close the connection
  var currentState = pc.iceConnectionState;
  var canClose = CANNOT_CLOSE_STATES.indexOf(currentState) < 0;

  if (canClose) {
    debug('attempting connection close, current state: '+ pc.iceConnectionState);
    pc.close();
  }

  // remove the event listeners
  // after a short delay giving the connection time to trigger
  // close and iceconnectionstatechange events
  setTimeout(function() {
    EVENTNAMES.forEach(function(evtName) {
      if (pc['on' + evtName]) {
        pc['on' + evtName] = null;
      }
    });
  }, 100);
};

},{"cog/logger":9}],25:[function(require,module,exports){
/* jshint node: true */
'use strict';

var async = require('async');
var cleanup = require('./cleanup');
var monitor = require('./monitor');
var detect = require('./detect');
var findPlugin = require('rtc-core/plugin');
var CLOSED_STATES = [ 'closed', 'failed' ];

// track the various supported CreateOffer / CreateAnswer contraints
// that we recognize and allow
var OFFER_ANSWER_CONSTRAINTS = [
  'offerToReceiveVideo',
  'offerToReceiveAudio',
  'voiceActivityDetection',
  'iceRestart'
];

/**
  ### rtc-tools/couple

  #### couple(pc, targetId, signaller, opts?)

  Couple a WebRTC connection with another webrtc connection identified by
  `targetId` via the signaller.

  The following options can be provided in the `opts` argument:

  - `sdpfilter` (default: null)

    A simple function for filtering SDP as part of the peer
    connection handshake (see the Using Filters details below).

  ##### Example Usage

  ```js
  var couple = require('rtc/couple');

  couple(pc, '54879965-ce43-426e-a8ef-09ac1e39a16d', signaller);
  ```

  ##### Using Filters

  In certain instances you may wish to modify the raw SDP that is provided
  by the `createOffer` and `createAnswer` calls.  This can be done by passing
  a `sdpfilter` function (or array) in the options.  For example:

  ```js
  // run the sdp from through a local tweakSdp function.
  couple(pc, '54879965-ce43-426e-a8ef-09ac1e39a16d', signaller, {
    sdpfilter: tweakSdp
  });
  ```

**/
function couple(pc, targetId, signaller, opts) {
  var debugLabel = (opts || {}).debugLabel || 'rtc';
  var debug = require('cog/logger')(debugLabel + '/couple');

  // create a monitor for the connection
  var mon = monitor(pc, targetId, signaller, opts);
  var queuedCandidates = [];
  var sdpFilter = (opts || {}).sdpfilter;
  var reactive = (opts || {}).reactive;
  var offerTimeout;
  var endOfCandidates = true;
  var plugin = findPlugin((opts || {}).plugins);

  // configure the time to wait between receiving a 'disconnect'
  // iceConnectionState and determining that we are closed
  var disconnectTimeout = (opts || {}).disconnectTimeout || 10000;
  var disconnectTimer;

  // if the signaller does not support this isMaster function throw an
  // exception
  if (typeof signaller.isMaster != 'function') {
    throw new Error('rtc-signaller instance >= 0.14.0 required');
  }

  // initilaise the negotiation helpers
  var isMaster = signaller.isMaster(targetId);

  var createOffer = prepNegotiate(
    'createOffer',
    isMaster,
    [ checkStable ]
  );

  var createAnswer = prepNegotiate(
    'createAnswer',
    true,
    []
  );

  // initialise the processing queue (one at a time please)
  var q = async.queue(function(task, cb) {
    // if the task has no operation, then trigger the callback immediately
    if (typeof task.op != 'function') {
      return cb();
    }

    // process the task operation
    task.op(task, cb);
  }, 1);

  // initialise session description and icecandidate objects
  var RTCSessionDescription = (opts || {}).RTCSessionDescription ||
    detect('RTCSessionDescription');

  var RTCIceCandidate = (opts || {}).RTCIceCandidate ||
    detect('RTCIceCandidate');

  function abort(stage, sdp, cb) {
    return function(err) {
      // log the error
      console.error('rtc/couple error (' + stage + '): ', err);

      if (typeof cb == 'function') {
        cb(err);
      }
    };
  }

  function applyCandidatesWhenStable() {
    if (pc.signalingState == 'stable' && pc.remoteDescription) {
      debug('signaling state = stable, applying queued candidates');
      mon.removeListener('change', applyCandidatesWhenStable);

      // apply any queued candidates
      queuedCandidates.splice(0).forEach(function(data) {
        debug('applying queued candidate', data);

        try {
          pc.addIceCandidate(createIceCandidate(data));
        }
        catch (e) {
          debug('invalidate candidate specified: ', data);
        }
      });
    }
  }

  function checkNotConnecting(negotiate) {
    if (pc.iceConnectionState != 'checking') {
      return true;
    }

    debug('connection state is checking, will wait to create a new offer');
    mon.once('connected', function() {
      q.push({ op: negotiate });
    });

    return false;
  }

  function checkStable(negotiate) {
    if (pc.signalingState === 'stable') {
      return true;
    }

    debug('cannot create offer, signaling state != stable, will retry');
    mon.on('change', function waitForStable() {
      if (pc.signalingState === 'stable') {
        q.push({ op: negotiate });
      }

      mon.removeListener('change', waitForStable);
    });

    return false;
  }

  function createIceCandidate(data) {
    if (plugin && typeof plugin.createIceCandidate == 'function') {
      return plugin.createIceCandidate(data);
    }

    return new RTCIceCandidate(data);
  }

  function createSessionDescription(data) {
    if (plugin && typeof plugin.createSessionDescription == 'function') {
      return plugin.createSessionDescription(data);
    }

    return new RTCSessionDescription(data);
  }

  function decouple() {
    debug('decoupling ' + signaller.id + ' from ' + targetId);

    // stop the monitor
    mon.removeAllListeners();
    mon.stop();

    // cleanup the peerconnection
    cleanup(pc);

    // remove listeners
    signaller.removeListener('sdp', handleSdp);
    signaller.removeListener('candidate', handleRemoteCandidate);
    signaller.removeListener('negotiate', handleNegotiateRequest);
  }

  function generateConstraints(methodName) {
    var constraints = {};

    function reformatConstraints() {
      var tweaked = {};

      Object.keys(constraints).forEach(function(param) {
        var sentencedCased = param.charAt(0).toUpperCase() + param.substr(1);
        tweaked[sentencedCased] = constraints[param];
      });

      // update the constraints to match the expected format
      constraints = {
        mandatory: tweaked
      };
    }

    // TODO: customize behaviour based on offer vs answer

    // pull out any valid
    OFFER_ANSWER_CONSTRAINTS.forEach(function(param) {
      var sentencedCased = param.charAt(0).toUpperCase() + param.substr(1);

      // if we have no opts, do nothing
      if (! opts) {
        return;
      }
      // if the parameter has been defined, then add it to the constraints
      else if (opts[param] !== undefined) {
        constraints[param] = opts[param];
      }
      // if the sentenced cased version has been added, then use that
      else if (opts[sentencedCased] !== undefined) {
        constraints[param] = opts[sentencedCased];
      }
    });

    // TODO: only do this for the older browsers that require it
    reformatConstraints();

    return constraints;
  }

  function prepNegotiate(methodName, allowed, preflightChecks) {
    var constraints = generateConstraints(methodName);

    // ensure we have a valid preflightChecks array
    preflightChecks = [].concat(preflightChecks || []);

    return function negotiate(task, cb) {
      var checksOK = true;

      // if the task is not allowed, then send a negotiate request to our
      // peer
      if (! allowed) {
        signaller.to(targetId).send('/negotiate');
        return cb();
      }

      // if the connection is closed, then abort
      if (isClosed()) {
        return cb(new Error('connection closed, cannot negotiate'));
      }

      // run the preflight checks
      preflightChecks.forEach(function(check) {
        checksOK = checksOK && check(negotiate);
      });

      // if the checks have not passed, then abort for the moment
      if (! checksOK) {
        debug('preflight checks did not pass, aborting ' + methodName);
        return cb();
      }

      // create the offer
      debug('calling ' + methodName);
      // debug('gathering state = ' + pc.iceGatheringState);
      // debug('connection state = ' + pc.iceConnectionState);
      // debug('signaling state = ' + pc.signalingState);

      pc[methodName](
        function(desc) {

          // if a filter has been specified, then apply the filter
          if (typeof sdpFilter == 'function') {
            desc.sdp = sdpFilter(desc.sdp, pc, methodName);
          }

          q.push({ op: queueLocalDesc(desc) });
          cb();
        },

        // on error, abort
        abort(methodName, '', cb),

        // include the appropriate constraints
        constraints
      );
    };
  }

  function handleConnectionClose() {
    debug('captured pc close, iceConnectionState = ' + pc.iceConnectionState);
    decouple();
  }

  function handleDisconnect() {
    debug('captured pc disconnect, monitoring connection status');

    // start the disconnect timer
    disconnectTimer = setTimeout(function() {
      debug('manually closing connection after disconnect timeout');
      pc.close();
    }, disconnectTimeout);

    mon.on('change', handleDisconnectAbort);
  }

  function handleDisconnectAbort() {
    debug('connection state changed to: ' + pc.iceConnectionState);
    resetDisconnectTimer();

    // if we have a closed or failed status, then close the connection
    if (CLOSED_STATES.indexOf(pc.iceConnectionState) >= 0) {
      return mon.emit('closed');
    }

    mon.once('disconnect', handleDisconnect);
  };

  function handleLocalCandidate(evt) {
    if (evt.candidate) {
      resetDisconnectTimer();

      signaller.to(targetId).send('/candidate', evt.candidate);
      endOfCandidates = false;
    }
    else if (! endOfCandidates) {
      endOfCandidates = true;
      debug('ice gathering state complete');
      signaller.to(targetId).send('/endofcandidates', {});
    }
  }

  function handleNegotiateRequest(src) {
    if (src.id === targetId) {
      debug('got negotiate request from ' + targetId + ', creating offer');
      q.push({ op: createOffer });
    }
  }

  function handleRemoteCandidate(data, src) {
    if ((! src) || (src.id !== targetId)) {
      return;
    }

    // queue candidates while the signaling state is not stable
    if (pc.signalingState != 'stable' || (! pc.remoteDescription)) {
      debug('queuing candidate');
      queuedCandidates.push(data);

      mon.removeListener('change', applyCandidatesWhenStable);
      mon.on('change', applyCandidatesWhenStable);
      return;
    }

    try {
      pc.addIceCandidate(createIceCandidate(data));
    }
    catch (e) {
      debug('invalidate candidate specified: ', data);
    }
  }

  function handleSdp(data, src) {
    var abortType = data.type === 'offer' ? 'createAnswer' : 'createOffer';

    // if the source is unknown or not a match, then abort
    if ((! src) || (src.id !== targetId)) {
      return debug('received sdp but dropping due to unmatched src');
    }

    // prioritize setting the remote description operation
    q.push({ op: function(task, cb) {
      if (isClosed()) {
        return cb(new Error('pc closed: cannot set remote description'));
      }

      // update the remote description
      // once successful, send the answer
      debug('setting remote description');
      pc.setRemoteDescription(
        createSessionDescription(data),
        function() {
          // create the answer
          if (data.type === 'offer') {
            queue(createAnswer)();
          }

          // trigger the callback
          cb();
        },

        abort(abortType, data.sdp, cb)
      );
    }});
  }

  function isClosed() {
    return CLOSED_STATES.indexOf(pc.iceConnectionState) >= 0;
  }

  function queue(negotiateTask) {
    return function() {
      q.push([
        { op: negotiateTask }
      ]);
    };
  }

  function queueLocalDesc(desc) {
    return function setLocalDesc(task, cb) {
      if (isClosed()) {
        return cb(new Error('connection closed, aborting'));
      }

      // initialise the local description
      debug('setting local description');
      pc.setLocalDescription(
        desc,

        // if successful, then send the sdp over the wire
        function() {
          // send the sdp
          signaller.to(targetId).send('/sdp', desc);

          // callback
          cb();
        },

        // abort('setLocalDesc', desc.sdp, cb)
        // on error, abort
        function(err) {
          debug('error setting local description', err);
          debug(desc.sdp);
          // setTimeout(function() {
          //   setLocalDesc(task, cb, (retryCount || 0) + 1);
          // }, 500);

          cb(err);
        }
      );
    };
  }

  function resetDisconnectTimer() {
    mon.removeListener('change', handleDisconnectAbort);

    // clear the disconnect timer
    debug('reset disconnect timer, state: ' + pc.iceConnectionState);
    clearTimeout(disconnectTimer);
  }

  // when regotiation is needed look for the peer
  if (reactive) {
    pc.onnegotiationneeded = function() {
      debug('renegotiation required, will create offer in 50ms');
      clearTimeout(offerTimeout);
      offerTimeout = setTimeout(queue(createOffer), 50);
    };
  }

  pc.onicecandidate = handleLocalCandidate;

  // when we receive sdp, then
  signaller.on('sdp', handleSdp);
  signaller.on('candidate', handleRemoteCandidate);

  // if this is a master connection, listen for negotiate events
  if (isMaster) {
    signaller.on('negotiate', handleNegotiateRequest);
  }

  // when the connection closes, remove event handlers
  mon.once('closed', handleConnectionClose);
  mon.once('disconnected', handleDisconnect);

  // patch in the create offer functions
  mon.createOffer = queue(createOffer);

  return mon;
}

module.exports = couple;

},{"./cleanup":24,"./detect":26,"./monitor":29,"async":30,"cog/logger":9,"rtc-core/plugin":13}],26:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ### rtc-tools/detect

  Provide the [rtc-core/detect](https://github.com/rtc-io/rtc-core#detect)
  functionality.
**/
module.exports = require('rtc-core/detect');

},{"rtc-core/detect":11}],27:[function(require,module,exports){
/* jshint node: true */
'use strict';

var debug = require('cog/logger')('generators');
var detect = require('./detect');
var defaults = require('cog/defaults');

var mappings = {
  create: {
    dtls: function(c) {
      if (! detect.moz) {
        c.optional = (c.optional || []).concat({ DtlsSrtpKeyAgreement: true });
      }
    }
  }
};

/**
  ### rtc-tools/generators

  The generators package provides some utility methods for generating
  constraint objects and similar constructs.

  ```js
  var generators = require('rtc/generators');
  ```

**/

/**
  #### generators.config(config)

  Generate a configuration object suitable for passing into an W3C
  RTCPeerConnection constructor first argument, based on our custom config.
**/
exports.config = function(config) {
  return defaults(config, {
    iceServers: []
  });
};

/**
  #### generators.connectionConstraints(flags, constraints)

  This is a helper function that will generate appropriate connection
  constraints for a new `RTCPeerConnection` object which is constructed
  in the following way:

  ```js
  var conn = new RTCPeerConnection(flags, constraints);
  ```

  In most cases the constraints object can be left empty, but when creating
  data channels some additional options are required.  This function
  can generate those additional options and intelligently combine any
  user defined constraints (in `constraints`) with shorthand flags that
  might be passed while using the `rtc.createConnection` helper.
**/
exports.connectionConstraints = function(flags, constraints) {
  var generated = {};
  var m = mappings.create;
  var out;

  // iterate through the flags and apply the create mappings
  Object.keys(flags || {}).forEach(function(key) {
    if (m[key]) {
      m[key](generated);
    }
  });

  // generate the connection constraints
  out = defaults({}, constraints, generated);
  debug('generated connection constraints: ', out);

  return out;
};

},{"./detect":26,"cog/defaults":5,"cog/logger":9}],28:[function(require,module,exports){
/* jshint node: true */

'use strict';

/**
  # rtc-tools

  The `rtc-tools` module does most of the heavy lifting within the
  [rtc.io](http://rtc.io) suite.  Primarily it handles the logic of coupling
  a local `RTCPeerConnection` with it's remote counterpart via an
  [rtc-signaller](https://github.com/rtc-io/rtc-signaller) signalling
  channel.

  ## Getting Started

  If you decide that the `rtc-tools` module is a better fit for you than either
  [rtc-quickconnect](https://github.com/rtc-io/rtc-quickconnect) or
  [rtc-glue](https://github.com/rtc-io/rtc-glue) then the code snippet below
  will provide you a guide on how to get started using it in conjunction with
  the [rtc-signaller](https://github.com/rtc-io/rtc-signaller) and
  [rtc-media](https://github.com/rtc-io/rtc-media) modules:

  <<< examples/getting-started.js

  This code definitely doesn't cover all the cases that you need to consider
  (i.e. peers leaving, etc) but it should demonstrate how to:

  1. Capture video and add it to a peer connection
  2. Couple a local peer connection with a remote peer connection
  3. Deal with the remote steam being discovered and how to render
     that to the local interface.

  ## Reference

**/

var gen = require('./generators');

// export detect
var detect = exports.detect = require('./detect');
var findPlugin = require('rtc-core/plugin');

// export cog logger for convenience
exports.logger = require('cog/logger');

// export peer connection
var RTCPeerConnection =
exports.RTCPeerConnection = detect('RTCPeerConnection');

// add the couple utility
exports.couple = require('./couple');

/**
  ### createConnection

  ```
  createConnection(opts?, constraints?) => RTCPeerConnection
  ```

  Create a new `RTCPeerConnection` auto generating default opts as required.

  ```js
  var conn;

  // this is ok
  conn = rtc.createConnection();

  // and so is this
  conn = rtc.createConnection({
    iceServers: []
  });
  ```
**/
exports.createConnection = function(opts, constraints) {
  var plugin = findPlugin((opts || {}).plugins);
  var normalize = (plugin ? plugin.normalizeIce : null) || require('normalice');

  // generate the config based on options provided
  var config = gen.config(opts);

  // generate appropriate connection constraints
  var constraints = gen.connectionConstraints(opts, constraints);

  // ensure we have valid iceServers
  config.iceServers = (config.iceServers || []).map(normalize);

  if (plugin && typeof plugin.createConnection == 'function') {
    return plugin.createConnection(config, constraints);
  }
  else {
    return new ((opts || {}).RTCPeerConnection || RTCPeerConnection)(
      config, constraints
    );
  }
};

},{"./couple":25,"./detect":26,"./generators":27,"cog/logger":9,"normalice":32,"rtc-core/plugin":13}],29:[function(require,module,exports){
/* jshint node: true */
'use strict';

var EventEmitter = require('eventemitter3');

// define some state mappings to simplify the events we generate
var stateMappings = {
  completed: 'connected'
};

// define the events that we need to watch for peer connection
// state changes
var peerStateEvents = [
  'signalingstatechange',
  'iceconnectionstatechange',
];

/**
  ### rtc-tools/monitor

  ```
  monitor(pc, targetId, signaller, opts?) => EventEmitter
  ```

  The monitor is a useful tool for determining the state of `pc` (an
  `RTCPeerConnection`) instance in the context of your application. The
  monitor uses both the `iceConnectionState` information of the peer
  connection and also the various
  [signaller events](https://github.com/rtc-io/rtc-signaller#signaller-events)
  to determine when the connection has been `connected` and when it has
  been `disconnected`.

  A monitor created `EventEmitter` is returned as the result of a
  [couple](https://github.com/rtc-io/rtc#rtccouple) between a local peer
  connection and it's remote counterpart.

**/
module.exports = function(pc, targetId, signaller, opts) {
  var debugLabel = (opts || {}).debugLabel || 'rtc';
  var debug = require('cog/logger')(debugLabel + '/monitor');
  var monitor = new EventEmitter();
  var state;

  function checkState() {
    var newState = getMappedState(pc.iceConnectionState);
    debug('state changed: ' + pc.iceConnectionState + ', mapped: ' + newState);

    // flag the we had a state change
    monitor.emit('change', pc);

    // if the active state has changed, then send the appopriate message
    if (state !== newState) {
      monitor.emit(newState);
      state = newState;
    }
  }

  function handlePeerLeave(peerId) {
    debug('captured peer leave for peer: ' + peerId);

    // if the peer leaving is not the peer we are connected to
    // then we aren't interested
    if (peerId !== targetId) {
      return;
    }

    // trigger a closed event
    monitor.emit('closed');
  }

  pc.onclose = monitor.emit.bind(monitor, 'closed');
  peerStateEvents.forEach(function(evtName) {
    pc['on' + evtName] = checkState;
  });

  monitor.stop = function() {
    pc.onclose = null;
    peerStateEvents.forEach(function(evtName) {
      pc['on' + evtName] = null;
    });

    // remove the peer:leave listener
    if (signaller && typeof signaller.removeListener == 'function') {
      signaller.removeListener('peer:leave', handlePeerLeave);
    }
  };

  monitor.checkState = checkState;

  // if we haven't been provided a valid peer connection, abort
  if (! pc) {
    return monitor;
  }

  // determine the initial is active state
  state = getMappedState(pc.iceConnectionState);

  // if we've been provided a signaller, then watch for peer:leave events
  if (signaller && typeof signaller.on == 'function') {
    signaller.on('peer:leave', handlePeerLeave);
  }

  // if we are active, trigger the connected state
  // setTimeout(monitor.emit.bind(monitor, state), 0);

  return monitor;
};

/* internal helpers */

function getMappedState(state) {
  return stateMappings[state] || state;
}

},{"cog/logger":9,"eventemitter3":31}],30:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
                q.process();
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                q.process();
            }
        };
        return q;
    };
    
    async.priorityQueue = function (worker, concurrency) {
        
        function _compareTasks(a, b){
          return a.priority - b.priority;
        };
        
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }
        
        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };
              
              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }
        
        // Start with a normal queue
        var q = async.queue(worker, concurrency);
        
        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };
        
        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require("Zbi7gb"))
},{"Zbi7gb":2}],31:[function(require,module,exports){
module.exports=require(20)
},{}],32:[function(require,module,exports){
/**
  # normalice

  Normalize an ice server configuration object (or plain old string) into a format
  that is usable in all browsers supporting WebRTC.  Primarily this module is designed
  to help with the transition of the `url` attribute of the configuration object to
  the `urls` attribute.

  ## Example Usage

  <<< examples/simple.js

**/

var protocols = [
  'stun:',
  'turn:'
];

module.exports = function(input) {
  var url = (input || {}).url || input;
  var protocol;
  var parts;
  var output = {};

  // if we don't have a string url, then allow the input to passthrough
  if (typeof url != 'string' && (! (url instanceof String))) {
    return input;
  }

  // trim the url string, and convert to an array
  url = url.trim();

  // if the protocol is not known, then passthrough
  protocol = protocols[protocols.indexOf(url.slice(0, 5))];
  if (! protocol) {
    return input;
  }

  // now let's attack the remaining url parts
  url = url.slice(5);
  parts = url.split('@');

  output.username = input.username;
  output.credential = input.credential;
  // if we have an authentication part, then set the credentials
  if (parts.length > 1) {
    url = parts[1];
    parts = parts[0].split(':');

    // add the output credential and username
    output.username = parts[0];
    output.credential = (input || {}).credential || parts[1] || '';
  }

  output.url = protocol + url;
  output.urls = [ output.url ];

  return output;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxkZXZcXHBvbmRcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiYzovZGV2L3BvbmQvaW5kZXguanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiYzovZGV2L3BvbmQvbm9kZV9tb2R1bGVzL2d1bWhlbHBlci9ndW1oZWxwZXIuanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvcnRjLXF1aWNrY29ubmVjdC9pbmRleC5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9jb2cvZGVmYXVsdHMuanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvcnRjLXF1aWNrY29ubmVjdC9ub2RlX21vZHVsZXMvY29nL2V4dGVuZC5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9jb2cvZ2V0YWJsZS5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9jb2cvanNvbnBhcnNlLmpzIiwiYzovZGV2L3BvbmQvbm9kZV9tb2R1bGVzL3J0Yy1xdWlja2Nvbm5lY3Qvbm9kZV9tb2R1bGVzL2NvZy9sb2dnZXIuanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvcnRjLXF1aWNrY29ubmVjdC9ub2RlX21vZHVsZXMvY29nL3Rocm90dGxlLmpzIiwiYzovZGV2L3BvbmQvbm9kZV9tb2R1bGVzL3J0Yy1xdWlja2Nvbm5lY3Qvbm9kZV9tb2R1bGVzL3J0Yy1jb3JlL2RldGVjdC5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtY29yZS9ub2RlX21vZHVsZXMvZGV0ZWN0LWJyb3dzZXIvYnJvd3Nlci5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtY29yZS9wbHVnaW4uanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvcnRjLXF1aWNrY29ubmVjdC9ub2RlX21vZHVsZXMvcnRjLXNpZ25hbGxlci9icm93c2VyLmpzIiwiYzovZGV2L3BvbmQvbm9kZV9tb2R1bGVzL3J0Yy1xdWlja2Nvbm5lY3Qvbm9kZV9tb2R1bGVzL3J0Yy1zaWduYWxsZXIvZGVmYXVsdHMuanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvcnRjLXF1aWNrY29ubmVjdC9ub2RlX21vZHVsZXMvcnRjLXNpZ25hbGxlci9oYW5kbGVycy9hbm5vdW5jZS5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtc2lnbmFsbGVyL2hhbmRsZXJzL2luZGV4LmpzIiwiYzovZGV2L3BvbmQvbm9kZV9tb2R1bGVzL3J0Yy1xdWlja2Nvbm5lY3Qvbm9kZV9tb2R1bGVzL3J0Yy1zaWduYWxsZXIvaGFuZGxlcnMvbGVhdmUuanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvcnRjLXF1aWNrY29ubmVjdC9ub2RlX21vZHVsZXMvcnRjLXNpZ25hbGxlci9pbmRleC5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtc2lnbmFsbGVyL25vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwiYzovZGV2L3BvbmQvbm9kZV9tb2R1bGVzL3J0Yy1xdWlja2Nvbm5lY3Qvbm9kZV9tb2R1bGVzL3J0Yy1zaWduYWxsZXIvcHJpbXVzLWxvYWRlci5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtc2lnbmFsbGVyL3Byb2Nlc3Nvci5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtc2lnbmFsbGVyL3V1aWQuanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvcnRjLXF1aWNrY29ubmVjdC9ub2RlX21vZHVsZXMvcnRjLXRvb2xzL2NsZWFudXAuanMiLCJjOi9kZXYvcG9uZC9ub2RlX21vZHVsZXMvcnRjLXF1aWNrY29ubmVjdC9ub2RlX21vZHVsZXMvcnRjLXRvb2xzL2NvdXBsZS5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtdG9vbHMvZGV0ZWN0LmpzIiwiYzovZGV2L3BvbmQvbm9kZV9tb2R1bGVzL3J0Yy1xdWlja2Nvbm5lY3Qvbm9kZV9tb2R1bGVzL3J0Yy10b29scy9nZW5lcmF0b3JzLmpzIiwiYzovZGV2L3BvbmQvbm9kZV9tb2R1bGVzL3J0Yy1xdWlja2Nvbm5lY3Qvbm9kZV9tb2R1bGVzL3J0Yy10b29scy9pbmRleC5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtdG9vbHMvbW9uaXRvci5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtdG9vbHMvbm9kZV9tb2R1bGVzL2FzeW5jL2xpYi9hc3luYy5qcyIsImM6L2Rldi9wb25kL25vZGVfbW9kdWxlcy9ydGMtcXVpY2tjb25uZWN0L25vZGVfbW9kdWxlcy9ydGMtdG9vbHMvbm9kZV9tb2R1bGVzL25vcm1hbGljZS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvbUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JtQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGd1bSA9IHJlcXVpcmUoJ2d1bWhlbHBlcicpXG52YXIgcXVpY2tjb25uZWN0ID0gcmVxdWlyZSgncnRjLXF1aWNrY29ubmVjdCcpXG5cbnZhciAkbXNnID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21zZycpXG52YXIgJGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucHV0JylcblxuJGlucHV0LmZvY3VzKClcblxuZ3VtLnN0YXJ0VmlkZW9TdHJlYW1pbmcoZnVuY3Rpb24gKGVyciwgc3RyZWFtLCBlbCkge1xuICBpZiAoZXJyKSB7XG4gICAgJG1zZy50ZXh0Q29udGVudCA9IGVyclxuICAgIHJldHVyblxuICB9XG4gIGVsLmlkID0gJ3lvdSdcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3lvdWJveCcpLmFwcGVuZENoaWxkKGVsKVxuICBlbC5wbGF5KClcbn0pXG5cblxuXG5mdW5jdGlvbiBzZW5kKHgpIHtcbiAgc2VuZC5fKHgpXG59XG5zZW5kLl8gPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdub29wJylcbn1cblxucXVpY2tjb25uZWN0KCdodHRwOi8vcnRjLmlvL3N3aXRjaGJvYXJkLycsIHtyb29tOiAnamRlbi1wb25kLWFzZGYnfSlcbiAgLmNyZWF0ZURhdGFDaGFubmVsKCdzZWxmaWVzJylcbiAgLm9uKCdjaGFubmVsOm9wZW5lZCcsIGZ1bmN0aW9uIChpZCwgZGMpIHtcbiAgICBpbmNvbWluZygnJylcbiAgICBjb25zb2xlLmxvZygnb3BlbmVkJywgYXJndW1lbnRzKVxuICAgIGRjLm9ubWVzc2FnZSA9IGluY29taW5nXG5cbiAgICBzZW5kLl8gPSBkYy5zZW5kLmJpbmQoZGMpXG4gIH0pXG5cbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RpbGwnKVxudmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuZnVuY3Rpb24gZ2V0U25hcHNob3QoY2IpIHtcbiAgdmFyIHZpZGVvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3lvdScpXG4gIHZhciB4ID0gdmlkZW8ub2Zmc2V0V2lkdGhcbiAgdmFyIHkgPSB2aWRlby5vZmZzZXRIZWlnaHRcbiAgY2FudmFzLndpZHRoID0geFxuICBjYW52YXMuaGVpZ2h0ID0geVxuXG4gIGNvbnNvbGUubG9nKCdnZXRTbmFwc2hvdCcsIHZpZGVvKVxuICBjb250ZXh0LmRyYXdJbWFnZSh2aWRlbywgMCwgMCwgeCwgeSlcbiAgdmFyIGQgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKVxuLy8gY29uc29sZS5sb2coZC5sZW5ndGgsIGQpXG5cbiAgY2IobnVsbCwgZClcbn1cblxudmFyIGNvdW50ID0gMFxuXG5mdW5jdGlvbiBpbmNvbWluZ1BpYyhlKSB7XG4gIC8vIGlmIChjb3VudCkge1xuICAvLyAgIGNvdW50LS1cbiAgLy8gfSBlbHNlIHtcbiAgLy8gICBjb3VudCsrXG4gIC8vIH1cblxuICAvLyB2YXIgdGhlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtJytjb3VudClcbiAgLy8gdGhlbS5zdHlsZS5vcGFjaXR5ID0gMVxuICBcblxuICBjb25zb2xlLmxvZygnaW5jb21pbmcgcGljJylcbiAgLy8gdGhlbS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAndXJsKCcgKyBlLmRhdGEgKyAnKSdcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAndXJsKCcgKyBlLmRhdGEgKyAnKSdcbn1cblxuZnVuY3Rpb24gaW5jb21pbmdNc2coZSkge1xuICBtc2cudGV4dENvbnRlbnQgPSBlLmRhdGFcbn1cblxuZnVuY3Rpb24gaW5jb21pbmcoZSkge1xuICBpZiAoIWUgfHwgIWUuZGF0YSkge1xuICAgIHJldHVyblxuICB9XG4gIGlmIChlLmRhdGEuaW5kZXhPZignZGF0YTppbWFnZS9wbmcnKSA9PT0gMCkge1xuICAgIGluY29taW5nUGljKGUpXG4gIH0gZWxzZSB7XG4gICAgaW5jb21pbmdNc2cgKGUpXG4gIH1cbn1cblxuXG5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gIGlmICghZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3lvdScpKSB7XG4gICAgY29uc29sZS5sb2coJ25vdCB5ZXQnKVxuICAgIHJldHVyblxuICB9XG4gIGdldFNuYXBzaG90KGZ1bmN0aW9uIChlLCBkYXRhKSB7XG4gICAgLy8gaW5jb21pbmdQaWMoe2RhdGE6IGRhdGF9KVxuICAgIHNlbmQoZGF0YSlcbiAgICAvLyBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoJyArIGRhdGEgKyAnKSdcbiAgfSlcbn0sIDEwMDApXG5cbi8vIHZhciB0ID0gW2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtMCcpLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGhlbTEnKV1cbi8vIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbi8vICAgdC5mb3JFYWNoKGZ1bmN0aW9uICh0aGVtKSB7XG4vLyAgICAgdmFyIG9wYWNpdHkgPSBwYXJzZUZsb2F0KHRoZW0uc3R5bGUub3BhY2l0eSlcbi8vICAgICB0aGVtLnN0eWxlLm9wYWNpdHkgPSBNYXRoLm1heCgwLCBvcGFjaXR5IC0gLjEpXG4vLyAgIH0pXG4vLyB9LCA1MClcblxuJGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXByZXNzJywgZnVuY3Rpb24gKGUpIHtcbiAgaWYgKGUuY2hhckNvZGUgIT09IDEzKSB7IC8vIGVudGVyXG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgbXNnID0gJGlucHV0LnZhbHVlXG4gICRpbnB1dC52YWx1ZSA9ICcnXG4gICRpbnB1dC5mb2N1cygpXG5cbiAgc2VuZE1lc3NhZ2UobXNnKVxufSlcblxuJGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdsb3N0IGZvY3VzJylcbiAgJGlucHV0LmZvY3VzKClcbn0pXG5cbmZ1bmN0aW9uIHNlbmRNZXNzYWdlKG1zZykge1xuICAvLyBpbmNvbWluZ01zZyhtc2cpXG4gIHNlbmQobXNnKVxufSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiKGZ1bmN0aW9uICgpIHsgXG4gICAgXG4gICAgLy8gQSBjb3VwbGUgb2Ygc2hpbXMgZm9yIGhhdmluZyBhIGNvbW1vbiBpbnRlcmZhY2VcblxuICAgIHdpbmRvdy5VUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwgfHwgd2luZG93Lm1velVSTCB8fCB3aW5kb3cubXNVUkw7XG5cbiAgICBuYXZpZ2F0b3IuZ2V0TWVkaWEgPSAoIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHxcbiAgICAgICAgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fFxuICAgICAgICBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8XG4gICAgICAgIG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYVxuICAgICk7XG5cbiAgICAvL1xuXG4gICAgdmFyIHZpZGVvO1xuICAgIHZhciBjYW1lcmFTdHJlYW07XG5cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3RzIHBlcm1pc3Npb24gZm9yIHVzaW5nIHRoZSB1c2VyJ3MgY2FtZXJhLFxuICAgICAqIHN0YXJ0cyByZWFkaW5nIHZpZGVvIGZyb20gdGhlIHNlbGVjdGVkIGNhbWVyYSwgYW5kIGNhbGxzXG4gICAgICogYG9rQ2FsbGJhY2tgIHdoZW4gdGhlIHZpZGVvIGRpbWVuc2lvbnMgYXJlIGtub3duICh3aXRoIGEgZmFsbGJhY2tcbiAgICAgKiBmb3Igd2hlbiB0aGUgZGltZW5zaW9ucyBhcmUgbm90IHJlcG9ydGVkIG9uIHRpbWUpLFxuICAgICAqIG9yIGNhbGxzIGBlcnJvckNhbGxiYWNrYCBpZiBzb21ldGhpbmcgZ29lcyB3cm9uZ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHN0YXJ0U3RyZWFtaW5nKGVycm9yQ2FsbGJhY2ssIG9uU3RyZWFtaW5nLCBva0NhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIHZpZGVvRWxlbWVudDtcbiAgICAgICAgdmFyIGNhbWVyYVN0cmVhbTtcbiAgICAgICAgdmFyIGF0dGVtcHRzID0gMDtcbiAgICAgICAgdmFyIHJlYWR5TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCkge1xuXG4gICAgICAgICAgICBmaW5kVmlkZW9TaXplKCk7XG5cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGZpbmRWaWRlb1NpemUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgaWYodmlkZW9FbGVtZW50LnZpZGVvV2lkdGggPiAwICYmIHZpZGVvRWxlbWVudC52aWRlb0hlaWdodCA+IDApIHtcblxuICAgICAgICAgICAgICAgIHZpZGVvRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkZWRkYXRhJywgcmVhZHlMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgb25EaW1lbnNpb25zUmVhZHkodmlkZW9FbGVtZW50LnZpZGVvV2lkdGgsIHZpZGVvRWxlbWVudC52aWRlb0hlaWdodCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBpZihhdHRlbXB0cyA8IDEwKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgYXR0ZW1wdHMrKztcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmaW5kVmlkZW9TaXplLCAyMDApO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBvbkRpbWVuc2lvbnNSZWFkeSg2NDAsIDQ4MCk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuICAgICAgICB2YXIgb25EaW1lbnNpb25zUmVhZHkgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgICAgICBva0NhbGxiYWNrKGNhbWVyYVN0cmVhbSwgdmlkZW9FbGVtZW50LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHZpZGVvRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XG4gICAgICAgIHZpZGVvRWxlbWVudC5hdXRvcGxheSA9IHRydWU7XG5cbiAgICAgICAgdmlkZW9FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRlZGRhdGEnLCByZWFkeUxpc3RlbmVyKTtcblxuICAgICAgICBuYXZpZ2F0b3IuZ2V0TWVkaWEoeyB2aWRlbzogdHJ1ZSB9LCBmdW5jdGlvbiAoc3RyZWFtKSB7XG5cbiAgICAgICAgICAgIG9uU3RyZWFtaW5nKCk7XG5cbiAgICAgICAgICAgIGlmKHZpZGVvRWxlbWVudC5tb3pTcmNPYmplY3QpIHtcbiAgICAgICAgICAgICAgICB2aWRlb0VsZW1lbnQubW96U3JjT2JqZWN0ID0gc3RyZWFtO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2aWRlb0VsZW1lbnQuc3JjID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoc3RyZWFtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FtZXJhU3RyZWFtID0gc3RyZWFtO1xuICAgICAgICAgICAgdmlkZW9FbGVtZW50LnBsYXkoKTtcblxuICAgICAgICB9LCBlcnJvckNhbGxiYWNrKTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRyeSB0byBpbml0aWF0ZSB2aWRlbyBzdHJlYW1pbmcsIGFuZCB0cmFuc3BhcmVudGx5IGhhbmRsZSBjYXNlc1xuICAgICAqIHdoZXJlIHRoYXQgaXMgbm90IHBvc3NpYmxlIChpbmNsdWRlcyAnZGVjZXB0aXZlJyBicm93c2Vycywgc2VlIGlubGluZVxuICAgICAqIGNvbW1lbnQgZm9yIG1vcmUgaW5mbylcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzdGFydFZpZGVvU3RyZWFtaW5nKGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgdmFyIG5vR1VNU3VwcG9ydFRpbWVvdXQ7XG4gICAgICAgIHZhciB0aW1lb3V0TGVuZ3RoID0gb3B0aW9ucy50aW1lb3V0ICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLnRpbWVvdXQgOiAwO1xuXG4gICAgICAgIGlmKG5hdmlnYXRvci5nZXRNZWRpYSkge1xuXG4gICAgICAgICAgICAvLyBTb21lIGJyb3dzZXJzIGFwcGFyZW50bHkgaGF2ZSBzdXBwb3J0IGZvciB2aWRlbyBzdHJlYW1pbmcgYmVjYXVzZSBvZiB0aGVcbiAgICAgICAgICAgIC8vIHByZXNlbmNlIG9mIHRoZSBnZXRVc2VyTWVkaWEgZnVuY3Rpb24sIGJ1dCB0aGVuIGRvIG5vdCBhbnN3ZXIgb3VyXG4gICAgICAgICAgICAvLyBjYWxscyBmb3Igc3RyZWFtaW5nLlxuICAgICAgICAgICAgLy8gU28gd2UnbGwgc2V0IHVwIHRoaXMgdGltZW91dCBhbmQgaWYgbm90aGluZyBoYXBwZW5zIGFmdGVyIGEgd2hpbGUsIHdlJ2xsXG4gICAgICAgICAgICAvLyBjb25jbHVkZSB0aGF0IHRoZXJlJ3Mgbm8gYWN0dWFsIGdldFVzZXJNZWRpYSBzdXBwb3J0LlxuICAgICAgICAgICAgaWYodGltZW91dExlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBub0dVTVN1cHBvcnRUaW1lb3V0ID0gc2V0VGltZW91dChvblN0cmVhbWluZ1RpbWVvdXQsIDEwMDAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhcnRTdHJlYW1pbmcoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRVJST1IhISFcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdnZXRVc2VyTWVkaWEgY2Fubm90IGFjY2VzcyB0aGUgY2FtZXJhJykpO1xuXG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgc3RyZWFtaW5nIHN0YXJ0ZWQgc29tZWhvdywgc28gd2UgY2FuIGFzc3VtZSAvdGhlcmUgaXMvXG4gICAgICAgICAgICAgICAgICAgIC8vIGdVTSBzdXBwb3J0XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChub0dVTVN1cHBvcnRUaW1lb3V0KTtcblxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHN0cmVhbSwgdmlkZW9FbGVtZW50LCB3aWR0aCwgaGVpZ2h0KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gS2VlcCByZWZlcmVuY2VzLCBmb3Igc3RvcHBpbmcgdGhlIHN0cmVhbSBsYXRlciBvbi5cbiAgICAgICAgICAgICAgICAgICAgY2FtZXJhU3RyZWFtID0gc3RyZWFtO1xuICAgICAgICAgICAgICAgICAgICB2aWRlbyA9IHZpZGVvRWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBzdHJlYW0sIHZpZGVvRWxlbWVudCwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignTmF0aXZlIGRldmljZSBtZWRpYSBzdHJlYW1pbmcgKGdldFVzZXJNZWRpYSkgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXIuJykpO1xuXG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3RyZWFtaW5nVGltZW91dCgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignVGltZWQgb3V0IHdoaWxlIHRyeWluZyB0byBzdGFydCBzdHJlYW1pbmcnKSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gc3RvcFZpZGVvU3RyZWFtaW5nKCkge1xuICAgICAgICBcbiAgICAgICAgaWYoY2FtZXJhU3RyZWFtKSB7XG5cbiAgICAgICAgICAgIGNhbWVyYVN0cmVhbS5zdG9wKCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHZpZGVvKSB7XG5cbiAgICAgICAgICAgIHZpZGVvLnBhdXNlKCk7XG4gICAgICAgICAgICAvLyBUT0RPIGZyZWUgc3JjIHVybCBvYmplY3RcbiAgICAgICAgICAgIHZpZGVvLnNyYyA9IG51bGw7XG4gICAgICAgICAgICB2aWRlbyA9IG51bGw7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIEd1bUhlbHBlciA9IHtcbiAgICAgICAgc3RhcnRWaWRlb1N0cmVhbWluZzogc3RhcnRWaWRlb1N0cmVhbWluZyxcbiAgICAgICAgc3RvcFZpZGVvU3RyZWFtaW5nOiBzdG9wVmlkZW9TdHJlYW1pbmdcbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ2cnLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBHdW1IZWxwZXIpXG4gICAgLy8gTWFrZSBpdCBjb21wYXRpYmxlIGZvciByZXF1aXJlLmpzL0FNRCBsb2FkZXIocylcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gR3VtSGVscGVyOyB9KTtcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgLy8gQW5kIGZvciBucG0vbm9kZS5qc1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEd1bUhlbHBlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLkd1bUhlbHBlciA9IEd1bUhlbHBlcjtcbiAgICB9XG5cbn0pLmNhbGwodGhpcyk7XG5cblxuIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qIGpzaGludCBub2RlOiB0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBydGMgPSByZXF1aXJlKCdydGMtdG9vbHMnKTtcbnZhciBjbGVhbnVwID0gcmVxdWlyZSgncnRjLXRvb2xzL2NsZWFudXAnKTtcbnZhciBkZWJ1ZyA9IHJ0Yy5sb2dnZXIoJ3J0Yy1xdWlja2Nvbm5lY3QnKTtcbnZhciBzaWduYWxsZXIgPSByZXF1aXJlKCdydGMtc2lnbmFsbGVyJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdjb2cvZGVmYXVsdHMnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdjb2cvZXh0ZW5kJyk7XG52YXIgZ2V0YWJsZSA9IHJlcXVpcmUoJ2NvZy9nZXRhYmxlJyk7XG52YXIgcmVUcmFpbGluZ1NsYXNoID0gL1xcLyQvO1xuXG4vKipcbiAgIyBydGMtcXVpY2tjb25uZWN0XG5cbiAgVGhpcyBpcyBhIGhpZ2ggbGV2ZWwgaGVscGVyIG1vZHVsZSBkZXNpZ25lZCB0byBoZWxwIHlvdSBnZXQgdXBcbiAgYW4gcnVubmluZyB3aXRoIFdlYlJUQyByZWFsbHksIHJlYWxseSBxdWlja2x5LiAgQnkgdXNpbmcgdGhpcyBtb2R1bGUgeW91XG4gIGFyZSB0cmFkaW5nIG9mZiBzb21lIGZsZXhpYmlsaXR5LCBzbyBpZiB5b3UgbmVlZCBhIG1vcmUgZmxleGlibGVcbiAgY29uZmlndXJhdGlvbiB5b3Ugc2hvdWxkIGRyaWxsIGRvd24gaW50byBsb3dlciBsZXZlbCBjb21wb25lbnRzIG9mIHRoZVxuICBbcnRjLmlvXShodHRwOi8vd3d3LnJ0Yy5pbykgc3VpdGUuICBJbiBwYXJ0aWN1bGFyIHlvdSBzaG91bGQgY2hlY2sgb3V0XG4gIFtydGNdKGh0dHBzOi8vZ2l0aHViLmNvbS9ydGMtaW8vcnRjKS5cblxuICAjIyBVcGdyYWRpbmcgdG8gMS4wXG5cbiAgVGhlIFt1cGdyYWRpbmcgdG8gMS4wIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZ2l0aHViLmNvbS9ydGMtaW8vcnRjLXF1aWNrY29ubmVjdC9ibG9iL21hc3Rlci9kb2NzL3VwZ3JhZGluZy10by0xLjAubWQpXG4gIHByb3ZpZGVzIHNvbWUgaW5mb3JtYXRpb24gb24gd2hhdCB5b3UgbmVlZCB0byBjaGFuZ2UgdG8gdXBncmFkZSB0b1xuICBgcnRjLXF1aWNrY29ubmVjdEAxLjBgLiAgQWRkaXRpb25hbGx5LCB0aGVcbiAgW3F1aWNrY29ubmVjdCBkZW1vIGFwcF0oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGNpby1kZW1vLXF1aWNrY29ubmVjdClcbiAgaGFzIGJlZW4gdXBkYXRlZCB3aGljaCBzaG91bGQgcHJvdmlkZSBzb21lIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG5cbiAgIyMgRXhhbXBsZSBVc2FnZVxuXG4gIEluIHRoZSBzaW1wbGVzdCBjYXNlIHlvdSBzaW1wbHkgY2FsbCBxdWlja2Nvbm5lY3Qgd2l0aCBhIHNpbmdsZSBzdHJpbmdcbiAgYXJndW1lbnQgd2hpY2ggdGVsbHMgcXVpY2tjb25uZWN0IHdoaWNoIHNlcnZlciB0byB1c2UgZm9yIHNpZ25hbGluZzpcblxuICA8PDwgZXhhbXBsZXMvc2ltcGxlLmpzXG5cbiAgPDw8IGRvY3MvZXZlbnRzLm1kXG5cbiAgPDw8IGRvY3MvZXhhbXBsZXMubWRcblxuICAjIyBSZWdhcmRpbmcgU2lnbmFsbGluZyBhbmQgYSBTaWduYWxsaW5nIFNlcnZlclxuXG4gIFNpZ25hbGluZyBpcyBhbiBpbXBvcnRhbnQgcGFydCBvZiBzZXR0aW5nIHVwIGEgV2ViUlRDIGNvbm5lY3Rpb24gYW5kIGZvclxuICBvdXIgZXhhbXBsZXMgd2UgdXNlIG91ciBvd24gdGVzdCBpbnN0YW5jZSBvZiB0aGVcbiAgW3J0Yy1zd2l0Y2hib2FyZF0oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGMtc3dpdGNoYm9hcmQpLiBGb3IgeW91clxuICB0ZXN0aW5nIGFuZCBkZXZlbG9wbWVudCB5b3UgYXJlIG1vcmUgdGhhbiB3ZWxjb21lIHRvIHVzZSB0aGlzIGFsc28sIGJ1dFxuICBqdXN0IGJlIGF3YXJlIHRoYXQgd2UgdXNlIHRoaXMgZm9yIG91ciB0ZXN0aW5nIHNvIGl0IG1heSBnbyB1cCBhbmQgZG93blxuICBhIGxpdHRsZS4gIElmIHlvdSBuZWVkIHNvbWV0aGluZyBtb3JlIHN0YWJsZSwgd2h5IG5vdCBjb25zaWRlciBkZXBsb3lpbmdcbiAgYW4gaW5zdGFuY2Ugb2YgdGhlIHN3aXRjaGJvYXJkIHlvdXJzZWxmIC0gaXQncyBwcmV0dHkgZWFzeSA6KVxuXG4gICMjIFJlZmVyZW5jZVxuXG4gIGBgYFxuICBxdWlja2Nvbm5lY3Qoc2lnbmFsaG9zdCwgb3B0cz8pID0+IHJ0Yy1zaWdhbGxlciBpbnN0YW5jZSAoKyBoZWxwZXJzKVxuICBgYGBcblxuICAjIyMgVmFsaWQgUXVpY2sgQ29ubmVjdCBPcHRpb25zXG5cbiAgVGhlIG9wdGlvbnMgcHJvdmlkZWQgdG8gdGhlIGBydGMtcXVpY2tjb25uZWN0YCBtb2R1bGUgZnVuY3Rpb24gaW5mbHVlbmNlIHRoZVxuICBiZWhhdmlvdXIgb2Ygc29tZSBvZiB0aGUgdW5kZXJseWluZyBjb21wb25lbnRzIHVzZWQgZnJvbSB0aGUgcnRjLmlvIHN1aXRlLlxuXG4gIExpc3RlZCBiZWxvdyBhcmUgc29tZSBvZiB0aGUgY29tbW9ubHkgdXNlZCBvcHRpb25zOlxuXG4gIC0gYG5zYCAoZGVmYXVsdDogJycpXG5cbiAgICBBbiBvcHRpb25hbCBuYW1lc3BhY2UgZm9yIHlvdXIgc2lnbmFsbGluZyByb29tLiAgV2hpbGUgcXVpY2tjb25uZWN0XG4gICAgd2lsbCBnZW5lcmF0ZSBhIHVuaXF1ZSBoYXNoIGZvciB0aGUgcm9vbSwgdGhpcyBjYW4gYmUgbWFkZSB0byBiZSBtb3JlXG4gICAgdW5pcXVlIGJ5IHByb3ZpZGluZyBhIG5hbWVzcGFjZS4gIFVzaW5nIGEgbmFtZXNwYWNlIG1lYW5zIHR3byBkZW1vc1xuICAgIHRoYXQgaGF2ZSBnZW5lcmF0ZWQgdGhlIHNhbWUgaGFzaCBidXQgdXNlIGEgZGlmZmVyZW50IG5hbWVzcGFjZSB3aWxsIGJlXG4gICAgaW4gZGlmZmVyZW50IHJvb21zLlxuXG4gIC0gYHJvb21gIChkZWZhdWx0OiBudWxsKSBfYWRkZWQgMC42X1xuXG4gICAgUmF0aGVyIHRoYW4gdXNlIHRoZSBpbnRlcm5hbCBoYXNoIGdlbmVyYXRpb25cbiAgICAocGx1cyBvcHRpb25hbCBuYW1lc3BhY2UpIGZvciByb29tIG5hbWUgZ2VuZXJhdGlvbiwgc2ltcGx5IHVzZSB0aGlzIHJvb21cbiAgICBuYW1lIGluc3RlYWQuICBfX05PVEU6X18gVXNlIG9mIHRoZSBgcm9vbWAgb3B0aW9uIHRha2VzIHByZWNlbmRlbmNlIG92ZXJcbiAgICBgbnNgLlxuXG4gIC0gYGRlYnVnYCAoZGVmYXVsdDogZmFsc2UpXG5cbiAgV3JpdGUgcnRjLmlvIHN1aXRlIGRlYnVnIG91dHB1dCB0byB0aGUgYnJvd3NlciBjb25zb2xlLlxuXG4gICMjIyMgT3B0aW9ucyBmb3IgUGVlciBDb25uZWN0aW9uIENyZWF0aW9uXG5cbiAgT3B0aW9ucyB0aGF0IGFyZSBwYXNzZWQgb250byB0aGVcbiAgW3J0Yy5jcmVhdGVDb25uZWN0aW9uXShodHRwczovL2dpdGh1Yi5jb20vcnRjLWlvL3J0YyNjcmVhdGVjb25uZWN0aW9ub3B0cy1jb25zdHJhaW50cylcbiAgZnVuY3Rpb246XG5cbiAgLSBgaWNlU2VydmVyc2BcblxuICBUaGlzIHByb3ZpZGVzIGEgbGlzdCBvZiBpY2Ugc2VydmVycyB0aGF0IGNhbiBiZSB1c2VkIHRvIGhlbHAgbmVnb3RpYXRlIGFcbiAgY29ubmVjdGlvbiBiZXR3ZWVuIHBlZXJzLlxuXG4gICMjIyMgT3B0aW9ucyBmb3IgUDJQIG5lZ290aWF0aW9uXG5cbiAgVW5kZXIgdGhlIGhvb2QsIHF1aWNrY29ubmVjdCB1c2VzIHRoZVxuICBbcnRjL2NvdXBsZV0oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGMjcnRjY291cGxlKSBsb2dpYywgYW5kIHRoZSBvcHRpb25zXG4gIHBhc3NlZCB0byBxdWlja2Nvbm5lY3QgYXJlIGFsc28gcGFzc2VkIG9udG8gdGhpcyBmdW5jdGlvbi5cblxuKiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNpZ25hbGhvc3QsIG9wdHMpIHtcbiAgdmFyIGhhc2ggPSB0eXBlb2YgbG9jYXRpb24gIT0gJ3VuZGVmaW5lZCcgJiYgbG9jYXRpb24uaGFzaC5zbGljZSgxKTtcbiAgdmFyIHNpZ25hbGxlciA9IHJlcXVpcmUoJ3J0Yy1zaWduYWxsZXInKShzaWduYWxob3N0LCBvcHRzKTtcblxuICAvLyBpbml0IGNvbmZpZ3VyYWJsZSB2YXJzXG4gIHZhciBucyA9IChvcHRzIHx8IHt9KS5ucyB8fCAnJztcbiAgdmFyIHJvb20gPSAob3B0cyB8fCB7fSkucm9vbTtcbiAgdmFyIGRlYnVnZ2luZyA9IChvcHRzIHx8IHt9KS5kZWJ1ZztcbiAgdmFyIHByb2ZpbGUgPSB7fTtcbiAgdmFyIGFubm91bmNlZCA9IGZhbHNlO1xuXG4gIC8vIGNvbGxlY3QgdGhlIGxvY2FsIHN0cmVhbXNcbiAgdmFyIGxvY2FsU3RyZWFtcyA9IFtdO1xuXG4gIC8vIGNyZWF0ZSB0aGUgY2FsbHMgbWFwXG4gIHZhciBjYWxscyA9IHNpZ25hbGxlci5jYWxscyA9IGdldGFibGUoe30pO1xuXG4gIC8vIGNyZWF0ZSB0aGUga25vd24gZGF0YSBjaGFubmVscyByZWdpc3RyeVxuICB2YXIgY2hhbm5lbHMgPSB7fTtcblxuICBmdW5jdGlvbiBjYWxsQ3JlYXRlKGlkLCBwYywgZGF0YSkge1xuICAgIGNhbGxzLnNldChpZCwge1xuICAgICAgYWN0aXZlOiBmYWxzZSxcbiAgICAgIHBjOiBwYyxcbiAgICAgIGNoYW5uZWxzOiBnZXRhYmxlKHt9KSxcbiAgICAgIGRhdGE6IGRhdGEsXG4gICAgICBzdHJlYW1zOiBbXVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FsbEVuZChpZCkge1xuICAgIHZhciBjYWxsID0gY2FsbHMuZ2V0KGlkKTtcblxuICAgIC8vIGlmIHdlIGhhdmUgbm8gZGF0YSwgdGhlbiBkbyBub3RoaW5nXG4gICAgaWYgKCEgY2FsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRlYnVnKCdlbmRpbmcgY2FsbCB0bzogJyArIGlkKTtcblxuICAgIC8vIGlmIHdlIGhhdmUgbm8gZGF0YSwgdGhlbiByZXR1cm5cbiAgICBjYWxsLmNoYW5uZWxzLmtleXMoKS5mb3JFYWNoKGZ1bmN0aW9uKGxhYmVsKSB7XG4gICAgICB2YXIgYXJncyA9IFtpZCwgY2FsbC5jaGFubmVscy5nZXQobGFiZWwpLCBsYWJlbF07XG5cbiAgICAgIC8vIGVtaXQgdGhlIHBsYWluIGNoYW5uZWw6Y2xvc2VkIGV2ZW50XG4gICAgICBzaWduYWxsZXIuZW1pdC5hcHBseShzaWduYWxsZXIsIFsnY2hhbm5lbDpjbG9zZWQnXS5jb25jYXQoYXJncykpO1xuXG4gICAgICAvLyBlbWl0IHRoZSBsYWJlbGxlZCB2ZXJzaW9uIG9mIHRoZSBldmVudFxuICAgICAgc2lnbmFsbGVyLmVtaXQuYXBwbHkoc2lnbmFsbGVyLCBbJ2NoYW5uZWw6Y2xvc2VkOicgKyBsYWJlbF0uY29uY2F0KGFyZ3MpKTtcbiAgICB9KTtcblxuICAgIC8vIHRyaWdnZXIgc3RyZWFtOnJlbW92ZWQgZXZlbnRzIGZvciBlYWNoIG9mIHRoZSByZW1vdGVzdHJlYW1zIGluIHRoZSBwY1xuICAgIGNhbGwuc3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uKHN0cmVhbSkge1xuICAgICAgc2lnbmFsbGVyLmVtaXQoJ3N0cmVhbTpyZW1vdmVkJywgaWQsIHN0cmVhbSk7XG4gICAgfSk7XG5cbiAgICAvLyBkZWxldGUgdGhlIGNhbGwgZGF0YVxuICAgIGNhbGxzLmRlbGV0ZShpZCk7XG5cbiAgICAvLyB0cmlnZ2VyIHRoZSBjYWxsOmVuZGVkIGV2ZW50XG4gICAgc2lnbmFsbGVyLmVtaXQoJ2NhbGw6ZW5kZWQnLCBpZCwgY2FsbC5wYyk7XG5cbiAgICAvLyBlbnN1cmUgdGhlIHBlZXIgY29ubmVjdGlvbiBpcyBwcm9wZXJseSBjbGVhbmVkIHVwXG4gICAgY2xlYW51cChjYWxsLnBjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbGxTdGFydChpZCwgcGMsIGRhdGEpIHtcbiAgICB2YXIgY2FsbCA9IGNhbGxzLmdldChpZCk7XG4gICAgdmFyIHN0cmVhbXMgPSBbXS5jb25jYXQocGMuZ2V0UmVtb3RlU3RyZWFtcygpKTtcblxuICAgIC8vIGZsYWcgdGhlIGNhbGwgYXMgYWN0aXZlXG4gICAgY2FsbC5hY3RpdmUgPSB0cnVlO1xuICAgIGNhbGwuc3RyZWFtcyA9IFtdLmNvbmNhdChwYy5nZXRSZW1vdGVTdHJlYW1zKCkpO1xuXG4gICAgcGMub25hZGRzdHJlYW0gPSBjcmVhdGVTdHJlYW1BZGRIYW5kbGVyKGlkKTtcbiAgICBwYy5vbnJlbW92ZXN0cmVhbSA9IGNyZWF0ZVN0cmVhbVJlbW92ZUhhbmRsZXIoaWQpO1xuXG4gICAgZGVidWcoc2lnbmFsbGVyLmlkICsgJyAtICcgKyBpZCArICcgY2FsbCBzdGFydDogJyArIHN0cmVhbXMubGVuZ3RoICsgJyBzdHJlYW1zJyk7XG4gICAgc2lnbmFsbGVyLmVtaXQoJ2NhbGw6c3RhcnRlZCcsIGlkLCBwYywgZGF0YSk7XG5cbiAgICAvLyBleGFtaW5lIHRoZSBleGlzdGluZyByZW1vdGUgc3RyZWFtcyBhZnRlciBhIHNob3J0IGRlbGF5XG4gICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgIC8vIGl0ZXJhdGUgdGhyb3VnaCBhbnkgcmVtb3RlIHN0cmVhbXNcbiAgICAgIHN0cmVhbXMuZm9yRWFjaChyZWNlaXZlUmVtb3RlU3RyZWFtKGlkKSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTdHJlYW1BZGRIYW5kbGVyKGlkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgZGVidWcoJ3BlZXIgJyArIGlkICsgJyBhZGRlZCBzdHJlYW0nKTtcbiAgICAgIHVwZGF0ZVJlbW90ZVN0cmVhbXMoaWQpO1xuICAgICAgcmVjZWl2ZVJlbW90ZVN0cmVhbShpZCkoZXZ0LnN0cmVhbSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RyZWFtUmVtb3ZlSGFuZGxlcihpZCkge1xuICAgIHJldHVybiBmdW5jdGlvbihldnQpIHtcbiAgICAgIGRlYnVnKCdwZWVyICcgKyBpZCArICcgcmVtb3ZlZCBzdHJlYW0nKTtcbiAgICAgIHVwZGF0ZVJlbW90ZVN0cmVhbXMoaWQpO1xuICAgICAgc2lnbmFsbGVyLmVtaXQoJ3N0cmVhbTpyZW1vdmVkJywgaWQsIGV2dC5zdHJlYW0pO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBY3RpdmVDYWxsKHBlZXJJZCkge1xuICAgIHZhciBjYWxsID0gY2FsbHMuZ2V0KHBlZXJJZCk7XG5cbiAgICBpZiAoISBjYWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGFjdGl2ZSBjYWxsIGZvciBwZWVyOiAnICsgcGVlcklkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2FsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdvdFBlZXJDaGFubmVsKGNoYW5uZWwsIHBjLCBkYXRhKSB7XG4gICAgdmFyIGNoYW5uZWxNb25pdG9yO1xuXG4gICAgZnVuY3Rpb24gY2hhbm5lbFJlYWR5KCkge1xuICAgICAgdmFyIGNhbGwgPSBjYWxscy5nZXQoZGF0YS5pZCk7XG4gICAgICB2YXIgYXJncyA9IFsgZGF0YS5pZCwgY2hhbm5lbCwgZGF0YSwgcGMgXTtcblxuICAgICAgLy8gZGVjb3VwbGUgdGhlIGNoYW5uZWwub25vcGVuIGxpc3RlbmVyXG4gICAgICBkZWJ1ZygncmVwb3J0aW5nIGNoYW5uZWwgXCInICsgY2hhbm5lbC5sYWJlbCArICdcIiByZWFkeSwgaGF2ZSBjYWxsOiAnICsgKCEhY2FsbCkpO1xuICAgICAgY2xlYXJJbnRlcnZhbChjaGFubmVsTW9uaXRvcik7XG4gICAgICBjaGFubmVsLm9ub3BlbiA9IG51bGw7XG5cbiAgICAgIC8vIHNhdmUgdGhlIGNoYW5uZWxcbiAgICAgIGlmIChjYWxsKSB7XG4gICAgICAgIGNhbGwuY2hhbm5lbHMuc2V0KGNoYW5uZWwubGFiZWwsIGNoYW5uZWwpO1xuICAgICAgfVxuXG4gICAgICAvLyB0cmlnZ2VyIHRoZSAlY2hhbm5lbC5sYWJlbCU6b3BlbiBldmVudFxuICAgICAgZGVidWcoJ3RyaWdnZXJpbmcgY2hhbm5lbDpvcGVuZWQgZXZlbnRzIGZvciBjaGFubmVsOiAnICsgY2hhbm5lbC5sYWJlbCk7XG5cbiAgICAgIC8vIGVtaXQgdGhlIHBsYWluIGNoYW5uZWw6b3BlbmVkIGV2ZW50XG4gICAgICBzaWduYWxsZXIuZW1pdC5hcHBseShzaWduYWxsZXIsIFsnY2hhbm5lbDpvcGVuZWQnXS5jb25jYXQoYXJncykpO1xuXG4gICAgICAvLyBlbWl0IHRoZSBjaGFubmVsOm9wZW5lZDolbGFiZWwlIGV2ZVxuICAgICAgc2lnbmFsbGVyLmVtaXQuYXBwbHkoXG4gICAgICAgIHNpZ25hbGxlcixcbiAgICAgICAgWydjaGFubmVsOm9wZW5lZDonICsgY2hhbm5lbC5sYWJlbF0uY29uY2F0KGFyZ3MpXG4gICAgICApO1xuICAgIH1cblxuICAgIGRlYnVnKCdjaGFubmVsICcgKyBjaGFubmVsLmxhYmVsICsgJyBkaXNjb3ZlcmVkIGZvciBwZWVyOiAnICsgZGF0YS5pZCk7XG4gICAgaWYgKGNoYW5uZWwucmVhZHlTdGF0ZSA9PT0gJ29wZW4nKSB7XG4gICAgICByZXR1cm4gY2hhbm5lbFJlYWR5KCk7XG4gICAgfVxuXG4gICAgZGVidWcoJ2NoYW5uZWwgbm90IHJlYWR5LCBjdXJyZW50IHN0YXRlID0gJyArIGNoYW5uZWwucmVhZHlTdGF0ZSk7XG4gICAgY2hhbm5lbC5vbm9wZW4gPSBjaGFubmVsUmVhZHk7XG5cbiAgICAvLyBtb25pdG9yIHRoZSBjaGFubmVsIG9wZW4gKGRvbid0IHRydXN0IHRoZSBjaGFubmVsIG9wZW4gZXZlbnQganVzdCB5ZXQpXG4gICAgY2hhbm5lbE1vbml0b3IgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgIGRlYnVnKCdjaGVja2luZyBjaGFubmVsIHN0YXRlLCBjdXJyZW50IHN0YXRlID0gJyArIGNoYW5uZWwucmVhZHlTdGF0ZSk7XG4gICAgICBpZiAoY2hhbm5lbC5yZWFkeVN0YXRlID09PSAnb3BlbicpIHtcbiAgICAgICAgY2hhbm5lbFJlYWR5KCk7XG4gICAgICB9XG4gICAgfSwgNTAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVBlZXJBbm5vdW5jZShkYXRhKSB7XG4gICAgdmFyIHBjO1xuICAgIHZhciBtb25pdG9yO1xuXG4gICAgLy8gaWYgdGhlIHJvb20gaXMgbm90IGEgbWF0Y2gsIGFib3J0XG4gICAgaWYgKGRhdGEucm9vbSAhPT0gcm9vbSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBhIHBlZXIgY29ubmVjdGlvblxuICAgIHBjID0gcnRjLmNyZWF0ZUNvbm5lY3Rpb24ob3B0cywgKG9wdHMgfHwge30pLmNvbnN0cmFpbnRzKTtcblxuICAgIC8vIGFkZCB0aGlzIGNvbm5lY3Rpb24gdG8gdGhlIGNhbGxzIGxpc3RcbiAgICBjYWxsQ3JlYXRlKGRhdGEuaWQsIHBjLCBkYXRhKTtcblxuICAgIC8vIGFkZCB0aGUgbG9jYWwgc3RyZWFtc1xuICAgIGxvY2FsU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uKHN0cmVhbSwgaWR4KSB7XG4gICAgICBwYy5hZGRTdHJlYW0oc3RyZWFtKTtcbiAgICB9KTtcblxuICAgIC8vIGFkZCB0aGUgZGF0YSBjaGFubmVsc1xuICAgIC8vIGRvIHRoaXMgZGlmZmVyZW50bHkgYmFzZWQgb24gd2hldGhlciB0aGUgY29ubmVjdGlvbiBpcyBhXG4gICAgLy8gbWFzdGVyIG9yIGEgc2xhdmUgY29ubmVjdGlvblxuICAgIGlmIChzaWduYWxsZXIuaXNNYXN0ZXIoZGF0YS5pZCkpIHtcbiAgICAgIGRlYnVnKCdpcyBtYXN0ZXIsIGNyZWF0aW5nIGRhdGEgY2hhbm5lbHM6ICcsIE9iamVjdC5rZXlzKGNoYW5uZWxzKSk7XG5cbiAgICAgIC8vIGNyZWF0ZSB0aGUgY2hhbm5lbHNcbiAgICAgIE9iamVjdC5rZXlzKGNoYW5uZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGxhYmVsKSB7XG4gICAgICAgZ290UGVlckNoYW5uZWwocGMuY3JlYXRlRGF0YUNoYW5uZWwobGFiZWwsIGNoYW5uZWxzW2xhYmVsXSksIHBjLCBkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBjLm9uZGF0YWNoYW5uZWwgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBldnQgJiYgZXZ0LmNoYW5uZWw7XG5cbiAgICAgICAgLy8gaWYgd2UgaGF2ZSBubyBjaGFubmVsLCBhYm9ydFxuICAgICAgICBpZiAoISBjaGFubmVsKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoYW5uZWxzW2NoYW5uZWwubGFiZWxdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBnb3RQZWVyQ2hhbm5lbChjaGFubmVsLCBwYywgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gY291cGxlIHRoZSBjb25uZWN0aW9uc1xuICAgIGRlYnVnKCdjb3VwbGluZyAnICsgc2lnbmFsbGVyLmlkICsgJyB0byAnICsgZGF0YS5pZCk7XG4gICAgbW9uaXRvciA9IHJ0Yy5jb3VwbGUocGMsIGRhdGEuaWQsIHNpZ25hbGxlciwgb3B0cyk7XG5cbiAgICAvLyBvbmNlIGFjdGl2ZSwgdHJpZ2dlciB0aGUgcGVlciBjb25uZWN0IGV2ZW50XG4gICAgbW9uaXRvci5vbmNlKCdjb25uZWN0ZWQnLCBjYWxsU3RhcnQuYmluZChudWxsLCBkYXRhLmlkLCBwYywgZGF0YSkpXG4gICAgbW9uaXRvci5vbmNlKCdjbG9zZWQnLCBjYWxsRW5kLmJpbmQobnVsbCwgZGF0YS5pZCkpO1xuXG4gICAgLy8gaWYgd2UgYXJlIHRoZSBtYXN0ZXIgY29ubm5lY3Rpb24sIGNyZWF0ZSB0aGUgb2ZmZXJcbiAgICAvLyBOT1RFOiB0aGlzIG9ubHkgcmVhbGx5IGZvciB0aGUgc2FrZSBvZiBwb2xpdGVuZXNzLCBhcyBydGMgY291cGxlXG4gICAgLy8gaW1wbGVtZW50YXRpb24gaGFuZGxlcyB0aGUgc2xhdmUgYXR0ZW1wdGluZyB0byBjcmVhdGUgYW4gb2ZmZXJcbiAgICBpZiAoc2lnbmFsbGVyLmlzTWFzdGVyKGRhdGEuaWQpKSB7XG4gICAgICBtb25pdG9yLmNyZWF0ZU9mZmVyKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVjZWl2ZVJlbW90ZVN0cmVhbShpZCkge1xuICAgIHZhciBjYWxsID0gY2FsbHMuZ2V0KGlkKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihzdHJlYW0pIHtcbiAgICAgIHNpZ25hbGxlci5lbWl0KCdzdHJlYW06YWRkZWQnLCBpZCwgc3RyZWFtLCBjYWxsICYmIGNhbGwuZGF0YSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZVJlbW90ZVN0cmVhbXMoaWQpIHtcbiAgICB2YXIgY2FsbCA9IGNhbGxzLmdldChpZCk7XG5cbiAgICBpZiAoY2FsbCAmJiBjYWxsLnBjKSB7XG4gICAgICBjYWxsLnN0cmVhbXMgPSBbXS5jb25jYXQoY2FsbC5wYy5nZXRSZW1vdGVTdHJlYW1zKCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSByb29tIGlzIG5vdCBkZWZpbmVkLCB0aGVuIGdlbmVyYXRlIHRoZSByb29tIG5hbWVcbiAgaWYgKCEgcm9vbSkge1xuICAgIC8vIGlmIHRoZSBoYXNoIGlzIG5vdCBhc3NpZ25lZCwgdGhlbiBjcmVhdGUgYSByYW5kb20gaGFzaCB2YWx1ZVxuICAgIGlmICghIGhhc2gpIHtcbiAgICAgIGhhc2ggPSBsb2NhdGlvbi5oYXNoID0gJycgKyAoTWF0aC5wb3coMiwgNTMpICogTWF0aC5yYW5kb20oKSk7XG4gICAgfVxuXG4gICAgcm9vbSA9IG5zICsgJyMnICsgaGFzaDtcbiAgfVxuXG4gIGlmIChkZWJ1Z2dpbmcpIHtcbiAgICBydGMubG9nZ2VyLmVuYWJsZS5hcHBseShydGMubG9nZ2VyLCBBcnJheS5pc0FycmF5KGRlYnVnKSA/IGRlYnVnZ2luZyA6IFsnKiddKTtcbiAgfVxuXG4gIHNpZ25hbGxlci5vbigncGVlcjphbm5vdW5jZScsIGhhbmRsZVBlZXJBbm5vdW5jZSk7XG4gIHNpZ25hbGxlci5vbigncGVlcjpsZWF2ZScsIGNhbGxFbmQpO1xuXG4gIC8vIGFubm91bmNlIG91cnNlbHZlcyB0byBvdXIgbmV3IGZyaWVuZFxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIHZhciBkYXRhID0gZXh0ZW5kKHt9LCBwcm9maWxlLCB7IHJvb206IHJvb20gfSk7XG5cbiAgICAvLyBhbm5vdW5jZSBhbmQgZW1pdCB0aGUgbG9jYWwgYW5ub3VuY2UgZXZlbnRcbiAgICBzaWduYWxsZXIuYW5ub3VuY2UoZGF0YSk7XG4gICAgc2lnbmFsbGVyLmVtaXQoJ2xvY2FsOmFubm91bmNlJywgZGF0YSk7XG4gICAgYW5ub3VuY2VkID0gdHJ1ZTtcbiAgfSwgMCk7XG5cbiAgLyoqXG4gICAgIyMjIFF1aWNrY29ubmVjdCBCcm9hZGNhc3QgYW5kIERhdGEgQ2hhbm5lbCBIZWxwZXIgRnVuY3Rpb25zXG5cbiAgICBUaGUgZm9sbG93aW5nIGFyZSBmdW5jdGlvbnMgdGhhdCBhcmUgcGF0Y2hlZCBpbnRvIHRoZSBgcnRjLXNpZ25hbGxlcmBcbiAgICBpbnN0YW5jZSB0aGF0IG1ha2Ugd29ya2luZyB3aXRoIGFuZCBjcmVhdGluZyBmdW5jdGlvbmFsIFdlYlJUQyBhcHBsaWNhdGlvbnNcbiAgICBhIGxvdCBzaW1wbGVyLlxuXG4gICoqL1xuXG4gIC8qKlxuICAgICMjIyMgYWRkU3RyZWFtXG5cbiAgICBgYGBcbiAgICBhZGRTdHJlYW0oc3RyZWFtOk1lZGlhU3RyZWFtKSA9PiBxY1xuICAgIGBgYFxuXG4gICAgQWRkIHRoZSBzdHJlYW0gdG8gYWN0aXZlIGNhbGxzIGFuZCBhbHNvIHNhdmUgdGhlIHN0cmVhbSBzbyB0aGF0IGl0XG4gICAgY2FuIGJlIGFkZGVkIHRvIGZ1dHVyZSBjYWxscy5cblxuICAqKi9cbiAgc2lnbmFsbGVyLmJyb2FkY2FzdCA9IHNpZ25hbGxlci5hZGRTdHJlYW0gPSBmdW5jdGlvbihzdHJlYW0pIHtcbiAgICBsb2NhbFN0cmVhbXMucHVzaChzdHJlYW0pO1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBhbnkgYWN0aXZlIGNhbGxzLCB0aGVuIGFkZCB0aGUgc3RyZWFtXG4gICAgY2FsbHMudmFsdWVzKCkuZm9yRWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICBkYXRhLnBjLmFkZFN0cmVhbShzdHJlYW0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNpZ25hbGxlcjtcbiAgfTtcblxuICAvKipcbiAgICAjIyMjIGNsb3NlKClcblxuICAgIFRoZSBgY2xvc2VgIGZ1bmN0aW9uIHByb3ZpZGVzIGEgY29udmVuaWVudCB3YXkgb2YgY2xvc2luZyBhbGwgYXNzb2NpYXRlZFxuICAgIHBlZXIgY29ubmVjdGlvbnMuXG4gICoqL1xuICBzaWduYWxsZXIuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBlbmQgZWFjaCBvZiB0aGUgYWN0aXZlIGNhbGxzXG4gICAgY2FsbHMua2V5cygpLmZvckVhY2goY2FsbEVuZCk7XG5cbiAgICAvLyBjYWxsIHRoZSB1bmRlcmx5aW5nIHNpZ25hbGxlci5sZWF2ZSAoZm9yIHdoaWNoIGNsb3NlIGlzIGFuIGFsaWFzKVxuICAgIHNpZ25hbGxlci5sZWF2ZSgpO1xuICB9O1xuXG4gIC8qKlxuICAgICMjIyMgY3JlYXRlRGF0YUNoYW5uZWwobGFiZWwsIGNvbmZpZylcblxuICAgIFJlcXVlc3QgdGhhdCBhIGRhdGEgY2hhbm5lbCB3aXRoIHRoZSBzcGVjaWZpZWQgYGxhYmVsYCBpcyBjcmVhdGVkIG9uXG4gICAgdGhlIHBlZXIgY29ubmVjdGlvbi4gIFdoZW4gdGhlIGRhdGEgY2hhbm5lbCBpcyBvcGVuIGFuZCBhdmFpbGFibGUsIGFuXG4gICAgZXZlbnQgd2lsbCBiZSB0cmlnZ2VyZWQgdXNpbmcgdGhlIGxhYmVsIG9mIHRoZSBkYXRhIGNoYW5uZWwuXG5cbiAgICBGb3IgZXhhbXBsZSwgaWYgYSBuZXcgZGF0YSBjaGFubmVsIHdhcyByZXF1ZXN0ZWQgdXNpbmcgdGhlIGZvbGxvd2luZ1xuICAgIGNhbGw6XG5cbiAgICBgYGBqc1xuICAgIHZhciBxYyA9IHF1aWNrY29ubmVjdCgnaHR0cDovL3J0Yy5pby9zd2l0Y2hib2FyZCcpLmNyZWF0ZURhdGFDaGFubmVsKCd0ZXN0Jyk7XG4gICAgYGBgXG5cbiAgICBUaGVuIHdoZW4gdGhlIGRhdGEgY2hhbm5lbCBpcyByZWFkeSBmb3IgdXNlLCBhIGB0ZXN0Om9wZW5gIGV2ZW50IHdvdWxkXG4gICAgYmUgZW1pdHRlZCBieSBgcWNgLlxuXG4gICoqL1xuICBzaWduYWxsZXIuY3JlYXRlRGF0YUNoYW5uZWwgPSBmdW5jdGlvbihsYWJlbCwgb3B0cykge1xuICAgIC8vIGNyZWF0ZSBhIGNoYW5uZWwgb24gYWxsIGV4aXN0aW5nIGNhbGxzXG4gICAgY2FsbHMua2V5cygpLmZvckVhY2goZnVuY3Rpb24ocGVlcklkKSB7XG4gICAgICB2YXIgY2FsbCA9IGNhbGxzLmdldChwZWVySWQpO1xuICAgICAgdmFyIGRjO1xuXG4gICAgICAvLyBpZiB3ZSBhcmUgdGhlIG1hc3RlciBjb25uZWN0aW9uLCBjcmVhdGUgdGhlIGRhdGEgY2hhbm5lbFxuICAgICAgaWYgKGNhbGwgJiYgY2FsbC5wYyAmJiBzaWduYWxsZXIuaXNNYXN0ZXIocGVlcklkKSkge1xuICAgICAgICBkYyA9IGNhbGwucGMuY3JlYXRlRGF0YUNoYW5uZWwobGFiZWwsIG9wdHMpO1xuICAgICAgICBnb3RQZWVyQ2hhbm5lbChkYywgY2FsbC5wYywgY2FsbC5kYXRhKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIHNhdmUgdGhlIGRhdGEgY2hhbm5lbCBvcHRzIGluIHRoZSBsb2NhbCBjaGFubmVscyBkaWN0aW9uYXJ5XG4gICAgY2hhbm5lbHNbbGFiZWxdID0gb3B0cyB8fCBudWxsO1xuXG4gICAgcmV0dXJuIHNpZ25hbGxlcjtcbiAgfTtcblxuICAvKipcbiAgICAjIyMjIHJlYWN0aXZlKClcblxuICAgIEZsYWcgdGhhdCB0aGlzIHNlc3Npb24gd2lsbCBiZSBhIHJlYWN0aXZlIGNvbm5lY3Rpb24uXG5cbiAgKiovXG4gIHNpZ25hbGxlci5yZWFjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGFkZCB0aGUgcmVhY3RpdmUgZmxhZ1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgIG9wdHMucmVhY3RpdmUgPSB0cnVlO1xuXG4gICAgLy8gY2hhaW5cbiAgICByZXR1cm4gc2lnbmFsbGVyO1xuICB9O1xuXG4gIC8qKlxuICAgICMjIyMgcmVtb3ZlU3RyZWFtXG5cbiAgICBgYGBcbiAgICByZW1vdmVTdHJlYW0oc3RyZWFtOk1lZGlhU3RyZWFtKVxuICAgIGBgYFxuXG4gICAgUmVtb3ZlIHRoZSBzcGVjaWZpZWQgc3RyZWFtIGZyb20gYm90aCB0aGUgbG9jYWwgc3RyZWFtcyB0aGF0IGFyZSB0b1xuICAgIGJlIGNvbm5lY3RlZCB0byBuZXcgcGVlcnMsIGFuZCBhbHNvIGZyb20gYW55IGFjdGl2ZSBjYWxscy5cblxuICAqKi9cbiAgc2lnbmFsbGVyLnJlbW92ZVN0cmVhbSA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICAgIHZhciBsb2NhbEluZGV4ID0gbG9jYWxTdHJlYW1zLmluZGV4T2Yoc3RyZWFtKTtcblxuICAgIC8vIHJlbW92ZSB0aGUgc3RyZWFtIGZyb20gYW55IGFjdGl2ZSBjYWxsc1xuICAgIGNhbGxzLnZhbHVlcygpLmZvckVhY2goZnVuY3Rpb24oY2FsbCkge1xuICAgICAgY2FsbC5wYy5yZW1vdmVTdHJlYW0oc3RyZWFtKTtcbiAgICB9KTtcblxuICAgIC8vIHJlbW92ZSB0aGUgc3RyZWFtIGZyb20gdGhlIGxvY2FsU3RyZWFtcyBhcnJheVxuICAgIGlmIChsb2NhbEluZGV4ID49IDApIHtcbiAgICAgIGxvY2FsU3RyZWFtcy5zcGxpY2UobG9jYWxJbmRleCwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpZ25hbGxlcjtcbiAgfTtcblxuICAvKipcbiAgICAjIyMjIHJlcXVlc3RDaGFubmVsXG5cbiAgICBgYGBcbiAgICByZXF1ZXN0Q2hhbm5lbCh0YXJnZXRJZCwgbGFiZWwsIGNhbGxiYWNrKVxuICAgIGBgYFxuXG4gICAgVGhpcyBpcyBhIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVzcG9uZCB0byByZW1vdGUgcGVlcnMgc3VwcGx5aW5nXG4gICAgYSBkYXRhIGNoYW5uZWwgYXMgcGFydCBvZiB0aGVpciBjb25maWd1cmF0aW9uLiAgQXMgcGVyIHRoZSBgcmVjZWl2ZVN0cmVhbWBcbiAgICBmdW5jdGlvbiB0aGlzIGZ1bmN0aW9uIHdpbGwgZWl0aGVyIGZpcmUgdGhlIGNhbGxiYWNrIGltbWVkaWF0ZWx5IGlmIHRoZVxuICAgIGNoYW5uZWwgaXMgYWxyZWFkeSBhdmFpbGFibGUsIG9yIG9uY2UgdGhlIGNoYW5uZWwgaGFzIGJlZW4gZGlzY292ZXJlZCBvblxuICAgIHRoZSBjYWxsLlxuXG4gICoqL1xuICBzaWduYWxsZXIucmVxdWVzdENoYW5uZWwgPSBmdW5jdGlvbih0YXJnZXRJZCwgbGFiZWwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNhbGwgPSBnZXRBY3RpdmVDYWxsKHRhcmdldElkKTtcbiAgICB2YXIgY2hhbm5lbCA9IGNhbGwgJiYgY2FsbC5jaGFubmVscy5nZXQobGFiZWwpO1xuXG4gICAgLy8gaWYgd2UgaGF2ZSB0aGVuIGNoYW5uZWwgdHJpZ2dlciB0aGUgY2FsbGJhY2sgaW1tZWRpYXRlbHlcbiAgICBpZiAoY2hhbm5lbCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgY2hhbm5lbCk7XG4gICAgICByZXR1cm4gc2lnbmFsbGVyO1xuICAgIH1cblxuICAgIC8vIGlmIG5vdCwgd2FpdCBmb3IgaXRcbiAgICBzaWduYWxsZXIub25jZSgnY2hhbm5lbDpvcGVuZWQ6JyArIGxhYmVsLCBmdW5jdGlvbihpZCwgZGMpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIGRjKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzaWduYWxsZXI7XG4gIH07XG5cbiAgLyoqXG4gICAgIyMjIyByZXF1ZXN0U3RyZWFtXG5cbiAgICBgYGBcbiAgICByZXF1ZXN0U3RyZWFtKHRhcmdldElkLCBpZHgsIGNhbGxiYWNrKVxuICAgIGBgYFxuXG4gICAgVXNlZCB0byByZXF1ZXN0IGEgcmVtb3RlIHN0cmVhbSBmcm9tIGEgcXVpY2tjb25uZWN0IGluc3RhbmNlLiBJZiB0aGVcbiAgICBzdHJlYW0gaXMgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGNhbGxzIHJlbW90ZSBzdHJlYW1zLCB0aGVuIHRoZSBjYWxsYmFja1xuICAgIHdpbGwgYmUgdHJpZ2dlcmVkIGltbWVkaWF0ZWx5LCBvdGhlcndpc2UgdGhpcyBmdW5jdGlvbiB3aWxsIG1vbml0b3JcbiAgICBgc3RyZWFtOmFkZGVkYCBldmVudHMgYW5kIHdhaXQgZm9yIGEgbWF0Y2guXG5cbiAgICBJbiB0aGUgY2FzZSB0aGF0IGFuIHVua25vd24gdGFyZ2V0IGlzIHJlcXVlc3RlZCwgdGhlbiBhbiBleGNlcHRpb24gd2lsbFxuICAgIGJlIHRocm93bi5cbiAgKiovXG4gIHNpZ25hbGxlci5yZXF1ZXN0U3RyZWFtID0gZnVuY3Rpb24odGFyZ2V0SWQsIGlkeCwgY2FsbGJhY2spIHtcbiAgICB2YXIgY2FsbCA9IGdldEFjdGl2ZUNhbGwodGFyZ2V0SWQpO1xuICAgIHZhciBzdHJlYW07XG5cbiAgICBmdW5jdGlvbiB3YWl0Rm9yU3RyZWFtKHBlZXJJZCkge1xuICAgICAgaWYgKHBlZXJJZCAhPT0gdGFyZ2V0SWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBnZXQgdGhlIHN0cmVhbVxuICAgICAgc3RyZWFtID0gY2FsbC5wYy5nZXRSZW1vdGVTdHJlYW1zKClbaWR4XTtcblxuICAgICAgLy8gaWYgd2UgaGF2ZSB0aGUgc3RyZWFtLCB0aGVuIHJlbW92ZSB0aGUgbGlzdGVuZXIgYW5kIHRyaWdnZXIgdGhlIGNiXG4gICAgICBpZiAoc3RyZWFtKSB7XG4gICAgICAgIHNpZ25hbGxlci5yZW1vdmVMaXN0ZW5lcignc3RyZWFtOmFkZGVkJywgd2FpdEZvclN0cmVhbSk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHN0cmVhbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbG9vayBmb3IgdGhlIHN0cmVhbSBpbiB0aGUgcmVtb3RlIHN0cmVhbXMgb2YgdGhlIGNhbGxcbiAgICBzdHJlYW0gPSBjYWxsLnBjLmdldFJlbW90ZVN0cmVhbXMoKVtpZHhdO1xuXG4gICAgLy8gaWYgd2UgZm91bmQgdGhlIHN0cmVhbSB0aGVuIHRyaWdnZXIgdGhlIGNhbGxiYWNrXG4gICAgaWYgKHN0cmVhbSkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgc3RyZWFtKTtcbiAgICAgIHJldHVybiBzaWduYWxsZXI7XG4gICAgfVxuXG4gICAgLy8gb3RoZXJ3aXNlIHdhaXQgZm9yIHRoZSBzdHJlYW1cbiAgICBzaWduYWxsZXIub24oJ3N0cmVhbTphZGRlZCcsIHdhaXRGb3JTdHJlYW0pO1xuICAgIHJldHVybiBzaWduYWxsZXI7XG4gIH07XG5cbiAgLyoqXG4gICAgIyMjIyBwcm9maWxlKGRhdGEpXG5cbiAgICBVcGRhdGUgdGhlIHByb2ZpbGUgZGF0YSB3aXRoIHRoZSBhdHRhY2hlZCBpbmZvcm1hdGlvbiwgc28gd2hlblxuICAgIHRoZSBzaWduYWxsZXIgYW5ub3VuY2VzIGl0IGluY2x1ZGVzIHRoaXMgZGF0YSBpbiBhZGRpdGlvbiB0byBhbnlcbiAgICByb29tIGFuZCBpZCBpbmZvcm1hdGlvbi5cblxuICAqKi9cbiAgc2lnbmFsbGVyLnByb2ZpbGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgZXh0ZW5kKHByb2ZpbGUsIGRhdGEpO1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBhbHJlYWR5IGFubm91bmNlZCwgdGhlbiByZWFubm91bmNlIG91ciBwcm9maWxlIHRvIHByb3ZpZGVcbiAgICAvLyBvdGhlcnMgYSBgcGVlcjp1cGRhdGVgIGV2ZW50XG4gICAgaWYgKGFubm91bmNlZCkge1xuICAgICAgc2lnbmFsbGVyLmFubm91bmNlKHByb2ZpbGUpO1xuICAgIH1cblxuICAgIHJldHVybiBzaWduYWxsZXI7XG4gIH07XG5cbiAgLyoqXG4gICAgIyMjIyB3YWl0Rm9yQ2FsbFxuXG4gICAgYGBgXG4gICAgd2FpdEZvckNhbGwodGFyZ2V0SWQsIGNhbGxiYWNrKVxuICAgIGBgYFxuXG4gICAgV2FpdCBmb3IgYSBjYWxsIGZyb20gdGhlIHNwZWNpZmllZCB0YXJnZXRJZC4gIElmIHRoZSBjYWxsIGlzIGFscmVhZHlcbiAgICBhY3RpdmUgdGhlIGNhbGxiYWNrIHdpbGwgYmUgZmlyZWQgaW1tZWRpYXRlbHksIG90aGVyd2lzZSB3ZSB3aWxsIHdhaXRcbiAgICBmb3IgYSBgY2FsbDpzdGFydGVkYCBldmVudCB0aGF0IG1hdGNoZXMgdGhlIHJlcXVlc3RlZCBgdGFyZ2V0SWRgXG5cbiAgKiovXG4gIHNpZ25hbGxlci53YWl0Rm9yQ2FsbCA9IGZ1bmN0aW9uKHRhcmdldElkLCBjYWxsYmFjaykge1xuICAgIHZhciBjYWxsID0gY2FsbHMuZ2V0KHRhcmdldElkKTtcblxuICAgIGlmIChjYWxsICYmIGNhbGwuYWN0aXZlKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCBjYWxsLnBjKTtcbiAgICAgIHJldHVybiBzaWduYWxsZXI7XG4gICAgfVxuXG4gICAgc2lnbmFsbGVyLm9uKCdjYWxsOnN0YXJ0ZWQnLCBmdW5jdGlvbiBoYW5kbGVOZXdDYWxsKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHRhcmdldElkKSB7XG4gICAgICAgIHNpZ25hbGxlci5yZW1vdmVMaXN0ZW5lcignY2FsbDpzdGFydGVkJywgaGFuZGxlTmV3Q2FsbCk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGNhbGxzLmdldChpZCkucGMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vIHBhc3MgdGhlIHNpZ25hbGxlciBvblxuICByZXR1cm4gc2lnbmFsbGVyO1xufTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJaYmk3Z2JcIikpIiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4jIyBjb2cvZGVmYXVsdHNcblxuYGBganNcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2NvZy9kZWZhdWx0cycpO1xuYGBgXG5cbiMjIyBkZWZhdWx0cyh0YXJnZXQsICopXG5cblNoYWxsb3cgY29weSBvYmplY3QgcHJvcGVydGllcyBmcm9tIHRoZSBzdXBwbGllZCBzb3VyY2Ugb2JqZWN0cyAoKikgaW50b1xudGhlIHRhcmdldCBvYmplY3QsIHJldHVybmluZyB0aGUgdGFyZ2V0IG9iamVjdCBvbmNlIGNvbXBsZXRlZC4gIERvIG5vdCxcbmhvd2V2ZXIsIG92ZXJ3cml0ZSBleGlzdGluZyBrZXlzIHdpdGggbmV3IHZhbHVlczpcblxuYGBganNcbmRlZmF1bHRzKHsgYTogMSwgYjogMiB9LCB7IGM6IDMgfSwgeyBkOiA0IH0sIHsgYjogNSB9KSk7XG5gYGBcblxuU2VlIGFuIGV4YW1wbGUgb24gW3JlcXVpcmViaW5dKGh0dHA6Ly9yZXF1aXJlYmluLmNvbS8/Z2lzdD02MDc5NDc1KS5cbioqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgLy8gZW5zdXJlIHdlIGhhdmUgYSB0YXJnZXRcbiAgdGFyZ2V0ID0gdGFyZ2V0IHx8IHt9O1xuXG4gIC8vIGl0ZXJhdGUgdGhyb3VnaCB0aGUgc291cmNlcyBhbmQgY29weSB0byB0aGUgdGFyZ2V0XG4gIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKS5mb3JFYWNoKGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIGlmICghIHNvdXJjZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICBpZiAodGFyZ2V0W3Byb3BdID09PSB2b2lkIDApIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHRhcmdldDtcbn07IiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4jIyBjb2cvZXh0ZW5kXG5cbmBgYGpzXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnY29nL2V4dGVuZCcpO1xuYGBgXG5cbiMjIyBleHRlbmQodGFyZ2V0LCAqKVxuXG5TaGFsbG93IGNvcHkgb2JqZWN0IHByb3BlcnRpZXMgZnJvbSB0aGUgc3VwcGxpZWQgc291cmNlIG9iamVjdHMgKCopIGludG9cbnRoZSB0YXJnZXQgb2JqZWN0LCByZXR1cm5pbmcgdGhlIHRhcmdldCBvYmplY3Qgb25jZSBjb21wbGV0ZWQ6XG5cbmBgYGpzXG5leHRlbmQoeyBhOiAxLCBiOiAyIH0sIHsgYzogMyB9LCB7IGQ6IDQgfSwgeyBiOiA1IH0pKTtcbmBgYFxuXG5TZWUgYW4gZXhhbXBsZSBvbiBbcmVxdWlyZWJpbl0oaHR0cDovL3JlcXVpcmViaW4uY29tLz9naXN0PTYwNzk0NzUpLlxuKiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkuZm9yRWFjaChmdW5jdGlvbihzb3VyY2UpIHtcbiAgICBpZiAoISBzb3VyY2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHRhcmdldDtcbn07IiwiLyoqXG4gICMjIGNvZy9nZXRhYmxlXG5cbiAgVGFrZSBhbiBvYmplY3QgYW5kIHByb3ZpZGUgYSB3cmFwcGVyIHRoYXQgYWxsb3dzIHlvdSB0byBgZ2V0YCBhbmRcbiAgYHNldGAgdmFsdWVzIG9uIHRoYXQgb2JqZWN0LlxuXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICByZXR1cm4gdGFyZ2V0W2tleV07XG4gIH1cblxuICBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIHRhcmdldFtrZXldID0gdmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmUoa2V5KSB7XG4gICAgcmV0dXJuIGRlbGV0ZSB0YXJnZXRba2V5XTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGtleXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRhcmdldCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gdmFsdWVzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0YXJnZXQpLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiB0YXJnZXRba2V5XTtcbiAgICB9KTtcbiAgfTtcblxuICBpZiAodHlwZW9mIHRhcmdldCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldDogZ2V0LFxuICAgIHNldDogc2V0LFxuICAgIHJlbW92ZTogcmVtb3ZlLFxuICAgIGRlbGV0ZTogcmVtb3ZlLFxuICAgIGtleXM6IGtleXMsXG4gICAgdmFsdWVzOiB2YWx1ZXNcbiAgfTtcbn07XG4iLCIvKiBqc2hpbnQgbm9kZTogdHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAgIyMgY29nL2pzb25wYXJzZVxuXG4gIGBgYGpzXG4gIHZhciBqc29ucGFyc2UgPSByZXF1aXJlKCdjb2cvanNvbnBhcnNlJyk7XG4gIGBgYFxuXG4gICMjIyBqc29ucGFyc2UoaW5wdXQpXG5cbiAgVGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gYXV0b21hdGljYWxseSBkZXRlY3Qgc3RyaW5naWZpZWQgSlNPTiwgYW5kXG4gIHdoZW4gZGV0ZWN0ZWQgd2lsbCBwYXJzZSBpbnRvIEpTT04gb2JqZWN0cy4gIFRoZSBmdW5jdGlvbiBsb29rcyBmb3Igc3RyaW5nc1xuICB0aGF0IGxvb2sgYW5kIHNtZWxsIGxpa2Ugc3RyaW5naWZpZWQgSlNPTiwgYW5kIGlmIGZvdW5kIGF0dGVtcHRzIHRvXG4gIGBKU09OLnBhcnNlYCB0aGUgaW5wdXQgaW50byBhIHZhbGlkIG9iamVjdC5cblxuKiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBpc1N0cmluZyA9IHR5cGVvZiBpbnB1dCA9PSAnc3RyaW5nJyB8fCAoaW5wdXQgaW5zdGFuY2VvZiBTdHJpbmcpO1xuICB2YXIgcmVOdW1lcmljID0gL15cXC0/XFxkK1xcLj9cXGQqJC87XG4gIHZhciBzaG91bGRQYXJzZSA7XG4gIHZhciBmaXJzdENoYXI7XG4gIHZhciBsYXN0Q2hhcjtcblxuICBpZiAoKCEgaXNTdHJpbmcpIHx8IGlucHV0Lmxlbmd0aCA8IDIpIHtcbiAgICBpZiAoaXNTdHJpbmcgJiYgcmVOdW1lcmljLnRlc3QoaW5wdXQpKSB7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChpbnB1dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlucHV0O1xuICB9XG5cbiAgLy8gY2hlY2sgZm9yIHRydWUgb3IgZmFsc2VcbiAgaWYgKGlucHV0ID09PSAndHJ1ZScgfHwgaW5wdXQgPT09ICdmYWxzZScpIHtcbiAgICByZXR1cm4gaW5wdXQgPT09ICd0cnVlJztcbiAgfVxuXG4gIC8vIGNoZWNrIGZvciBudWxsXG4gIGlmIChpbnB1dCA9PT0gJ251bGwnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBnZXQgdGhlIGZpcnN0IGFuZCBsYXN0IGNoYXJhY3RlcnNcbiAgZmlyc3RDaGFyID0gaW5wdXQuY2hhckF0KDApO1xuICBsYXN0Q2hhciA9IGlucHV0LmNoYXJBdChpbnB1dC5sZW5ndGggLSAxKTtcblxuICAvLyBkZXRlcm1pbmUgd2hldGhlciB3ZSBzaG91bGQgSlNPTi5wYXJzZSB0aGUgaW5wdXRcbiAgc2hvdWxkUGFyc2UgPVxuICAgIChmaXJzdENoYXIgPT0gJ3snICYmIGxhc3RDaGFyID09ICd9JykgfHxcbiAgICAoZmlyc3RDaGFyID09ICdbJyAmJiBsYXN0Q2hhciA9PSAnXScpIHx8XG4gICAgKGZpcnN0Q2hhciA9PSAnXCInICYmIGxhc3RDaGFyID09ICdcIicpO1xuXG4gIGlmIChzaG91bGRQYXJzZSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShpbnB1dCk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAvLyBhcHBhcmVudGx5IGl0IHdhc24ndCB2YWxpZCBqc29uLCBjYXJyeSBvbiB3aXRoIHJlZ3VsYXIgcHJvY2Vzc2luZ1xuICAgIH1cbiAgfVxuXG5cbiAgcmV0dXJuIHJlTnVtZXJpYy50ZXN0KGlucHV0KSA/IHBhcnNlRmxvYXQoaW5wdXQpIDogaW5wdXQ7XG59OyIsIi8qIGpzaGludCBub2RlOiB0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICAjIyBjb2cvbG9nZ2VyXG5cbiAgYGBganNcbiAgdmFyIGxvZ2dlciA9IHJlcXVpcmUoJ2NvZy9sb2dnZXInKTtcbiAgYGBgXG5cbiAgU2ltcGxlIGJyb3dzZXIgbG9nZ2luZyBvZmZlcmluZyBzaW1pbGFyIGZ1bmN0aW9uYWxpdHkgdG8gdGhlXG4gIFtkZWJ1Z10oaHR0cHM6Ly9naXRodWIuY29tL3Zpc2lvbm1lZGlhL2RlYnVnKSBtb2R1bGUuXG5cbiAgIyMjIFVzYWdlXG5cbiAgQ3JlYXRlIHlvdXIgc2VsZiBhIG5ldyBsb2dnaW5nIGluc3RhbmNlIGFuZCBnaXZlIGl0IGEgbmFtZTpcblxuICBgYGBqc1xuICB2YXIgZGVidWcgPSBsb2dnZXIoJ3BoaWwnKTtcbiAgYGBgXG5cbiAgTm93IGRvIHNvbWUgZGVidWdnaW5nOlxuXG4gIGBgYGpzXG4gIGRlYnVnKCdoZWxsbycpO1xuICBgYGBcblxuICBBdCB0aGlzIHN0YWdlLCBubyBsb2cgb3V0cHV0IHdpbGwgYmUgZ2VuZXJhdGVkIGJlY2F1c2UgeW91ciBsb2dnZXIgaXNcbiAgY3VycmVudGx5IGRpc2FibGVkLiAgRW5hYmxlIGl0OlxuXG4gIGBgYGpzXG4gIGxvZ2dlci5lbmFibGUoJ3BoaWwnKTtcbiAgYGBgXG5cbiAgTm93IGRvIHNvbWUgbW9yZSBsb2dnZXI6XG5cbiAgYGBganNcbiAgZGVidWcoJ09oIHRoaXMgaXMgc28gbXVjaCBuaWNlciA6KScpO1xuICAvLyAtLT4gcGhpbDogT2ggdGhpcyBpcyBzb21lIG11Y2ggbmljZXIgOilcbiAgYGBgXG5cbiAgIyMjIFJlZmVyZW5jZVxuKiovXG5cbnZhciBhY3RpdmUgPSBbXTtcbnZhciB1bmxlYXNoTGlzdGVuZXJzID0gW107XG52YXIgdGFyZ2V0cyA9IFsgY29uc29sZSBdO1xuXG4vKipcbiAgIyMjIyBsb2dnZXIobmFtZSlcblxuICBDcmVhdGUgYSBuZXcgbG9nZ2luZyBpbnN0YW5jZS5cbioqL1xudmFyIGxvZ2dlciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmFtZSkge1xuICAvLyBpbml0aWFsIGVuYWJsZWQgY2hlY2tcbiAgdmFyIGVuYWJsZWQgPSBjaGVja0FjdGl2ZSgpO1xuXG4gIGZ1bmN0aW9uIGNoZWNrQWN0aXZlKCkge1xuICAgIHJldHVybiBlbmFibGVkID0gYWN0aXZlLmluZGV4T2YoJyonKSA+PSAwIHx8IGFjdGl2ZS5pbmRleE9mKG5hbWUpID49IDA7XG4gIH1cblxuICAvLyByZWdpc3RlciB0aGUgY2hlY2sgYWN0aXZlIHdpdGggdGhlIGxpc3RlbmVycyBhcnJheVxuICB1bmxlYXNoTGlzdGVuZXJzW3VubGVhc2hMaXN0ZW5lcnMubGVuZ3RoXSA9IGNoZWNrQWN0aXZlO1xuXG4gIC8vIHJldHVybiB0aGUgYWN0dWFsIGxvZ2dpbmcgZnVuY3Rpb25cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBhIHN0cmluZyBtZXNzYWdlXG4gICAgaWYgKHR5cGVvZiBhcmdzWzBdID09ICdzdHJpbmcnIHx8IChhcmdzWzBdIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgYXJnc1swXSA9IG5hbWUgKyAnOiAnICsgYXJnc1swXTtcbiAgICB9XG5cbiAgICAvLyBpZiBub3QgZW5hYmxlZCwgYmFpbFxuICAgIGlmICghIGVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBsb2dcbiAgICB0YXJnZXRzLmZvckVhY2goZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICB0YXJnZXQubG9nLmFwcGx5KHRhcmdldCwgYXJncyk7XG4gICAgfSk7XG4gIH07XG59O1xuXG4vKipcbiAgIyMjIyBsb2dnZXIucmVzZXQoKVxuXG4gIFJlc2V0IGxvZ2dpbmcgKHJlbW92ZSB0aGUgZGVmYXVsdCBjb25zb2xlIGxvZ2dlciwgZmxhZyBhbGwgbG9nZ2VycyBhc1xuICBpbmFjdGl2ZSwgZXRjLCBldGMuXG4qKi9cbmxvZ2dlci5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAvLyByZXNldCB0YXJnZXRzIGFuZCBhY3RpdmUgc3RhdGVzXG4gIHRhcmdldHMgPSBbXTtcbiAgYWN0aXZlID0gW107XG5cbiAgcmV0dXJuIGxvZ2dlci5lbmFibGUoKTtcbn07XG5cbi8qKlxuICAjIyMjIGxvZ2dlci50byh0YXJnZXQpXG5cbiAgQWRkIGEgbG9nZ2luZyB0YXJnZXQuICBUaGUgbG9nZ2VyIG11c3QgaGF2ZSBhIGBsb2dgIG1ldGhvZCBhdHRhY2hlZC5cblxuKiovXG5sb2dnZXIudG8gPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgdGFyZ2V0cyA9IHRhcmdldHMuY29uY2F0KHRhcmdldCB8fCBbXSk7XG5cbiAgcmV0dXJuIGxvZ2dlcjtcbn07XG5cbi8qKlxuICAjIyMjIGxvZ2dlci5lbmFibGUobmFtZXMqKVxuXG4gIEVuYWJsZSBsb2dnaW5nIHZpYSB0aGUgbmFtZWQgbG9nZ2luZyBpbnN0YW5jZXMuICBUbyBlbmFibGUgbG9nZ2luZyB2aWEgYWxsXG4gIGluc3RhbmNlcywgeW91IGNhbiBwYXNzIGEgd2lsZGNhcmQ6XG5cbiAgYGBganNcbiAgbG9nZ2VyLmVuYWJsZSgnKicpO1xuICBgYGBcblxuICBfX1RPRE86X18gd2lsZGNhcmQgZW5hYmxlcnNcbioqL1xubG9nZ2VyLmVuYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAvLyB1cGRhdGUgdGhlIGFjdGl2ZVxuICBhY3RpdmUgPSBhY3RpdmUuY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG5cbiAgLy8gdHJpZ2dlciB0aGUgdW5sZWFzaCBsaXN0ZW5lcnNcbiAgdW5sZWFzaExpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgbGlzdGVuZXIoKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGxvZ2dlcjtcbn07IiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gICMjIGNvZy90aHJvdHRsZVxuXG4gIGBgYGpzXG4gIHZhciB0aHJvdHRsZSA9IHJlcXVpcmUoJ2NvZy90aHJvdHRsZScpO1xuICBgYGBcblxuICAjIyMgdGhyb3R0bGUoZm4sIGRlbGF5LCBvcHRzKVxuXG4gIEEgY2hlcnJ5LXBpY2thYmxlIHRocm90dGxlIGZ1bmN0aW9uLiAgVXNlZCB0byB0aHJvdHRsZSBgZm5gIHRvIGVuc3VyZVxuICB0aGF0IGl0IGNhbiBiZSBjYWxsZWQgYXQgbW9zdCBvbmNlIGV2ZXJ5IGBkZWxheWAgbWlsbGlzZWNvbmRzLiAgV2lsbFxuICBmaXJlIGZpcnN0IGV2ZW50IGltbWVkaWF0ZWx5LCBlbnN1cmluZyB0aGUgbmV4dCBldmVudCBmaXJlZCB3aWxsIG9jY3VyXG4gIGF0IGxlYXN0IGBkZWxheWAgbWlsbGlzZWNvbmRzIGFmdGVyIHRoZSBmaXJzdCwgYW5kIHNvIG9uLlxuXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZm4sIGRlbGF5LCBvcHRzKSB7XG4gIHZhciBsYXN0RXhlYyA9IChvcHRzIHx8IHt9KS5sZWFkaW5nICE9PSBmYWxzZSA/IDAgOiBEYXRlLm5vdygpO1xuICB2YXIgdHJhaWxpbmcgPSAob3B0cyB8fCB7fSkudHJhaWxpbmc7XG4gIHZhciB0aW1lcjtcbiAgdmFyIHF1ZXVlZEFyZ3M7XG4gIHZhciBxdWV1ZWRTY29wZTtcblxuICAvLyB0cmFpbGluZyBkZWZhdWx0cyB0byB0cnVlXG4gIHRyYWlsaW5nID0gdHJhaWxpbmcgfHwgdHJhaWxpbmcgPT09IHVuZGVmaW5lZDtcbiAgXG4gIGZ1bmN0aW9uIGludm9rZURlZmVyZWQoKSB7XG4gICAgZm4uYXBwbHkocXVldWVkU2NvcGUsIHF1ZXVlZEFyZ3MgfHwgW10pO1xuICAgIGxhc3RFeGVjID0gRGF0ZS5ub3coKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGljayA9IERhdGUubm93KCk7XG4gICAgdmFyIGVsYXBzZWQgPSB0aWNrIC0gbGFzdEV4ZWM7XG5cbiAgICAvLyBhbHdheXMgY2xlYXIgdGhlIGRlZmVyZWQgdGltZXJcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuXG4gICAgaWYgKGVsYXBzZWQgPCBkZWxheSkge1xuICAgICAgcXVldWVkQXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgIHF1ZXVlZFNjb3BlID0gdGhpcztcblxuICAgICAgcmV0dXJuIHRyYWlsaW5nICYmICh0aW1lciA9IHNldFRpbWVvdXQoaW52b2tlRGVmZXJlZCwgZGVsYXkgLSBlbGFwc2VkKSk7XG4gICAgfVxuXG4gICAgLy8gY2FsbCB0aGUgZnVuY3Rpb25cbiAgICBsYXN0RXhlYyA9IHRpY2s7XG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbn07IiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbi8qIGdsb2JhbCB3aW5kb3c6IGZhbHNlICovXG4vKiBnbG9iYWwgbmF2aWdhdG9yOiBmYWxzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBicm93c2VyID0gcmVxdWlyZSgnZGV0ZWN0LWJyb3dzZXInKTtcblxuLyoqXG4gICMjIHJ0Yy1jb3JlL2RldGVjdFxuXG4gIEEgYnJvd3NlciBkZXRlY3Rpb24gaGVscGVyIGZvciBhY2Nlc3NpbmcgcHJlZml4LWZyZWUgdmVyc2lvbnMgb2YgdGhlIHZhcmlvdXNcbiAgV2ViUlRDIHR5cGVzLlxuXG4gICMjIyBFeGFtcGxlIFVzYWdlXG5cbiAgSWYgeW91IHdhbnRlZCB0byBnZXQgdGhlIG5hdGl2ZSBgUlRDUGVlckNvbm5lY3Rpb25gIHByb3RvdHlwZSBpbiBhbnkgYnJvd3NlclxuICB5b3UgY291bGQgZG8gdGhlIGZvbGxvd2luZzpcblxuICBgYGBqc1xuICB2YXIgZGV0ZWN0ID0gcmVxdWlyZSgncnRjLWNvcmUvZGV0ZWN0Jyk7IC8vIGFsc28gYXZhaWxhYmxlIGluIHJ0Yy9kZXRlY3RcbiAgdmFyIFJUQ1BlZXJDb25uZWN0aW9uID0gZGV0ZWN0KCdSVENQZWVyQ29ubmVjdGlvbicpO1xuICBgYGBcblxuICBUaGlzIHdvdWxkIHByb3ZpZGUgd2hhdGV2ZXIgdGhlIGJyb3dzZXIgcHJlZml4ZWQgdmVyc2lvbiBvZiB0aGVcbiAgUlRDUGVlckNvbm5lY3Rpb24gaXMgYXZhaWxhYmxlIChgd2Via2l0UlRDUGVlckNvbm5lY3Rpb25gLFxuICBgbW96UlRDUGVlckNvbm5lY3Rpb25gLCBldGMpLlxuKiovXG52YXIgZGV0ZWN0ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0YXJnZXQsIHByZWZpeGVzKSB7XG4gIHZhciBwcmVmaXhJZHg7XG4gIHZhciBwcmVmaXg7XG4gIHZhciB0ZXN0TmFtZTtcbiAgdmFyIGhvc3RPYmplY3QgPSB0aGlzIHx8ICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gd2luZG93IDogdW5kZWZpbmVkKTtcblxuICAvLyBpZiB3ZSBoYXZlIG5vIGhvc3Qgb2JqZWN0LCB0aGVuIGFib3J0XG4gIGlmICghIGhvc3RPYmplY3QpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBpbml0aWFsaXNlIHRvIGRlZmF1bHQgcHJlZml4ZXNcbiAgLy8gKHJldmVyc2Ugb3JkZXIgYXMgd2UgdXNlIGEgZGVjcmVtZW50aW5nIGZvciBsb29wKVxuICBwcmVmaXhlcyA9IChwcmVmaXhlcyB8fCBbJ21zJywgJ28nLCAnbW96JywgJ3dlYmtpdCddKS5jb25jYXQoJycpO1xuXG4gIC8vIGl0ZXJhdGUgdGhyb3VnaCB0aGUgcHJlZml4ZXMgYW5kIHJldHVybiB0aGUgY2xhc3MgaWYgZm91bmQgaW4gZ2xvYmFsXG4gIGZvciAocHJlZml4SWR4ID0gcHJlZml4ZXMubGVuZ3RoOyBwcmVmaXhJZHgtLTsgKSB7XG4gICAgcHJlZml4ID0gcHJlZml4ZXNbcHJlZml4SWR4XTtcblxuICAgIC8vIGNvbnN0cnVjdCB0aGUgdGVzdCBjbGFzcyBuYW1lXG4gICAgLy8gaWYgd2UgaGF2ZSBhIHByZWZpeCBlbnN1cmUgdGhlIHRhcmdldCBoYXMgYW4gdXBwZXJjYXNlIGZpcnN0IGNoYXJhY3RlclxuICAgIC8vIHN1Y2ggdGhhdCBhIHRlc3QgZm9yIGdldFVzZXJNZWRpYSB3b3VsZCByZXN1bHQgaW4gYVxuICAgIC8vIHNlYXJjaCBmb3Igd2Via2l0R2V0VXNlck1lZGlhXG4gICAgdGVzdE5hbWUgPSBwcmVmaXggKyAocHJlZml4ID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0YXJnZXQuc2xpY2UoMSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldCk7XG5cbiAgICBpZiAodHlwZW9mIGhvc3RPYmplY3RbdGVzdE5hbWVdICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyB1cGRhdGUgdGhlIGxhc3QgdXNlZCBwcmVmaXhcbiAgICAgIGRldGVjdC5icm93c2VyID0gZGV0ZWN0LmJyb3dzZXIgfHwgcHJlZml4LnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgIC8vIHJldHVybiB0aGUgaG9zdCBvYmplY3QgbWVtYmVyXG4gICAgICByZXR1cm4gaG9zdE9iamVjdFt0YXJnZXRdID0gaG9zdE9iamVjdFt0ZXN0TmFtZV07XG4gICAgfVxuICB9XG59O1xuXG4vLyBkZXRlY3QgbW96aWxsYSAoeWVzLCB0aGlzIGZlZWxzIGRpcnR5KVxuZGV0ZWN0Lm1veiA9IHR5cGVvZiBuYXZpZ2F0b3IgIT0gJ3VuZGVmaW5lZCcgJiYgISFuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhO1xuXG4vLyBzZXQgdGhlIGJyb3dzZXIgYW5kIGJyb3dzZXIgdmVyc2lvblxuZGV0ZWN0LmJyb3dzZXIgPSBicm93c2VyLm5hbWU7XG5kZXRlY3QuYnJvd3NlclZlcnNpb24gPSBkZXRlY3QudmVyc2lvbiA9IGJyb3dzZXIudmVyc2lvbjtcbiIsInZhciBicm93c2VycyA9IFtcbiAgWyAnY2hyb21lJywgL0Nocm9tKD86ZXxpdW0pXFwvKFswLTlcXC5dKykoOj9cXHN8JCkvIF0sXG4gIFsgJ2ZpcmVmb3gnLCAvRmlyZWZveFxcLyhbMC05XFwuXSspKD86XFxzfCQpLyBdLFxuICBbICdvcGVyYScsIC9PcGVyYVxcLyhbMC05XFwuXSspKD86XFxzfCQpLyBdLFxuICBbICdpZScsIC9UcmlkZW50XFwvN1xcLjAuKnJ2XFw6KFswLTlcXC5dKylcXCkuKkdlY2tvJC8gXVxuXTtcblxudmFyIG1hdGNoID0gYnJvd3NlcnMubWFwKG1hdGNoKS5maWx0ZXIoaXNNYXRjaClbMF07XG52YXIgcGFydHMgPSBtYXRjaCAmJiBtYXRjaFszXS5zcGxpdCgnLicpLnNsaWNlKDAsMyk7XG5cbndoaWxlIChwYXJ0cy5sZW5ndGggPCAzKSB7XG4gIHBhcnRzLnB1c2goJzAnKTtcbn1cblxuLy8gc2V0IHRoZSBuYW1lIGFuZCB2ZXJzaW9uXG5leHBvcnRzLm5hbWUgPSBtYXRjaCAmJiBtYXRjaFswXTtcbmV4cG9ydHMudmVyc2lvbiA9IHBhcnRzLmpvaW4oJy4nKTtcblxuZnVuY3Rpb24gbWF0Y2gocGFpcikge1xuICByZXR1cm4gcGFpci5jb25jYXQocGFpclsxXS5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQpKTtcbn1cblxuZnVuY3Rpb24gaXNNYXRjaChwYWlyKSB7XG4gIHJldHVybiAhIXBhaXJbMl07XG59XG4iLCJ2YXIgZGV0ZWN0ID0gcmVxdWlyZSgnLi9kZXRlY3QnKTtcbnZhciByZXF1aXJlZEZ1bmN0aW9ucyA9IFtcbiAgJ2luaXQnXG5dO1xuXG5mdW5jdGlvbiBpc1N1cHBvcnRlZChwbHVnaW4pIHtcbiAgcmV0dXJuIHBsdWdpbiAmJiB0eXBlb2YgcGx1Z2luLnN1cHBvcnRlZCA9PSAnZnVuY3Rpb24nICYmIHBsdWdpbi5zdXBwb3J0ZWQoZGV0ZWN0KTtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZChwbHVnaW4pIHtcbiAgdmFyIHN1cHBvcnRlZEZ1bmN0aW9ucyA9IHJlcXVpcmVkRnVuY3Rpb25zLmZpbHRlcihmdW5jdGlvbihmbikge1xuICAgIHJldHVybiB0eXBlb2YgcGx1Z2luW2ZuXSA9PSAnZnVuY3Rpb24nO1xuICB9KTtcblxuICByZXR1cm4gc3VwcG9ydGVkRnVuY3Rpb25zLmxlbmd0aCA9PT0gcmVxdWlyZWRGdW5jdGlvbnMubGVuZ3RoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHBsdWdpbnMpIHtcbiAgcmV0dXJuIFtdLmNvbmNhdChwbHVnaW5zIHx8IFtdKS5maWx0ZXIoaXNTdXBwb3J0ZWQpLmZpbHRlcihpc1ZhbGlkKVswXTtcbn1cbiIsInZhciBleHRlbmQgPSByZXF1aXJlKCdjb2cvZXh0ZW5kJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obWVzc2VuZ2VyLCBvcHRzKSB7XG4gIHJldHVybiByZXF1aXJlKCcuL2luZGV4LmpzJykobWVzc2VuZ2VyLCBleHRlbmQoe1xuICAgIGNvbm5lY3Q6IHJlcXVpcmUoJy4vcHJpbXVzLWxvYWRlcicpXG4gIH0sIG9wdHMpKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gbWVzc2VuZ2VyIGV2ZW50c1xuICBkYXRhRXZlbnQ6ICdkYXRhJyxcbiAgb3BlbkV2ZW50OiAnb3BlbicsXG4gIGNsb3NlRXZlbnQ6ICdjbG9zZScsXG5cbiAgLy8gbWVzc2VuZ2VyIGZ1bmN0aW9uc1xuICB3cml0ZU1ldGhvZDogJ3dyaXRlJyxcbiAgY2xvc2VNZXRob2Q6ICdjbG9zZScsXG5cbiAgLy8gbGVhdmUgdGltZW91dCAobXMpXG4gIGxlYXZlVGltZW91dDogMzAwMFxufTsiLCIvKiBqc2hpbnQgbm9kZTogdHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdjb2cvbG9nZ2VyJykoJ3J0Yy1zaWduYWxsZXInKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdjb2cvZXh0ZW5kJyk7XG52YXIgcm9sZXMgPSBbJ2EnLCAnYiddO1xuXG4vKipcbiAgIyMjIyBhbm5vdW5jZVxuXG4gIGBgYFxuICAvYW5ub3VuY2V8JW1ldGFkYXRhJXx7XCJpZFwiOiBcIi4uLlwiLCAuLi4gfVxuICBgYGBcblxuICBXaGVuIGFuIGFubm91bmNlIG1lc3NhZ2UgaXMgcmVjZWl2ZWQgYnkgdGhlIHNpZ25hbGxlciwgdGhlIGF0dGFjaGVkXG4gIG9iamVjdCBkYXRhIGlzIGRlY29kZWQgYW5kIHRoZSBzaWduYWxsZXIgZW1pdHMgYW4gYGFubm91bmNlYCBtZXNzYWdlLlxuXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2lnbmFsbGVyKSB7XG5cbiAgZnVuY3Rpb24gY29weURhdGEodGFyZ2V0LCBzb3VyY2UpIHtcbiAgICBpZiAodGFyZ2V0ICYmIHNvdXJjZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cblxuICBmdW5jdGlvbiBkYXRhQWxsb3dlZChkYXRhKSB7XG4gICAgdmFyIGV2dCA9IHtcbiAgICAgIGRhdGE6IGRhdGEsXG4gICAgICBhbGxvdzogdHJ1ZVxuICAgIH07XG5cbiAgICBzaWduYWxsZXIuZW1pdCgncGVlcjpmaWx0ZXInLCBldnQpO1xuXG4gICAgcmV0dXJuIGV2dC5hbGxvdztcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihhcmdzLCBtZXNzYWdlVHlwZSwgc3JjRGF0YSwgc3JjU3RhdGUsIGlzRE0pIHtcbiAgICB2YXIgZGF0YSA9IGFyZ3NbMF07XG4gICAgdmFyIHBlZXI7XG5cbiAgICBkZWJ1ZygnYW5ub3VuY2UgaGFuZGxlciBpbnZva2VkLCByZWNlaXZlZCBkYXRhOiAnLCBkYXRhKTtcblxuICAgIC8vIGlmIHdlIGhhdmUgdmFsaWQgZGF0YSB0aGVuIHByb2Nlc3NcbiAgICBpZiAoZGF0YSAmJiBkYXRhLmlkICYmIGRhdGEuaWQgIT09IHNpZ25hbGxlci5pZCkge1xuICAgICAgaWYgKCEgZGF0YUFsbG93ZWQoZGF0YSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHRoaXMgaXMgYSBrbm93biBwZWVyXG4gICAgICBwZWVyID0gc2lnbmFsbGVyLnBlZXJzLmdldChkYXRhLmlkKTtcblxuICAgICAgLy8gdHJpZ2dlciB0aGUgcGVlciBjb25uZWN0ZWQgZXZlbnQgdG8gZmxhZyB0aGF0IHdlIGtub3cgYWJvdXQgYVxuICAgICAgLy8gcGVlciBjb25uZWN0aW9uLiBUaGUgcGVlciBoYXMgcGFzc2VkIHRoZSBcImZpbHRlclwiIGNoZWNrIGJ1dCBtYXlcbiAgICAgIC8vIGJlIGFubm91bmNlZCAvIHVwZGF0ZWQgZGVwZW5kaW5nIG9uIHByZXZpb3VzIGNvbm5lY3Rpb24gc3RhdHVzXG4gICAgICBzaWduYWxsZXIuZW1pdCgncGVlcjpjb25uZWN0ZWQnLCBkYXRhLmlkLCBkYXRhKTtcblxuICAgICAgLy8gaWYgdGhlIHBlZXIgaXMgZXhpc3RpbmcsIHRoZW4gdXBkYXRlIHRoZSBkYXRhXG4gICAgICBpZiAocGVlciAmJiAoISBwZWVyLmluYWN0aXZlKSkge1xuICAgICAgICBkZWJ1Zygnc2lnbmFsbGVyOiAnICsgc2lnbmFsbGVyLmlkICsgJyByZWNlaXZlZCB1cGRhdGUsIGRhdGE6ICcsIGRhdGEpO1xuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZGF0YVxuICAgICAgICBjb3B5RGF0YShwZWVyLmRhdGEsIGRhdGEpO1xuXG4gICAgICAgIC8vIHRyaWdnZXIgdGhlIHBlZXIgdXBkYXRlIGV2ZW50XG4gICAgICAgIHJldHVybiBzaWduYWxsZXIuZW1pdCgncGVlcjp1cGRhdGUnLCBkYXRhLCBzcmNEYXRhKTtcbiAgICAgIH1cblxuICAgICAgLy8gY3JlYXRlIGEgbmV3IHBlZXJcbiAgICAgIHBlZXIgPSB7XG4gICAgICAgIGlkOiBkYXRhLmlkLFxuXG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIGxvY2FsIHJvbGUgaW5kZXhcbiAgICAgICAgcm9sZUlkeDogW2RhdGEuaWQsIHNpZ25hbGxlci5pZF0uc29ydCgpLmluZGV4T2YoZGF0YS5pZCksXG5cbiAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgcGVlciBkYXRhXG4gICAgICAgIGRhdGE6IHt9XG4gICAgICB9O1xuXG4gICAgICAvLyBpbml0aWFsaXNlIHRoZSBwZWVyIGRhdGFcbiAgICAgIGNvcHlEYXRhKHBlZXIuZGF0YSwgZGF0YSk7XG5cbiAgICAgIC8vIHJlc2V0IGluYWN0aXZpdHkgc3RhdGVcbiAgICAgIGNsZWFyVGltZW91dChwZWVyLmxlYXZlVGltZXIpO1xuICAgICAgcGVlci5pbmFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAvLyBzZXQgdGhlIHBlZXIgZGF0YVxuICAgICAgc2lnbmFsbGVyLnBlZXJzLnNldChkYXRhLmlkLCBwZWVyKTtcblxuICAgICAgLy8gaWYgdGhpcyBpcyBhbiBpbml0aWFsIGFubm91bmNlIG1lc3NhZ2UgKG5vIHZlY3RvciBjbG9jayBhdHRhY2hlZClcbiAgICAgIC8vIHRoZW4gc2VuZCBhIGFubm91bmNlIHJlcGx5XG4gICAgICBpZiAoc2lnbmFsbGVyLmF1dG9yZXBseSAmJiAoISBpc0RNKSkge1xuICAgICAgICBzaWduYWxsZXJcbiAgICAgICAgICAudG8oZGF0YS5pZClcbiAgICAgICAgICAuc2VuZCgnL2Fubm91bmNlJywgc2lnbmFsbGVyLmF0dHJpYnV0ZXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IGEgbmV3IHBlZXIgYW5ub3VuY2UgZXZlbnRcbiAgICAgIHJldHVybiBzaWduYWxsZXIuZW1pdCgncGVlcjphbm5vdW5jZScsIGRhdGEsIHBlZXIpO1xuICAgIH1cbiAgfTtcbn07IiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gICMjIyBzaWduYWxsZXIgbWVzc2FnZSBoYW5kbGVyc1xuXG4qKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzaWduYWxsZXIsIG9wdHMpIHtcbiAgcmV0dXJuIHtcbiAgICBhbm5vdW5jZTogcmVxdWlyZSgnLi9hbm5vdW5jZScpKHNpZ25hbGxlciwgb3B0cyksXG4gICAgbGVhdmU6IHJlcXVpcmUoJy4vbGVhdmUnKShzaWduYWxsZXIsIG9wdHMpXG4gIH07XG59OyIsIi8qIGpzaGludCBub2RlOiB0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICAjIyMjIGxlYXZlXG5cbiAgYGBgXG4gIC9sZWF2ZXx7XCJpZFwiOlwiLi4uXCJ9XG4gIGBgYFxuXG4gIFdoZW4gYSBsZWF2ZSBtZXNzYWdlIGlzIHJlY2VpdmVkIGZyb20gYSBwZWVyLCB3ZSBjaGVjayB0byBzZWUgaWYgdGhhdCBpc1xuICBhIHBlZXIgdGhhdCB3ZSBhcmUgbWFuYWdpbmcgc3RhdGUgaW5mb3JtYXRpb24gZm9yIGFuZCBpZiB3ZSBhcmUgdGhlbiB0aGVcbiAgcGVlciBzdGF0ZSBpcyByZW1vdmVkLlxuXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2lnbmFsbGVyLCBvcHRzKSB7XG4gIHJldHVybiBmdW5jdGlvbihhcmdzKSB7XG4gICAgdmFyIGRhdGEgPSBhcmdzWzBdO1xuICAgIHZhciBwZWVyID0gc2lnbmFsbGVyLnBlZXJzLmdldChkYXRhICYmIGRhdGEuaWQpO1xuXG4gICAgaWYgKHBlZXIpIHtcbiAgICAgIC8vIHN0YXJ0IHRoZSBpbmFjdGl2aXR5IHRpbWVyXG4gICAgICBwZWVyLmxlYXZlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwZWVyLmluYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgc2lnbmFsbGVyLmVtaXQoJ3BlZXI6bGVhdmUnLCBkYXRhLmlkLCBwZWVyKTtcbiAgICAgIH0sIG9wdHMubGVhdmVUaW1lb3V0KTtcbiAgICB9XG5cbiAgICAvLyBlbWl0IHRoZSBldmVudFxuICAgIHNpZ25hbGxlci5lbWl0KCdwZWVyOmRpc2Nvbm5lY3RlZCcsIGRhdGEuaWQsIHBlZXIpO1xuICB9O1xufTsiLCIvKiBqc2hpbnQgbm9kZTogdHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdjb2cvbG9nZ2VyJykoJ3J0Yy1zaWduYWxsZXInKTtcbnZhciBkZXRlY3QgPSByZXF1aXJlKCdydGMtY29yZS9kZXRlY3QnKTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdjb2cvZGVmYXVsdHMnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdjb2cvZXh0ZW5kJyk7XG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCdjb2cvdGhyb3R0bGUnKTtcbnZhciBnZXRhYmxlID0gcmVxdWlyZSgnY29nL2dldGFibGUnKTtcbnZhciB1dWlkID0gcmVxdWlyZSgnLi91dWlkJyk7XG5cbi8vIGluaXRpYWxpc2UgdGhlIGxpc3Qgb2YgdmFsaWQgXCJ3cml0ZVwiIG1ldGhvZHNcbnZhciBXUklURV9NRVRIT0RTID0gWyd3cml0ZScsICdzZW5kJ107XG52YXIgQ0xPU0VfTUVUSE9EUyA9IFsnY2xvc2UnLCAnZW5kJ107XG5cbi8vIGluaXRpYWxpc2Ugc2lnbmFsbGVyIG1ldGFkYXRhIHNvIHdlIGRvbid0IGhhdmUgdG8gaW5jbHVkZSB0aGUgcGFja2FnZS5qc29uXG4vLyBUT0RPOiBtYWtlIHRoaXMgY2hlY2thYmxlIHdpdGggc29tZSBraW5kIG9mIHByZXB1Ymxpc2ggc2NyaXB0XG52YXIgbWV0YWRhdGEgPSB7XG4gIHZlcnNpb246ICcyLjMuMCdcbn07XG5cbi8qKlxuICAjIHJ0Yy1zaWduYWxsZXJcblxuICBUaGUgYHJ0Yy1zaWduYWxsZXJgIG1vZHVsZSBwcm92aWRlcyBhIHRyYW5zcG9ydGxlc3Mgc2lnbmFsbGluZ1xuICBtZWNoYW5pc20gZm9yIFdlYlJUQy5cblxuICAjIyBQdXJwb3NlXG5cbiAgPDw8IGRvY3MvcHVycG9zZS5tZFxuXG4gICMjIEdldHRpbmcgU3RhcnRlZFxuXG4gIFdoaWxlIHRoZSBzaWduYWxsZXIgaXMgY2FwYWJsZSBvZiBjb21tdW5pY2F0aW5nIGJ5IGEgbnVtYmVyIG9mIGRpZmZlcmVudFxuICBtZXNzZW5nZXJzIChpLmUuIGFueXRoaW5nIHRoYXQgY2FuIHNlbmQgYW5kIHJlY2VpdmUgbWVzc2FnZXMgb3ZlciBhIHdpcmUpXG4gIGl0IGNvbWVzIHdpdGggc3VwcG9ydCBmb3IgdW5kZXJzdGFuZGluZyBob3cgdG8gY29ubmVjdCB0byBhblxuICBbcnRjLXN3aXRjaGJvYXJkXShodHRwczovL2dpdGh1Yi5jb20vcnRjLWlvL3J0Yy1zd2l0Y2hib2FyZCkgb3V0IG9mIHRoZSBib3guXG5cbiAgVGhlIGZvbGxvd2luZyBjb2RlIHNhbXBsZSBkZW1vbnN0cmF0ZXMgaG93OlxuXG4gIDw8PCBleGFtcGxlcy9nZXR0aW5nLXN0YXJ0ZWQuanNcblxuICA8PDwgZG9jcy9ldmVudHMubWRcblxuICA8PDwgZG9jcy9zaWduYWxmbG93LWRpYWdyYW1zLm1kXG5cbiAgIyMgUmVmZXJlbmNlXG5cbiAgVGhlIGBydGMtc2lnbmFsbGVyYCBtb2R1bGUgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCBwcmltYXJpbHkgaW4gYSBmdW5jdGlvbmFsXG4gIHdheSBhbmQgd2hlbiBjYWxsZWQgaXQgY3JlYXRlcyBhIG5ldyBzaWduYWxsZXIgdGhhdCB3aWxsIGVuYWJsZVxuICB5b3UgdG8gY29tbXVuaWNhdGUgd2l0aCBvdGhlciBwZWVycyB2aWEgeW91ciBtZXNzYWdpbmcgbmV0d29yay5cblxuICBgYGBqc1xuICAvLyBjcmVhdGUgYSBzaWduYWxsZXIgZnJvbSBzb21ldGhpbmcgdGhhdCBrbm93cyBob3cgdG8gc2VuZCBtZXNzYWdlc1xuICB2YXIgc2lnbmFsbGVyID0gcmVxdWlyZSgncnRjLXNpZ25hbGxlcicpKG1lc3Nlbmdlcik7XG4gIGBgYFxuXG4gIEFzIGRlbW9uc3RyYXRlZCBpbiB0aGUgZ2V0dGluZyBzdGFydGVkIGd1aWRlLCB5b3UgY2FuIGFsc28gcGFzcyB0aHJvdWdoXG4gIGEgc3RyaW5nIHZhbHVlIGluc3RlYWQgb2YgYSBtZXNzZW5nZXIgaW5zdGFuY2UgaWYgeW91IHNpbXBseSB3YW50IHRvXG4gIGNvbm5lY3QgdG8gYW4gZXhpc3RpbmcgYHJ0Yy1zd2l0Y2hib2FyZGAgaW5zdGFuY2UuXG5cbioqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtZXNzZW5nZXIsIG9wdHMpIHtcbiAgLy8gZ2V0IHRoZSBhdXRvcmVwbHkgc2V0dGluZ1xuICB2YXIgYXV0b3JlcGx5ID0gKG9wdHMgfHwge30pLmF1dG9yZXBseTtcbiAgdmFyIGNvbm5lY3QgPSAob3B0cyB8fCB7fSkuY29ubmVjdDtcblxuICAvLyBpbml0aWFsaXNlIHRoZSBtZXRhZGF0YVxuICB2YXIgbG9jYWxNZXRhID0ge307XG5cbiAgLy8gY3JlYXRlIHRoZSBzaWduYWxsZXJcbiAgdmFyIHNpZ25hbGxlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAvLyBpbml0aWFsaXNlIHRoZSBpZFxuICB2YXIgaWQgPSBzaWduYWxsZXIuaWQgPSAob3B0cyB8fCB7fSkuaWQgfHwgdXVpZCgpO1xuXG4gIC8vIGluaXRpYWxpc2UgdGhlIGF0dHJpYnV0ZXNcbiAgdmFyIGF0dHJpYnV0ZXMgPSBzaWduYWxsZXIuYXR0cmlidXRlcyA9IHtcbiAgICBicm93c2VyOiBkZXRlY3QuYnJvd3NlcixcbiAgICBicm93c2VyVmVyc2lvbjogZGV0ZWN0LmJyb3dzZXJWZXJzaW9uLFxuICAgIGlkOiBpZCxcbiAgICBhZ2VudDogJ3NpZ25hbGxlckAnICsgbWV0YWRhdGEudmVyc2lvblxuICB9O1xuXG4gIC8vIGNyZWF0ZSB0aGUgcGVlcnMgbWFwXG4gIHZhciBwZWVycyA9IHNpZ25hbGxlci5wZWVycyA9IGdldGFibGUoe30pO1xuXG4gIC8vIGluaXRpYWxpc2UgdGhlIGRhdGEgZXZlbnQgbmFtZVxuXG4gIHZhciBjb25uZWN0ZWQgPSBmYWxzZTtcbiAgdmFyIHdyaXRlO1xuICB2YXIgY2xvc2U7XG4gIHZhciBwcm9jZXNzb3I7XG4gIHZhciBhbm5vdW5jZVRpbWVyID0gMDtcblxuICBmdW5jdGlvbiBhbm5vdW5jZU9uUmVjb25uZWN0KCkge1xuICAgIHNpZ25hbGxlci5hbm5vdW5jZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluZEJyb3dzZXJFdmVudHMoKSB7XG4gICAgbWVzc2VuZ2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihldnQpIHtcbiAgICAgIHByb2Nlc3NvcihldnQuZGF0YSk7XG4gICAgfSk7XG5cbiAgICBtZXNzZW5nZXIuYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgIHNpZ25hbGxlci5lbWl0KCdvcGVuJyk7XG4gICAgICBzaWduYWxsZXIuZW1pdCgnY29ubmVjdGVkJyk7XG4gICAgfSk7XG5cbiAgICBtZXNzZW5nZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCBmdW5jdGlvbihldnQpIHtcbiAgICAgIGNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgc2lnbmFsbGVyLmVtaXQoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluZEV2ZW50cygpIHtcbiAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIGFuIG9uIGZ1bmN0aW9uIGZvciB0aGUgbWVzc2VuZ2VyLCB0aGVuIGRvIG5vdGhpbmdcbiAgICBpZiAodHlwZW9mIG1lc3Nlbmdlci5vbiAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIG1lc3NhZ2UgZGF0YSBldmVudHNcbiAgICBtZXNzZW5nZXIub24ob3B0cy5kYXRhRXZlbnQsIHByb2Nlc3Nvcik7XG5cbiAgICAvLyB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIG9wZW4sIHRoZW4gZW1pdCBhbiBvcGVuIGV2ZW50IGFuZCBhIGNvbm5lY3RlZCBldmVudFxuICAgIG1lc3Nlbmdlci5vbihvcHRzLm9wZW5FdmVudCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgc2lnbmFsbGVyLmVtaXQoJ29wZW4nKTtcbiAgICAgIHNpZ25hbGxlci5lbWl0KCdjb25uZWN0ZWQnKTtcbiAgICB9KTtcblxuICAgIG1lc3Nlbmdlci5vbihvcHRzLmNsb3NlRXZlbnQsIGZ1bmN0aW9uKCkge1xuICAgICAgY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICBzaWduYWxsZXIuZW1pdCgnZGlzY29ubmVjdGVkJyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBjb25uZWN0VG9Ib3N0KHVybCkge1xuICAgIGlmICh0eXBlb2YgY29ubmVjdCAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gc2lnbmFsbGVyLmVtaXQoJ2Vycm9yJywgbmV3IEVycm9yKCdubyBjb25uZWN0IGZ1bmN0aW9uJykpO1xuICAgIH1cblxuICAgIC8vIGxvYWQgcHJpbXVzXG4gICAgY29ubmVjdCh1cmwsIGZ1bmN0aW9uKGVyciwgc29ja2V0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBzaWduYWxsZXIuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgfVxuXG4gICAgICAvLyBjcmVhdGUgdGhlIGFjdHVhbCBtZXNzZW5nZXIgZnJvbSBhIHByaW11cyBjb25uZWN0aW9uXG4gICAgICBzaWduYWxsZXIuX21lc3NlbmdlciA9IG1lc3NlbmdlciA9IHNvY2tldC5jb25uZWN0KHVybCk7XG5cbiAgICAgIC8vIG5vdyBpbml0XG4gICAgICBpbml0KCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVEYXRhTGluZShhcmdzKSB7XG4gICAgcmV0dXJuIGFyZ3MubWFwKHByZXBhcmVBcmcpLmpvaW4oJ3wnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZU1ldGFkYXRhKCkge1xuICAgIHJldHVybiBleHRlbmQoe30sIGxvY2FsTWV0YSwgeyBpZDogc2lnbmFsbGVyLmlkIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdFByb3AobmFtZSkge1xuICAgIHJldHVybiBtZXNzZW5nZXJbbmFtZV07XG4gIH1cblxuICAvLyBhdHRlbXB0IHRvIGRldGVjdCB3aGV0aGVyIHRoZSB1bmRlcmx5aW5nIG1lc3NlbmdlciBpcyBjbG9zaW5nXG4gIC8vIHRoaXMgY2FuIGJlIHRvdWdoIGFzIHdlIGRlYWwgd2l0aCBib3RoIG5hdGl2ZSAob3Igc2ltdWxhdGVkIG5hdGl2ZSlcbiAgLy8gc29ja2V0cyBvciBhbiBhYnN0cmFjdGlvbiBsYXllciBzdWNoIGFzIHByaW11c1xuICBmdW5jdGlvbiBpc0Nsb3NpbmcoKSB7XG4gICAgdmFyIGlzQWJzdHJhY3Rpb24gPSBtZXNzZW5nZXIgJiZcbiAgICAgICAgLy8gYSBwcmltdXMgc29ja2V0IGhhcyBhIHNvY2tldCBhdHRyaWJ1dGVcbiAgICAgICAgdHlwZW9mIG1lc3Nlbmdlci5zb2NrZXQgIT0gJ3VuZGVmaW5lZCc7XG5cbiAgICByZXR1cm4gaXNBYnN0cmFjdGlvbiA/IGZhbHNlIDogKFxuICAgICAgbWVzc2VuZ2VyICYmXG4gICAgICB0eXBlb2YgbWVzc2VuZ2VyLnJlYWR5U3RhdGUgIT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIG1lc3Nlbmdlci5yZWFkeVN0YXRlID49IDJcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNGKHRhcmdldCkge1xuICAgIHJldHVybiB0eXBlb2YgdGFyZ2V0ID09ICdmdW5jdGlvbic7XG4gIH1cblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIC8vIGV4dHJhY3QgdGhlIHdyaXRlIGFuZCBjbG9zZSBmdW5jdGlvbiByZWZlcmVuY2VzXG4gICAgd3JpdGUgPSBbb3B0cy53cml0ZU1ldGhvZF0uY29uY2F0KFdSSVRFX01FVEhPRFMpLm1hcChleHRyYWN0UHJvcCkuZmlsdGVyKGlzRilbMF07XG4gICAgY2xvc2UgPSBbb3B0cy5jbG9zZU1ldGhvZF0uY29uY2F0KENMT1NFX01FVEhPRFMpLm1hcChleHRyYWN0UHJvcCkuZmlsdGVyKGlzRilbMF07XG5cbiAgICAvLyBjcmVhdGUgdGhlIHByb2Nlc3NvclxuICAgIHNpZ25hbGxlci5wcm9jZXNzID0gcHJvY2Vzc29yID0gcmVxdWlyZSgnLi9wcm9jZXNzb3InKShzaWduYWxsZXIsIG9wdHMpO1xuXG4gICAgLy8gaWYgdGhlIG1lc3NlbmdlciBkb2Vzbid0IHByb3ZpZGUgYSB2YWxpZCB3cml0ZSBtZXRob2QsIHRoZW4gY29tcGxhaW5cbiAgICBpZiAodHlwZW9mIHdyaXRlICE9ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncHJvdmlkZWQgbWVzc2VuZ2VyIGRvZXMgbm90IGltcGxlbWVudCBhIFwiJyArXG4gICAgICAgIHdyaXRlTWV0aG9kICsgJ1wiIHdyaXRlIG1ldGhvZCcpO1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBjb3JlIGJyb3dzZXIgbWVzc2VuZ2luZyBhcGlzXG4gICAgaWYgKHR5cGVvZiBtZXNzZW5nZXIuYWRkRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBiaW5kQnJvd3NlckV2ZW50cygpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGJpbmRFdmVudHMoKTtcbiAgICB9XG5cbiAgICAvLyBkZXRlcm1pbmUgaWYgd2UgYXJlIGNvbm5lY3RlZCBvciBub3RcbiAgICBjb25uZWN0ZWQgPSBtZXNzZW5nZXIuY29ubmVjdGVkIHx8IGZhbHNlO1xuICAgIGlmICghIGNvbm5lY3RlZCkge1xuICAgICAgc2lnbmFsbGVyLm9uY2UoJ2Nvbm5lY3RlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBhbHdheXMgYW5ub3VuY2Ugb24gcmVjb25uZWN0XG4gICAgICAgIHNpZ25hbGxlci5vbignY29ubmVjdGVkJywgYW5ub3VuY2VPblJlY29ubmVjdCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBlbWl0IHRoZSBpbml0aWFsaXplZCBldmVudFxuICAgIHNldFRpbWVvdXQoc2lnbmFsbGVyLmVtaXQuYmluZChzaWduYWxsZXIsICdpbml0JyksIDApO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJlcGFyZUFyZyhhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyA9PSAnb2JqZWN0JyAmJiAoISAoYXJnIGluc3RhbmNlb2YgU3RyaW5nKSkpIHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmcpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBhcmc7XG4gIH1cblxuICAvKipcbiAgICAjIyMgc2lnbmFsbGVyI3NlbmQobWVzc2FnZSwgZGF0YSopXG5cbiAgICBVc2UgdGhlIHNlbmQgZnVuY3Rpb24gdG8gc2VuZCBhIG1lc3NhZ2UgdG8gb3RoZXIgcGVlcnMgaW4gdGhlIGN1cnJlbnRcbiAgICBzaWduYWxsaW5nIHNjb3BlIChpZiBhbm5vdW5jZWQgaW4gYSByb29tIHRoaXMgd2lsbCBiZSBhIHJvb20sIG90aGVyd2lzZVxuICAgIGJyb2FkY2FzdCB0byBhbGwgcGVlcnMgY29ubmVjdGVkIHRvIHRoZSBzaWduYWxsaW5nIHNlcnZlcikuXG5cbiAgKiovXG4gIHZhciBzZW5kID0gc2lnbmFsbGVyLnNlbmQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBpdGVyYXRlIG92ZXIgdGhlIGFyZ3VtZW50cyBhbmQgc3RyaW5naWZ5IGFzIHJlcXVpcmVkXG4gICAgLy8gdmFyIG1ldGFkYXRhID0geyBpZDogc2lnbmFsbGVyLmlkIH07XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIGRhdGFsaW5lO1xuXG4gICAgLy8gaW5qZWN0IHRoZSBtZXRhZGF0YVxuICAgIGFyZ3Muc3BsaWNlKDEsIDAsIGNyZWF0ZU1ldGFkYXRhKCkpO1xuICAgIGRhdGFsaW5lID0gY3JlYXRlRGF0YUxpbmUoYXJncyk7XG5cbiAgICAvLyBwZXJmb3JtIGFuIGlzY2xvc2luZyBjaGVja1xuICAgIGlmIChpc0Nsb3NpbmcoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGlmIHdlIGFyZSBub3QgaW5pdGlhbGl6ZWQsIHRoZW4gd2FpdCB1bnRpbCB3ZSBhcmVcbiAgICBpZiAoISBjb25uZWN0ZWQpIHtcbiAgICAgIHJldHVybiBzaWduYWxsZXIub25jZSgnY29ubmVjdGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHdyaXRlLmNhbGwobWVzc2VuZ2VyLCBkYXRhbGluZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBzZW5kIHRoZSBkYXRhIG92ZXIgdGhlIG1lc3NlbmdlclxuICAgIHJldHVybiB3cml0ZS5jYWxsKG1lc3NlbmdlciwgZGF0YWxpbmUpO1xuICB9O1xuXG4gIC8qKlxuICAgICMjIyBhbm5vdW5jZShkYXRhPylcblxuICAgIFRoZSBgYW5ub3VuY2VgIGZ1bmN0aW9uIG9mIHRoZSBzaWduYWxsZXIgd2lsbCBwYXNzIGFuIGAvYW5ub3VuY2VgIG1lc3NhZ2VcbiAgICB0aHJvdWdoIHRoZSBtZXNzZW5nZXIgbmV0d29yay4gIFdoZW4gbm8gYWRkaXRpb25hbCBkYXRhIGlzIHN1cHBsaWVkIHRvXG4gICAgdGhpcyBmdW5jdGlvbiB0aGVuIG9ubHkgdGhlIGlkIG9mIHRoZSBzaWduYWxsZXIgaXMgc2VudCB0byBhbGwgYWN0aXZlXG4gICAgbWVtYmVycyBvZiB0aGUgbWVzc2VuZ2luZyBuZXR3b3JrLlxuXG4gICAgIyMjIyBKb2luaW5nIFJvb21zXG5cbiAgICBUbyBqb2luIGEgcm9vbSB1c2luZyBhbiBhbm5vdW5jZSBjYWxsIHlvdSBzaW1wbHkgcHJvdmlkZSB0aGUgbmFtZSBvZiB0aGVcbiAgICByb29tIHlvdSB3aXNoIHRvIGpvaW4gYXMgcGFydCBvZiB0aGUgZGF0YSBibG9jayB0aGF0IHlvdSBhbm5vdWNlLCBmb3JcbiAgICBleGFtcGxlOlxuXG4gICAgYGBganNcbiAgICBzaWduYWxsZXIuYW5ub3VuY2UoeyByb29tOiAndGVzdHJvb20nIH0pO1xuICAgIGBgYFxuXG4gICAgU2lnbmFsbGluZyBzZXJ2ZXJzIChzdWNoIGFzXG4gICAgW3J0Yy1zd2l0Y2hib2FyZF0oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGMtc3dpdGNoYm9hcmQpKSB3aWxsIHRoZW5cbiAgICBwbGFjZSB5b3VyIHBlZXIgY29ubmVjdGlvbiBpbnRvIGEgcm9vbSB3aXRoIG90aGVyIHBlZXJzIHRoYXQgaGF2ZSBhbHNvXG4gICAgYW5ub3VuY2VkIGluIHRoaXMgcm9vbS5cblxuICAgIE9uY2UgeW91IGhhdmUgam9pbmVkIGEgcm9vbSwgdGhlIHNlcnZlciB3aWxsIG9ubHkgZGVsaXZlciBtZXNzYWdlcyB0aGF0XG4gICAgeW91IGBzZW5kYCB0byBvdGhlciBwZWVycyB3aXRoaW4gdGhhdCByb29tLlxuXG4gICAgIyMjIyBQcm92aWRpbmcgQWRkaXRpb25hbCBBbm5vdW5jZSBEYXRhXG5cbiAgICBUaGVyZSBtYXkgYmUgaW5zdGFuY2VzIHdoZXJlIHlvdSB3aXNoIHRvIHNlbmQgYWRkaXRpb25hbCBkYXRhIGFzIHBhcnQgb2ZcbiAgICB5b3VyIGFubm91bmNlIG1lc3NhZ2UgaW4geW91ciBhcHBsaWNhdGlvbi4gIEZvciBpbnN0YW5jZSwgbWF5YmUgeW91IHdhbnRcbiAgICB0byBzZW5kIGFuIGFsaWFzIG9yIG5pY2sgYXMgcGFydCBvZiB5b3VyIGFubm91bmNlIG1lc3NhZ2UgcmF0aGVyIHRoYW4ganVzdFxuICAgIHVzZSB0aGUgc2lnbmFsbGVyJ3MgZ2VuZXJhdGVkIGlkLlxuXG4gICAgSWYgZm9yIGluc3RhbmNlIHlvdSB3ZXJlIHdyaXRpbmcgYSBzaW1wbGUgY2hhdCBhcHBsaWNhdGlvbiB5b3UgY291bGQgam9pblxuICAgIHRoZSBgd2VicnRjYCByb29tIGFuZCB0ZWxsIGV2ZXJ5b25lIHlvdXIgbmFtZSB3aXRoIHRoZSBmb2xsb3dpbmcgYW5ub3VuY2VcbiAgICBjYWxsOlxuXG4gICAgYGBganNcbiAgICBzaWduYWxsZXIuYW5ub3VuY2Uoe1xuICAgICAgcm9vbTogJ3dlYnJ0YycsXG4gICAgICBuaWNrOiAnRGFtb24nXG4gICAgfSk7XG4gICAgYGBgXG5cbiAgICAjIyMjIEFubm91bmNpbmcgVXBkYXRlc1xuXG4gICAgVGhlIHNpZ25hbGxlciBpcyB3cml0dGVuIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gaW5pdGlhbCBwZWVyIGFubm91bmNlbWVudHNcbiAgICBhbmQgcGVlciBkYXRhIHVwZGF0ZXMgKHNlZSB0aGUgZG9jcyBvbiB0aGUgYW5ub3VuY2UgaGFuZGxlciBiZWxvdykuIEFzXG4gICAgc3VjaCBpdCBpcyBvayB0byBwcm92aWRlIGFueSBkYXRhIHVwZGF0ZXMgdXNpbmcgdGhlIGFubm91bmNlIG1ldGhvZCBhbHNvLlxuXG4gICAgRm9yIGluc3RhbmNlLCBJIGNvdWxkIHNlbmQgYSBzdGF0dXMgdXBkYXRlIGFzIGFuIGFubm91bmNlIG1lc3NhZ2UgdG8gZmxhZ1xuICAgIHRoYXQgSSBhbSBnb2luZyBvZmZsaW5lOlxuXG4gICAgYGBganNcbiAgICBzaWduYWxsZXIuYW5ub3VuY2UoeyBzdGF0dXM6ICdvZmZsaW5lJyB9KTtcbiAgICBgYGBcblxuICAqKi9cbiAgc2lnbmFsbGVyLmFubm91bmNlID0gZnVuY3Rpb24oZGF0YSwgc2VuZGVyKSB7XG4gICAgY2xlYXJUaW1lb3V0KGFubm91bmNlVGltZXIpO1xuXG4gICAgLy8gdXBkYXRlIGludGVybmFsIGF0dHJpYnV0ZXNcbiAgICBleHRlbmQoYXR0cmlidXRlcywgZGF0YSwgeyBpZDogc2lnbmFsbGVyLmlkIH0pO1xuXG4gICAgLy8gaWYgd2UgYXJlIGFscmVhZHkgY29ubmVjdGVkLCB0aGVuIGVuc3VyZSB3ZSBhbm5vdW5jZSBvblxuICAgIC8vIHJlY29ubmVjdFxuICAgIGlmIChjb25uZWN0ZWQpIHtcbiAgICAgIC8vIGFsd2F5cyBhbm5vdW5jZSBvbiByZWNvbm5lY3RcbiAgICAgIHNpZ25hbGxlci5yZW1vdmVMaXN0ZW5lcignY29ubmVjdGVkJywgYW5ub3VuY2VPblJlY29ubmVjdCk7XG4gICAgICBzaWduYWxsZXIub24oJ2Nvbm5lY3RlZCcsIGFubm91bmNlT25SZWNvbm5lY3QpO1xuICAgIH1cblxuICAgIC8vIHNlbmQgdGhlIGF0dHJpYnV0ZXMgb3ZlciB0aGUgbmV0d29ya1xuICAgIHJldHVybiBhbm5vdW5jZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGlmICghIGNvbm5lY3RlZCkge1xuICAgICAgICByZXR1cm4gc2lnbmFsbGVyLm9uY2UoJ2Nvbm5lY3RlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIChzZW5kZXIgfHwgc2VuZCkoJy9hbm5vdW5jZScsIGF0dHJpYnV0ZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgKHNlbmRlciB8fCBzZW5kKSgnL2Fubm91bmNlJywgYXR0cmlidXRlcyk7XG4gICAgfSwgKG9wdHMgfHwge30pLmFubm91bmNlRGVsYXkgfHwgMTApO1xuICB9O1xuXG4gIC8qKlxuICAgICMjIyBpc01hc3Rlcih0YXJnZXRJZClcblxuICAgIEEgc2ltcGxlIGZ1bmN0aW9uIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgdGhlIGxvY2FsIHNpZ25hbGxlciBpcyB0aGUgbWFzdGVyXG4gICAgZm9yIGl0J3MgcmVsYXRpb25zaGlwIHdpdGggcGVlciBzaWduYWxsZXIgaW5kaWNhdGVkIGJ5IGB0YXJnZXRJZGAuICBSb2xlc1xuICAgIGFyZSBkZXRlcm1pbmVkIGF0IHRoZSBwb2ludCBhdCB3aGljaCBzaWduYWxsaW5nIHBlZXJzIGRpc2NvdmVyIGVhY2ggb3RoZXIsXG4gICAgYW5kIGFyZSBzaW1wbHkgd29ya2VkIG91dCBieSB3aGljaGV2ZXIgcGVlciBoYXMgdGhlIGxvd2VzdCBzaWduYWxsZXIgaWRcbiAgICB3aGVuIGxleGlncmFwaGljYWxseSBzb3J0ZWQuXG5cbiAgICBGb3IgZXhhbXBsZSwgaWYgd2UgaGF2ZSB0d28gc2lnbmFsbGVyIHBlZXJzIHRoYXQgaGF2ZSBkaXNjb3ZlcmVkIGVhY2hcbiAgICBvdGhlcnMgd2l0aCB0aGUgZm9sbG93aW5nIGlkczpcblxuICAgIC0gYGIxMWY0ZmQwLWZlYjUtNDQ3Yy04MGM4LWM1MWQ4YzNjY2VkMmBcbiAgICAtIGA4YTA3ZjgyZS00OWE1LTRiOWItYTAyZS00M2Q5MTEzODJiZTZgXG5cbiAgICBUaGV5IHdvdWxkIGJlIGFzc2lnbmVkIHJvbGVzOlxuXG4gICAgLSBgYjExZjRmZDAtZmViNS00NDdjLTgwYzgtYzUxZDhjM2NjZWQyYFxuICAgIC0gYDhhMDdmODJlLTQ5YTUtNGI5Yi1hMDJlLTQzZDkxMTM4MmJlNmAgKG1hc3RlcilcblxuICAqKi9cbiAgc2lnbmFsbGVyLmlzTWFzdGVyID0gZnVuY3Rpb24odGFyZ2V0SWQpIHtcbiAgICB2YXIgcGVlciA9IHBlZXJzLmdldCh0YXJnZXRJZCk7XG5cbiAgICByZXR1cm4gcGVlciAmJiBwZWVyLnJvbGVJZHggIT09IDA7XG4gIH07XG5cbiAgLyoqXG4gICAgIyMjIGxlYXZlKClcblxuICAgIFRlbGwgdGhlIHNpZ25hbGxpbmcgc2VydmVyIHdlIGFyZSBsZWF2aW5nLiAgQ2FsbGluZyB0aGlzIGZ1bmN0aW9uIGlzXG4gICAgdXN1YWxseSBub3QgcmVxdWlyZWQgdGhvdWdoIGFzIHRoZSBzaWduYWxsaW5nIHNlcnZlciBzaG91bGQgaXNzdWUgY29ycmVjdFxuICAgIGAvbGVhdmVgIG1lc3NhZ2VzIHdoZW4gaXQgZGV0ZWN0cyBhIGRpc2Nvbm5lY3QgZXZlbnQuXG5cbiAgKiovXG4gIHNpZ25hbGxlci5sZWF2ZSA9IHNpZ25hbGxlci5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHNlbmQgdGhlIGxlYXZlIHNpZ25hbFxuICAgIHNlbmQoJy9sZWF2ZScsIHsgaWQ6IGlkIH0pO1xuXG4gICAgLy8gc3RvcCBhbm5vdW5jaW5nIG9uIHJlY29ubmVjdFxuICAgIHNpZ25hbGxlci5yZW1vdmVMaXN0ZW5lcignY29ubmVjdGVkJywgYW5ub3VuY2VPblJlY29ubmVjdCk7XG5cbiAgICAvLyBjYWxsIHRoZSBjbG9zZSBtZXRob2RcbiAgICBpZiAodHlwZW9mIGNsb3NlID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNsb3NlLmNhbGwobWVzc2VuZ2VyKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAgIyMjIG1ldGFkYXRhKGRhdGE/KVxuXG4gICAgR2V0IChwYXNzIG5vIGRhdGEpIG9yIHNldCB0aGUgbWV0YWRhdGEgdGhhdCBpcyBwYXNzZWQgdGhyb3VnaCB3aXRoIGVhY2hcbiAgICByZXF1ZXN0IHNlbnQgYnkgdGhlIHNpZ25hbGxlci5cblxuICAgIF9fTk9URTpfXyBSZWdhcmRsZXNzIG9mIHdoYXQgaXMgcGFzc2VkIHRvIHRoaXMgZnVuY3Rpb24sIG1ldGFkYXRhXG4gICAgZ2VuZXJhdGVkIGJ5IHRoZSBzaWduYWxsZXIgd2lsbCAqKmFsd2F5cyoqIGluY2x1ZGUgdGhlIGlkIG9mIHRoZSBzaWduYWxsZXJcbiAgICBhbmQgdGhpcyBjYW5ub3QgYmUgbW9kaWZpZWQuXG4gICoqL1xuICBzaWduYWxsZXIubWV0YWRhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBleHRlbmQoe30sIGxvY2FsTWV0YSk7XG4gICAgfVxuXG4gICAgbG9jYWxNZXRhID0gZXh0ZW5kKHt9LCBkYXRhKTtcbiAgfTtcblxuICAvKipcbiAgICAjIyMgdG8odGFyZ2V0SWQpXG5cbiAgICBVc2UgdGhlIGB0b2AgZnVuY3Rpb24gdG8gc2VuZCBhIG1lc3NhZ2UgdG8gdGhlIHNwZWNpZmllZCB0YXJnZXQgcGVlci5cbiAgICBBIGxhcmdlIHBhcmdlIG9mIG5lZ290aWF0aW5nIGEgV2ViUlRDIHBlZXIgY29ubmVjdGlvbiBpbnZvbHZlcyBkaXJlY3RcbiAgICBjb21tdW5pY2F0aW9uIGJldHdlZW4gdHdvIHBhcnRpZXMgd2hpY2ggbXVzdCBiZSBkb25lIGJ5IHRoZSBzaWduYWxsaW5nXG4gICAgc2VydmVyLiAgVGhlIGB0b2AgZnVuY3Rpb24gcHJvdmlkZXMgYSBzaW1wbGUgd2F5IHRvIHByb3ZpZGUgYSBsb2dpY2FsXG4gICAgY29tbXVuaWNhdGlvbiBjaGFubmVsIGJldHdlZW4gdGhlIHR3byBwYXJ0aWVzOlxuXG4gICAgYGBganNcbiAgICB2YXIgc2VuZCA9IHNpZ25hbGxlci50bygnZTk1ZmEwNWItOTA2Mi00NWM2LWJmYTItNTA1NWJmNjYyNWY0Jykuc2VuZDtcblxuICAgIC8vIGNyZWF0ZSBhbiBvZmZlciBvbiBhIGxvY2FsIHBlZXIgY29ubmVjdGlvblxuICAgIHBjLmNyZWF0ZU9mZmVyKFxuICAgICAgZnVuY3Rpb24oZGVzYykge1xuICAgICAgICAvLyBzZXQgdGhlIGxvY2FsIGRlc2NyaXB0aW9uIHVzaW5nIHRoZSBvZmZlciBzZHBcbiAgICAgICAgLy8gaWYgdGhpcyBvY2N1cnMgc3VjY2Vzc2Z1bGx5IHNlbmQgdGhpcyB0byBvdXIgcGVlclxuICAgICAgICBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKFxuICAgICAgICAgIGRlc2MsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZW5kKCcvc2RwJywgZGVzYyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBoYW5kbGVGYWlsXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgaGFuZGxlRmFpbFxuICAgICk7XG4gICAgYGBgXG5cbiAgKiovXG4gIHNpZ25hbGxlci50byA9IGZ1bmN0aW9uKHRhcmdldElkKSB7XG4gICAgLy8gY3JlYXRlIGEgc2VuZGVyIHRoYXQgd2lsbCBwcmVwZW5kIG1lc3NhZ2VzIHdpdGggL3RvfHRhcmdldElkfFxuICAgIHZhciBzZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIC8vIGdldCB0aGUgcGVlciAoeWVzIHdoZW4gc2VuZCBpcyBjYWxsZWQgdG8gbWFrZSBzdXJlIGl0IGhhc24ndCBsZWZ0KVxuICAgICAgdmFyIHBlZXIgPSBzaWduYWxsZXIucGVlcnMuZ2V0KHRhcmdldElkKTtcbiAgICAgIHZhciBhcmdzO1xuXG4gICAgICBpZiAoISBwZWVyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBwZWVyOiAnICsgdGFyZ2V0SWQpO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgcGVlciBpcyBpbmFjdGl2ZSwgdGhlbiBhYm9ydFxuICAgICAgaWYgKHBlZXIuaW5hY3RpdmUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhcmdzID0gW1xuICAgICAgICAnL3RvJyxcbiAgICAgICAgdGFyZ2V0SWRcbiAgICAgIF0uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG5cbiAgICAgIC8vIGluamVjdCBtZXRhZGF0YVxuICAgICAgYXJncy5zcGxpY2UoMywgMCwgY3JlYXRlTWV0YWRhdGEoKSk7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBjcmVhdGVEYXRhTGluZShhcmdzKTtcbiAgICAgICAgZGVidWcoJ1RYICgnICsgdGFyZ2V0SWQgKyAnKTogJyArIG1zZyk7XG5cbiAgICAgICAgd3JpdGUuY2FsbChtZXNzZW5nZXIsIG1zZyk7XG4gICAgICB9LCAwKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFubm91bmNlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiBzaWduYWxsZXIuYW5ub3VuY2UoZGF0YSwgc2VuZGVyKTtcbiAgICAgIH0sXG5cbiAgICAgIHNlbmQ6IHNlbmRlcixcbiAgICB9XG4gIH07XG5cbiAgLy8gcmVtb3ZlIG1heCBsaXN0ZW5lcnMgZnJvbSB0aGUgZW1pdHRlclxuICBzaWduYWxsZXIuc2V0TWF4TGlzdGVuZXJzKDApO1xuXG4gIC8vIGluaXRpYWxpc2Ugb3B0cyBkZWZhdWx0c1xuICBvcHRzID0gZGVmYXVsdHMoe30sIG9wdHMsIHJlcXVpcmUoJy4vZGVmYXVsdHMnKSk7XG5cbiAgLy8gc2V0IHRoZSBhdXRvcmVwbHkgZmxhZ1xuICBzaWduYWxsZXIuYXV0b3JlcGx5ID0gYXV0b3JlcGx5ID09PSB1bmRlZmluZWQgfHwgYXV0b3JlcGx5O1xuXG4gIC8vIGlmIHRoZSBtZXNzZW5nZXIgaXMgYSBzdHJpbmcsIHRoZW4gd2UgYXJlIGdvaW5nIHRvIGF0dGFjaCB0byBhXG4gIC8vIHdzIGVuZHBvaW50IGFuZCBhdXRvbWF0aWNhbGx5IHNldCB1cCBwcmltdXNcbiAgaWYgKHR5cGVvZiBtZXNzZW5nZXIgPT0gJ3N0cmluZycgfHwgKG1lc3NlbmdlciBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICBjb25uZWN0VG9Ib3N0KG1lc3Nlbmdlcik7XG4gIH1cbiAgLy8gb3RoZXJ3aXNlLCBpbml0aWFsaXNlIHRoZSBjb25uZWN0aW9uXG4gIGVsc2Uge1xuICAgIGluaXQoKTtcbiAgfVxuXG4gIC8vIGNvbm5lY3QgYW4gaW5zdGFuY2Ugb2YgdGhlIG1lc3NlbmdlciB0byB0aGUgc2lnbmFsbGVyXG4gIHNpZ25hbGxlci5fbWVzc2VuZ2VyID0gbWVzc2VuZ2VyO1xuXG4gIC8vIGV4cG9zZSB0aGUgcHJvY2VzcyBhcyBhIHByb2Nlc3MgZnVuY3Rpb25cbiAgc2lnbmFsbGVyLnByb2Nlc3MgPSBwcm9jZXNzb3I7XG5cbiAgcmV0dXJuIHNpZ25hbGxlcjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWluaW1hbCBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHt9O1xufVxuXG4vKipcbiAqIFJldHVybiBhIGxpc3Qgb2YgYXNzaWduZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnRzIHRoYXQgc2hvdWxkIGJlIGxpc3RlZC5cbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50KSB7XG4gIHJldHVybiBBcnJheS5hcHBseSh0aGlzLCB0aGlzLl9ldmVudHNbZXZlbnRdIHx8IFtdKTtcbn07XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJbmRpY2F0aW9uIGlmIHdlJ3ZlIGVtaXR0ZWQgYW4gZXZlbnQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2ZW50XVxuICAgICwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgZm4gPSBsaXN0ZW5lcnNbMF1cbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKDEgPT09IGxlbmd0aCkge1xuICAgIGlmIChmbi5fX0VFM19vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbik7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOlxuICAgICAgICBmbi5jYWxsKGZuLl9fRUUzX2NvbnRleHQgfHwgdGhpcyk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgZm4uY2FsbChmbi5fX0VFM19jb250ZXh0IHx8IHRoaXMsIGExKTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBmbi5jYWxsKGZuLl9fRUUzX2NvbnRleHQgfHwgdGhpcywgYTEsIGEyKTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgICBmbi5jYWxsKGZuLl9fRUUzX2NvbnRleHQgfHwgdGhpcywgYTEsIGEyLCBhMyk7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgZm4uY2FsbChmbi5fX0VFM19jb250ZXh0IHx8IHRoaXMsIGExLCBhMiwgYTMsIGE0KTtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2OlxuICAgICAgICBmbi5jYWxsKGZuLl9fRUUzX2NvbnRleHQgfHwgdGhpcywgYTEsIGEyLCBhMywgYTQsIGE1KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgZm4uYXBwbHkoZm4uX19FRTNfY29udGV4dCB8fCB0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGZuID0gbGlzdGVuZXJzWysraV0pIHtcbiAgICAgIGlmIChmbi5fX0VFM19vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbik7XG4gICAgICBmbi5hcHBseShmbi5fX0VFM19jb250ZXh0IHx8IHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIG5ldyBFdmVudExpc3RlbmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdG9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2ZW50XSkgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IFtdO1xuXG4gIGZuLl9fRUUzX2NvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLl9ldmVudHNbZXZlbnRdLnB1c2goZm4pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gRXZlbnRMaXN0ZW5lciB0aGF0J3Mgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgZm4uX19FRTNfb25jZSA9IHRydWU7XG4gIHJldHVybiB0aGlzLm9uKGV2ZW50LCBmbiwgY29udGV4dCk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4pIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldmVudF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZlbnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZuICYmIGxpc3RlbmVyc1tpXSAhPT0gZm4pIHtcbiAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAvL1xuICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IGV2ZW50cztcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZlbnRdID0gbnVsbDtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb3Igb25seSB0aGUgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2FudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgaWYgKGV2ZW50KSB0aGlzLl9ldmVudHNbZXZlbnRdID0gbnVsbDtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjtcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIzID0gRXZlbnRFbWl0dGVyO1xuXG50cnkgeyBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjsgfVxuY2F0Y2ggKGUpIHt9XG4iLCIvKiBqc2hpbnQgbm9kZTogdHJ1ZSAqL1xuLyogZ2xvYmFsIGRvY3VtZW50LCBsb2NhdGlvbiwgUHJpbXVzOiBmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVUcmFpbGluZ1NsYXNoID0gL1xcLyQvO1xuXG4vKipcbiAgIyMjIGxvYWRQcmltdXMoc2lnbmFsaG9zdCwgY2FsbGJhY2spXG5cbiAgVGhpcyBpcyBhIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgaXMgcGF0Y2hlZCBpbnRvIHRoZSBzaWduYWxsZXIgdG8gYXNzaXN0XG4gIHdpdGggbG9hZGluZyB0aGUgYHByaW11cy5qc2AgY2xpZW50IGxpYnJhcnkgZnJvbSBhbiBgcnRjLXN3aXRjaGJvYXJkYFxuICBzaWduYWxpbmcgc2VydmVyLlxuXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2lnbmFsaG9zdCwgY2FsbGJhY2spIHtcbiAgdmFyIGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgdmFyIHNjcmlwdDtcbiAgdmFyIGJhc2VVcmw7XG4gIHZhciBzY3JpcHRTcmM7XG5cbiAgLy8gaWYgdGhlIHNpZ25hbGhvc3QgaXMgYSBmdW5jdGlvbiwgd2UgYXJlIGluIHNpbmdsZSBhcmcgY2FsbGluZyBtb2RlXG4gIGlmICh0eXBlb2Ygc2lnbmFsaG9zdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBzaWduYWxob3N0O1xuICAgIHNpZ25hbGhvc3QgPSBsb2NhdGlvbi5vcmlnaW47XG4gIH1cblxuICAvLyBpbml0aWFsaXNlIHRoZSBhbmNob3Igd2l0aCB0aGUgc2lnbmFsaG9zdFxuICBhbmNob3IuaHJlZiA9IHNpZ25hbGhvc3Q7XG5cbiAgLy8gcmVhZCB0aGUgYmFzZSBwYXRoXG4gIGJhc2VVcmwgPSBzaWduYWxob3N0LnJlcGxhY2UocmVUcmFpbGluZ1NsYXNoLCAnJyk7XG4gIHNjcmlwdFNyYyA9IGJhc2VVcmwgKyAnL3J0Yy5pby9wcmltdXMuanMnO1xuXG4gIC8vIGxvb2sgZm9yIHRoZSBzY3JpcHQgZmlyc3RcbiAgc2NyaXB0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignc2NyaXB0W3NyYz1cIicgKyBzY3JpcHRTcmMgKyAnXCJdJyk7XG5cbiAgLy8gaWYgd2UgZm91bmQsIHRoZSBzY3JpcHQgdHJpZ2dlciB0aGUgY2FsbGJhY2sgaW1tZWRpYXRlbHlcbiAgaWYgKHNjcmlwdCAmJiB0eXBlb2YgUHJpbXVzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIFByaW11cyk7XG4gIH1cbiAgLy8gb3RoZXJ3aXNlLCBpZiB0aGUgc2NyaXB0IGV4aXN0cyBidXQgUHJpbXVzIGlzIG5vdCBsb2FkZWQsXG4gIC8vIHRoZW4gd2FpdCBmb3IgdGhlIGxvYWRcbiAgZWxzZSBpZiAoc2NyaXB0KSB7XG4gICAgc2NyaXB0LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIFByaW11cyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBvdGhlcndpc2UgY3JlYXRlIHRoZSBzY3JpcHQgYW5kIGxvYWQgcHJpbXVzXG4gIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBzY3JpcHQuc3JjID0gc2NyaXB0U3JjO1xuXG4gIHNjcmlwdC5vbmVycm9yID0gY2FsbGJhY2s7XG4gIHNjcmlwdC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gaWYgd2UgaGF2ZSBhIHNpZ25hbGhvc3QgdGhhdCBpcyBub3QgYmFzZXBhdGhlZCBhdCAvXG4gICAgLy8gdGhlbiB0d2VhayB0aGUgcHJpbXVzIHByb3RvdHlwZVxuICAgIGlmIChhbmNob3IucGF0aG5hbWUgIT09ICcvJykge1xuICAgICAgUHJpbXVzLnByb3RvdHlwZS5wYXRobmFtZSA9IGFuY2hvci5wYXRobmFtZS5yZXBsYWNlKHJlVHJhaWxpbmdTbGFzaCwgJycpICtcbiAgICAgICAgUHJpbXVzLnByb3RvdHlwZS5wYXRobmFtZTtcbiAgICB9XG5cbiAgICBjYWxsYmFjayhudWxsLCBQcmltdXMpO1xuICB9KTtcblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG59O1xuIiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGRlYnVnID0gcmVxdWlyZSgnY29nL2xvZ2dlcicpKCdydGMtc2lnbmFsbGVyJyk7XG52YXIganNvbnBhcnNlID0gcmVxdWlyZSgnY29nL2pzb25wYXJzZScpO1xuXG4vKipcbiAgIyMjIHNpZ25hbGxlciBwcm9jZXNzIGhhbmRsaW5nXG5cbiAgV2hlbiBhIHNpZ25hbGxlcidzIHVuZGVybGluZyBtZXNzZW5nZXIgZW1pdHMgYSBgZGF0YWAgZXZlbnQgdGhpcyBpc1xuICBkZWxlZ2F0ZWQgdG8gYSBzaW1wbGUgbWVzc2FnZSBwYXJzZXIsIHdoaWNoIGFwcGxpZXMgdGhlIGZvbGxvd2luZyBzaW1wbGVcbiAgbG9naWM6XG5cbiAgLSBJcyB0aGUgbWVzc2FnZSBhIGAvdG9gIG1lc3NhZ2UuIElmIHNvLCBzZWUgaWYgdGhlIG1lc3NhZ2UgaXMgZm9yIHRoaXNcbiAgICBzaWduYWxsZXIgKGNoZWNraW5nIHRoZSB0YXJnZXQgaWQgLSAybmQgYXJnKS4gIElmIHNvIHBhc3MgdGhlXG4gICAgcmVtYWluZGVyIG9mIHRoZSBtZXNzYWdlIG9udG8gdGhlIHN0YW5kYXJkIHByb2Nlc3NpbmcgY2hhaW4uICBJZiBub3QsXG4gICAgZGlzY2FyZCB0aGUgbWVzc2FnZS5cblxuICAtIElzIHRoZSBtZXNzYWdlIGEgY29tbWFuZCBtZXNzYWdlIChwcmVmaXhlZCB3aXRoIGEgZm9yd2FyZCBzbGFzaCkuIElmIHNvLFxuICAgIGxvb2sgZm9yIGFuIGFwcHJvcHJpYXRlIG1lc3NhZ2UgaGFuZGxlciBhbmQgcGFzcyB0aGUgbWVzc2FnZSBwYXlsb2FkIG9uXG4gICAgdG8gaXQuXG5cbiAgLSBGaW5hbGx5LCBkb2VzIHRoZSBtZXNzYWdlIG1hdGNoIGFueSBwYXR0ZXJucyB0aGF0IHdlIGFyZSBsaXN0ZW5pbmcgZm9yP1xuICAgIElmIHNvLCB0aGVuIHBhc3MgdGhlIGVudGlyZSBtZXNzYWdlIGNvbnRlbnRzIG9udG8gdGhlIHJlZ2lzdGVyZWQgaGFuZGxlci5cbioqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzaWduYWxsZXIsIG9wdHMpIHtcbiAgdmFyIGhhbmRsZXJzID0gcmVxdWlyZSgnLi9oYW5kbGVycycpKHNpZ25hbGxlciwgb3B0cyk7XG5cbiAgZnVuY3Rpb24gc2VuZEV2ZW50KHBhcnRzLCBzcmNTdGF0ZSwgZGF0YSkge1xuICAgIC8vIGluaXRpYWxpc2UgdGhlIGV2ZW50IG5hbWVcbiAgICB2YXIgZXZ0TmFtZSA9IHBhcnRzWzBdLnNsaWNlKDEpO1xuXG4gICAgLy8gY29udmVydCBhbnkgdmFsaWQganNvbiBvYmplY3RzIHRvIGpzb25cbiAgICB2YXIgYXJncyA9IHBhcnRzLnNsaWNlKDIpLm1hcChqc29ucGFyc2UpO1xuXG4gICAgc2lnbmFsbGVyLmVtaXQuYXBwbHkoXG4gICAgICBzaWduYWxsZXIsXG4gICAgICBbZXZ0TmFtZV0uY29uY2F0KGFyZ3MpLmNvbmNhdChbc3JjU3RhdGUsIGRhdGFdKVxuICAgICk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24ob3JpZ2luYWxEYXRhKSB7XG4gICAgdmFyIGRhdGEgPSBvcmlnaW5hbERhdGE7XG4gICAgdmFyIGlzTWF0Y2ggPSB0cnVlO1xuICAgIHZhciBwYXJ0cztcbiAgICB2YXIgaGFuZGxlcjtcbiAgICB2YXIgc3JjRGF0YTtcbiAgICB2YXIgc3JjU3RhdGU7XG4gICAgdmFyIGlzRGlyZWN0TWVzc2FnZSA9IGZhbHNlO1xuXG4gICAgLy8gZm9yY2UgdGhlIGlkIGludG8gc3RyaW5nIGZvcm1hdCBzbyB3ZSBjYW4gcnVuIGxlbmd0aCBhbmQgY29tcGFyaXNvbiB0ZXN0cyBvbiBpdFxuICAgIHZhciBpZCA9IHNpZ25hbGxlci5pZCArICcnO1xuICAgIGRlYnVnKCdzaWduYWxsZXIgJyArIGlkICsgJyByZWNlaXZlZCBkYXRhOiAnICsgb3JpZ2luYWxEYXRhKTtcblxuICAgIC8vIHByb2Nlc3MgL3RvIG1lc3NhZ2VzXG4gICAgaWYgKGRhdGEuc2xpY2UoMCwgMykgPT09ICcvdG8nKSB7XG4gICAgICBpc01hdGNoID0gZGF0YS5zbGljZSg0LCBpZC5sZW5ndGggKyA0KSA9PT0gaWQ7XG4gICAgICBpZiAoaXNNYXRjaCkge1xuICAgICAgICBwYXJ0cyA9IGRhdGEuc2xpY2UoNSArIGlkLmxlbmd0aCkuc3BsaXQoJ3wnKS5tYXAoanNvbnBhcnNlKTtcblxuICAgICAgICAvLyBnZXQgdGhlIHNvdXJjZSBkYXRhXG4gICAgICAgIGlzRGlyZWN0TWVzc2FnZSA9IHRydWU7XG5cbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgdmVjdG9yIGNsb2NrIGFuZCB1cGRhdGUgdGhlIHBhcnRzXG4gICAgICAgIHBhcnRzID0gcGFydHMubWFwKGpzb25wYXJzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgdGhpcyBpcyBub3QgYSBtYXRjaCwgdGhlbiBiYWlsXG4gICAgaWYgKCEgaXNNYXRjaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGNob3AgdGhlIGRhdGEgaW50byBwYXJ0c1xuICAgIHBhcnRzID0gcGFydHMgfHwgZGF0YS5zcGxpdCgnfCcpLm1hcChqc29ucGFyc2UpO1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBhIHNwZWNpZmljIGhhbmRsZXIgZm9yIHRoZSBhY3Rpb24sIHRoZW4gaW52b2tlXG4gICAgaWYgKHR5cGVvZiBwYXJ0c1swXSA9PSAnc3RyaW5nJykge1xuICAgICAgLy8gZXh0cmFjdCB0aGUgbWV0YWRhdGEgZnJvbSB0aGUgaW5wdXQgZGF0YVxuICAgICAgc3JjRGF0YSA9IHBhcnRzWzFdO1xuXG4gICAgICAvLyBpZiB3ZSBnb3QgZGF0YSBmcm9tIG91cnNlbGYsIHRoZW4gdGhpcyBpcyBwcmV0dHkgZHVtYlxuICAgICAgLy8gYnV0IGlmIHdlIGhhdmUgdGhlbiB0aHJvdyBpdCBhd2F5XG4gICAgICBpZiAoc3JjRGF0YSAmJiBzcmNEYXRhLmlkID09PSBzaWduYWxsZXIuaWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybignZ290IGRhdGEgZnJvbSBvdXJzZWxmLCBkaXNjYXJkaW5nJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIGdldCB0aGUgc291cmNlIHN0YXRlXG4gICAgICBzcmNTdGF0ZSA9IHNpZ25hbGxlci5wZWVycy5nZXQoc3JjRGF0YSAmJiBzcmNEYXRhLmlkKSB8fCBzcmNEYXRhO1xuXG4gICAgICAvLyBoYW5kbGUgY29tbWFuZHNcbiAgICAgIGlmIChwYXJ0c1swXS5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgICAgICAvLyBsb29rIGZvciBhIGhhbmRsZXIgZm9yIHRoZSBtZXNzYWdlIHR5cGVcbiAgICAgICAgaGFuZGxlciA9IGhhbmRsZXJzW3BhcnRzWzBdLnNsaWNlKDEpXTtcblxuICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGhhbmRsZXIoXG4gICAgICAgICAgICBwYXJ0cy5zbGljZSgyKSxcbiAgICAgICAgICAgIHBhcnRzWzBdLnNsaWNlKDEpLFxuICAgICAgICAgICAgc3JjRGF0YSxcbiAgICAgICAgICAgIHNyY1N0YXRlLFxuICAgICAgICAgICAgaXNEaXJlY3RNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBzZW5kRXZlbnQocGFydHMsIHNyY1N0YXRlLCBvcmlnaW5hbERhdGEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBvdGhlcndpc2UsIGVtaXQgZGF0YVxuICAgICAgZWxzZSB7XG4gICAgICAgIHNpZ25hbGxlci5lbWl0KFxuICAgICAgICAgICdkYXRhJyxcbiAgICAgICAgICBwYXJ0cy5zbGljZSgwLCAxKS5jb25jYXQocGFydHMuc2xpY2UoMikpLFxuICAgICAgICAgIHNyY0RhdGEsXG4gICAgICAgICAgc3JjU3RhdGUsXG4gICAgICAgICAgaXNEaXJlY3RNZXNzYWdlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufTtcbiIsIi8vIExldmVyT25lJ3MgYXdlc29tZSB1dWlkIGdlbmVyYXRvclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhLGIpe2ZvcihiPWE9Jyc7YSsrPDM2O2IrPWEqNTEmNTI/KGFeMTU/OF5NYXRoLnJhbmRvbSgpKihhXjIwPzE2OjQpOjQpLnRvU3RyaW5nKDE2KTonLScpO3JldHVybiBifTtcbiIsIi8qIGpzaGludCBub2RlOiB0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2NvZy9sb2dnZXInKSgncnRjL2NsZWFudXAnKTtcblxudmFyIENBTk5PVF9DTE9TRV9TVEFURVMgPSBbXG4gICdjbG9zZWQnXG5dO1xuXG52YXIgRVZFTlROQU1FUyA9IFtcbiAgJ2FkZHN0cmVhbScsXG4gICdkYXRhY2hhbm5lbCcsXG4gICdpY2VjYW5kaWRhdGUnLFxuICAnaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlJyxcbiAgJ25lZ290aWF0aW9ubmVlZGVkJyxcbiAgJ3JlbW92ZXN0cmVhbScsXG4gICdzaWduYWxpbmdzdGF0ZWNoYW5nZSdcbl07XG5cbi8qKlxuICAjIyMgcnRjLXRvb2xzL2NsZWFudXBcblxuICBgYGBcbiAgY2xlYW51cChwYylcbiAgYGBgXG5cbiAgVGhlIGBjbGVhbnVwYCBmdW5jdGlvbiBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IGEgcGVlciBjb25uZWN0aW9uIGlzIHByb3Blcmx5XG4gIGNsb3NlZCBhbmQgcmVhZHkgdG8gYmUgY2xlYW5lZCB1cCBieSB0aGUgYnJvd3Nlci5cblxuKiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHBjKSB7XG4gIC8vIHNlZSBpZiB3ZSBjYW4gY2xvc2UgdGhlIGNvbm5lY3Rpb25cbiAgdmFyIGN1cnJlbnRTdGF0ZSA9IHBjLmljZUNvbm5lY3Rpb25TdGF0ZTtcbiAgdmFyIGNhbkNsb3NlID0gQ0FOTk9UX0NMT1NFX1NUQVRFUy5pbmRleE9mKGN1cnJlbnRTdGF0ZSkgPCAwO1xuXG4gIGlmIChjYW5DbG9zZSkge1xuICAgIGRlYnVnKCdhdHRlbXB0aW5nIGNvbm5lY3Rpb24gY2xvc2UsIGN1cnJlbnQgc3RhdGU6ICcrIHBjLmljZUNvbm5lY3Rpb25TdGF0ZSk7XG4gICAgcGMuY2xvc2UoKTtcbiAgfVxuXG4gIC8vIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gIC8vIGFmdGVyIGEgc2hvcnQgZGVsYXkgZ2l2aW5nIHRoZSBjb25uZWN0aW9uIHRpbWUgdG8gdHJpZ2dlclxuICAvLyBjbG9zZSBhbmQgaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlIGV2ZW50c1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIEVWRU5UTkFNRVMuZm9yRWFjaChmdW5jdGlvbihldnROYW1lKSB7XG4gICAgICBpZiAocGNbJ29uJyArIGV2dE5hbWVdKSB7XG4gICAgICAgIHBjWydvbicgKyBldnROYW1lXSA9IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sIDEwMCk7XG59O1xuIiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKTtcbnZhciBjbGVhbnVwID0gcmVxdWlyZSgnLi9jbGVhbnVwJyk7XG52YXIgbW9uaXRvciA9IHJlcXVpcmUoJy4vbW9uaXRvcicpO1xudmFyIGRldGVjdCA9IHJlcXVpcmUoJy4vZGV0ZWN0Jyk7XG52YXIgZmluZFBsdWdpbiA9IHJlcXVpcmUoJ3J0Yy1jb3JlL3BsdWdpbicpO1xudmFyIENMT1NFRF9TVEFURVMgPSBbICdjbG9zZWQnLCAnZmFpbGVkJyBdO1xuXG4vLyB0cmFjayB0aGUgdmFyaW91cyBzdXBwb3J0ZWQgQ3JlYXRlT2ZmZXIgLyBDcmVhdGVBbnN3ZXIgY29udHJhaW50c1xuLy8gdGhhdCB3ZSByZWNvZ25pemUgYW5kIGFsbG93XG52YXIgT0ZGRVJfQU5TV0VSX0NPTlNUUkFJTlRTID0gW1xuICAnb2ZmZXJUb1JlY2VpdmVWaWRlbycsXG4gICdvZmZlclRvUmVjZWl2ZUF1ZGlvJyxcbiAgJ3ZvaWNlQWN0aXZpdHlEZXRlY3Rpb24nLFxuICAnaWNlUmVzdGFydCdcbl07XG5cbi8qKlxuICAjIyMgcnRjLXRvb2xzL2NvdXBsZVxuXG4gICMjIyMgY291cGxlKHBjLCB0YXJnZXRJZCwgc2lnbmFsbGVyLCBvcHRzPylcblxuICBDb3VwbGUgYSBXZWJSVEMgY29ubmVjdGlvbiB3aXRoIGFub3RoZXIgd2VicnRjIGNvbm5lY3Rpb24gaWRlbnRpZmllZCBieVxuICBgdGFyZ2V0SWRgIHZpYSB0aGUgc2lnbmFsbGVyLlxuXG4gIFRoZSBmb2xsb3dpbmcgb3B0aW9ucyBjYW4gYmUgcHJvdmlkZWQgaW4gdGhlIGBvcHRzYCBhcmd1bWVudDpcblxuICAtIGBzZHBmaWx0ZXJgIChkZWZhdWx0OiBudWxsKVxuXG4gICAgQSBzaW1wbGUgZnVuY3Rpb24gZm9yIGZpbHRlcmluZyBTRFAgYXMgcGFydCBvZiB0aGUgcGVlclxuICAgIGNvbm5lY3Rpb24gaGFuZHNoYWtlIChzZWUgdGhlIFVzaW5nIEZpbHRlcnMgZGV0YWlscyBiZWxvdykuXG5cbiAgIyMjIyMgRXhhbXBsZSBVc2FnZVxuXG4gIGBgYGpzXG4gIHZhciBjb3VwbGUgPSByZXF1aXJlKCdydGMvY291cGxlJyk7XG5cbiAgY291cGxlKHBjLCAnNTQ4Nzk5NjUtY2U0My00MjZlLWE4ZWYtMDlhYzFlMzlhMTZkJywgc2lnbmFsbGVyKTtcbiAgYGBgXG5cbiAgIyMjIyMgVXNpbmcgRmlsdGVyc1xuXG4gIEluIGNlcnRhaW4gaW5zdGFuY2VzIHlvdSBtYXkgd2lzaCB0byBtb2RpZnkgdGhlIHJhdyBTRFAgdGhhdCBpcyBwcm92aWRlZFxuICBieSB0aGUgYGNyZWF0ZU9mZmVyYCBhbmQgYGNyZWF0ZUFuc3dlcmAgY2FsbHMuICBUaGlzIGNhbiBiZSBkb25lIGJ5IHBhc3NpbmdcbiAgYSBgc2RwZmlsdGVyYCBmdW5jdGlvbiAob3IgYXJyYXkpIGluIHRoZSBvcHRpb25zLiAgRm9yIGV4YW1wbGU6XG5cbiAgYGBganNcbiAgLy8gcnVuIHRoZSBzZHAgZnJvbSB0aHJvdWdoIGEgbG9jYWwgdHdlYWtTZHAgZnVuY3Rpb24uXG4gIGNvdXBsZShwYywgJzU0ODc5OTY1LWNlNDMtNDI2ZS1hOGVmLTA5YWMxZTM5YTE2ZCcsIHNpZ25hbGxlciwge1xuICAgIHNkcGZpbHRlcjogdHdlYWtTZHBcbiAgfSk7XG4gIGBgYFxuXG4qKi9cbmZ1bmN0aW9uIGNvdXBsZShwYywgdGFyZ2V0SWQsIHNpZ25hbGxlciwgb3B0cykge1xuICB2YXIgZGVidWdMYWJlbCA9IChvcHRzIHx8IHt9KS5kZWJ1Z0xhYmVsIHx8ICdydGMnO1xuICB2YXIgZGVidWcgPSByZXF1aXJlKCdjb2cvbG9nZ2VyJykoZGVidWdMYWJlbCArICcvY291cGxlJyk7XG5cbiAgLy8gY3JlYXRlIGEgbW9uaXRvciBmb3IgdGhlIGNvbm5lY3Rpb25cbiAgdmFyIG1vbiA9IG1vbml0b3IocGMsIHRhcmdldElkLCBzaWduYWxsZXIsIG9wdHMpO1xuICB2YXIgcXVldWVkQ2FuZGlkYXRlcyA9IFtdO1xuICB2YXIgc2RwRmlsdGVyID0gKG9wdHMgfHwge30pLnNkcGZpbHRlcjtcbiAgdmFyIHJlYWN0aXZlID0gKG9wdHMgfHwge30pLnJlYWN0aXZlO1xuICB2YXIgb2ZmZXJUaW1lb3V0O1xuICB2YXIgZW5kT2ZDYW5kaWRhdGVzID0gdHJ1ZTtcbiAgdmFyIHBsdWdpbiA9IGZpbmRQbHVnaW4oKG9wdHMgfHwge30pLnBsdWdpbnMpO1xuXG4gIC8vIGNvbmZpZ3VyZSB0aGUgdGltZSB0byB3YWl0IGJldHdlZW4gcmVjZWl2aW5nIGEgJ2Rpc2Nvbm5lY3QnXG4gIC8vIGljZUNvbm5lY3Rpb25TdGF0ZSBhbmQgZGV0ZXJtaW5pbmcgdGhhdCB3ZSBhcmUgY2xvc2VkXG4gIHZhciBkaXNjb25uZWN0VGltZW91dCA9IChvcHRzIHx8IHt9KS5kaXNjb25uZWN0VGltZW91dCB8fCAxMDAwMDtcbiAgdmFyIGRpc2Nvbm5lY3RUaW1lcjtcblxuICAvLyBpZiB0aGUgc2lnbmFsbGVyIGRvZXMgbm90IHN1cHBvcnQgdGhpcyBpc01hc3RlciBmdW5jdGlvbiB0aHJvdyBhblxuICAvLyBleGNlcHRpb25cbiAgaWYgKHR5cGVvZiBzaWduYWxsZXIuaXNNYXN0ZXIgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcigncnRjLXNpZ25hbGxlciBpbnN0YW5jZSA+PSAwLjE0LjAgcmVxdWlyZWQnKTtcbiAgfVxuXG4gIC8vIGluaXRpbGFpc2UgdGhlIG5lZ290aWF0aW9uIGhlbHBlcnNcbiAgdmFyIGlzTWFzdGVyID0gc2lnbmFsbGVyLmlzTWFzdGVyKHRhcmdldElkKTtcblxuICB2YXIgY3JlYXRlT2ZmZXIgPSBwcmVwTmVnb3RpYXRlKFxuICAgICdjcmVhdGVPZmZlcicsXG4gICAgaXNNYXN0ZXIsXG4gICAgWyBjaGVja1N0YWJsZSBdXG4gICk7XG5cbiAgdmFyIGNyZWF0ZUFuc3dlciA9IHByZXBOZWdvdGlhdGUoXG4gICAgJ2NyZWF0ZUFuc3dlcicsXG4gICAgdHJ1ZSxcbiAgICBbXVxuICApO1xuXG4gIC8vIGluaXRpYWxpc2UgdGhlIHByb2Nlc3NpbmcgcXVldWUgKG9uZSBhdCBhIHRpbWUgcGxlYXNlKVxuICB2YXIgcSA9IGFzeW5jLnF1ZXVlKGZ1bmN0aW9uKHRhc2ssIGNiKSB7XG4gICAgLy8gaWYgdGhlIHRhc2sgaGFzIG5vIG9wZXJhdGlvbiwgdGhlbiB0cmlnZ2VyIHRoZSBjYWxsYmFjayBpbW1lZGlhdGVseVxuICAgIGlmICh0eXBlb2YgdGFzay5vcCAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gY2IoKTtcbiAgICB9XG5cbiAgICAvLyBwcm9jZXNzIHRoZSB0YXNrIG9wZXJhdGlvblxuICAgIHRhc2sub3AodGFzaywgY2IpO1xuICB9LCAxKTtcblxuICAvLyBpbml0aWFsaXNlIHNlc3Npb24gZGVzY3JpcHRpb24gYW5kIGljZWNhbmRpZGF0ZSBvYmplY3RzXG4gIHZhciBSVENTZXNzaW9uRGVzY3JpcHRpb24gPSAob3B0cyB8fCB7fSkuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gICAgZGV0ZWN0KCdSVENTZXNzaW9uRGVzY3JpcHRpb24nKTtcblxuICB2YXIgUlRDSWNlQ2FuZGlkYXRlID0gKG9wdHMgfHwge30pLlJUQ0ljZUNhbmRpZGF0ZSB8fFxuICAgIGRldGVjdCgnUlRDSWNlQ2FuZGlkYXRlJyk7XG5cbiAgZnVuY3Rpb24gYWJvcnQoc3RhZ2UsIHNkcCwgY2IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXJyKSB7XG4gICAgICAvLyBsb2cgdGhlIGVycm9yXG4gICAgICBjb25zb2xlLmVycm9yKCdydGMvY291cGxlIGVycm9yICgnICsgc3RhZ2UgKyAnKTogJywgZXJyKTtcblxuICAgICAgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5Q2FuZGlkYXRlc1doZW5TdGFibGUoKSB7XG4gICAgaWYgKHBjLnNpZ25hbGluZ1N0YXRlID09ICdzdGFibGUnICYmIHBjLnJlbW90ZURlc2NyaXB0aW9uKSB7XG4gICAgICBkZWJ1Zygnc2lnbmFsaW5nIHN0YXRlID0gc3RhYmxlLCBhcHBseWluZyBxdWV1ZWQgY2FuZGlkYXRlcycpO1xuICAgICAgbW9uLnJlbW92ZUxpc3RlbmVyKCdjaGFuZ2UnLCBhcHBseUNhbmRpZGF0ZXNXaGVuU3RhYmxlKTtcblxuICAgICAgLy8gYXBwbHkgYW55IHF1ZXVlZCBjYW5kaWRhdGVzXG4gICAgICBxdWV1ZWRDYW5kaWRhdGVzLnNwbGljZSgwKS5mb3JFYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZGVidWcoJ2FwcGx5aW5nIHF1ZXVlZCBjYW5kaWRhdGUnLCBkYXRhKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHBjLmFkZEljZUNhbmRpZGF0ZShjcmVhdGVJY2VDYW5kaWRhdGUoZGF0YSkpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgZGVidWcoJ2ludmFsaWRhdGUgY2FuZGlkYXRlIHNwZWNpZmllZDogJywgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNoZWNrTm90Q29ubmVjdGluZyhuZWdvdGlhdGUpIHtcbiAgICBpZiAocGMuaWNlQ29ubmVjdGlvblN0YXRlICE9ICdjaGVja2luZycpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGRlYnVnKCdjb25uZWN0aW9uIHN0YXRlIGlzIGNoZWNraW5nLCB3aWxsIHdhaXQgdG8gY3JlYXRlIGEgbmV3IG9mZmVyJyk7XG4gICAgbW9uLm9uY2UoJ2Nvbm5lY3RlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgcS5wdXNoKHsgb3A6IG5lZ290aWF0ZSB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoZWNrU3RhYmxlKG5lZ290aWF0ZSkge1xuICAgIGlmIChwYy5zaWduYWxpbmdTdGF0ZSA9PT0gJ3N0YWJsZScpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGRlYnVnKCdjYW5ub3QgY3JlYXRlIG9mZmVyLCBzaWduYWxpbmcgc3RhdGUgIT0gc3RhYmxlLCB3aWxsIHJldHJ5Jyk7XG4gICAgbW9uLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiB3YWl0Rm9yU3RhYmxlKCkge1xuICAgICAgaWYgKHBjLnNpZ25hbGluZ1N0YXRlID09PSAnc3RhYmxlJykge1xuICAgICAgICBxLnB1c2goeyBvcDogbmVnb3RpYXRlIH0pO1xuICAgICAgfVxuXG4gICAgICBtb24ucmVtb3ZlTGlzdGVuZXIoJ2NoYW5nZScsIHdhaXRGb3JTdGFibGUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlSWNlQ2FuZGlkYXRlKGRhdGEpIHtcbiAgICBpZiAocGx1Z2luICYmIHR5cGVvZiBwbHVnaW4uY3JlYXRlSWNlQ2FuZGlkYXRlID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBwbHVnaW4uY3JlYXRlSWNlQ2FuZGlkYXRlKGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUlRDSWNlQ2FuZGlkYXRlKGRhdGEpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU2Vzc2lvbkRlc2NyaXB0aW9uKGRhdGEpIHtcbiAgICBpZiAocGx1Z2luICYmIHR5cGVvZiBwbHVnaW4uY3JlYXRlU2Vzc2lvbkRlc2NyaXB0aW9uID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBwbHVnaW4uY3JlYXRlU2Vzc2lvbkRlc2NyaXB0aW9uKGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKGRhdGEpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVjb3VwbGUoKSB7XG4gICAgZGVidWcoJ2RlY291cGxpbmcgJyArIHNpZ25hbGxlci5pZCArICcgZnJvbSAnICsgdGFyZ2V0SWQpO1xuXG4gICAgLy8gc3RvcCB0aGUgbW9uaXRvclxuICAgIG1vbi5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICBtb24uc3RvcCgpO1xuXG4gICAgLy8gY2xlYW51cCB0aGUgcGVlcmNvbm5lY3Rpb25cbiAgICBjbGVhbnVwKHBjKTtcblxuICAgIC8vIHJlbW92ZSBsaXN0ZW5lcnNcbiAgICBzaWduYWxsZXIucmVtb3ZlTGlzdGVuZXIoJ3NkcCcsIGhhbmRsZVNkcCk7XG4gICAgc2lnbmFsbGVyLnJlbW92ZUxpc3RlbmVyKCdjYW5kaWRhdGUnLCBoYW5kbGVSZW1vdGVDYW5kaWRhdGUpO1xuICAgIHNpZ25hbGxlci5yZW1vdmVMaXN0ZW5lcignbmVnb3RpYXRlJywgaGFuZGxlTmVnb3RpYXRlUmVxdWVzdCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmF0ZUNvbnN0cmFpbnRzKG1ldGhvZE5hbWUpIHtcbiAgICB2YXIgY29uc3RyYWludHMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIHJlZm9ybWF0Q29uc3RyYWludHMoKSB7XG4gICAgICB2YXIgdHdlYWtlZCA9IHt9O1xuXG4gICAgICBPYmplY3Qua2V5cyhjb25zdHJhaW50cykuZm9yRWFjaChmdW5jdGlvbihwYXJhbSkge1xuICAgICAgICB2YXIgc2VudGVuY2VkQ2FzZWQgPSBwYXJhbS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHBhcmFtLnN1YnN0cigxKTtcbiAgICAgICAgdHdlYWtlZFtzZW50ZW5jZWRDYXNlZF0gPSBjb25zdHJhaW50c1twYXJhbV07XG4gICAgICB9KTtcblxuICAgICAgLy8gdXBkYXRlIHRoZSBjb25zdHJhaW50cyB0byBtYXRjaCB0aGUgZXhwZWN0ZWQgZm9ybWF0XG4gICAgICBjb25zdHJhaW50cyA9IHtcbiAgICAgICAgbWFuZGF0b3J5OiB0d2Vha2VkXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFRPRE86IGN1c3RvbWl6ZSBiZWhhdmlvdXIgYmFzZWQgb24gb2ZmZXIgdnMgYW5zd2VyXG5cbiAgICAvLyBwdWxsIG91dCBhbnkgdmFsaWRcbiAgICBPRkZFUl9BTlNXRVJfQ09OU1RSQUlOVFMuZm9yRWFjaChmdW5jdGlvbihwYXJhbSkge1xuICAgICAgdmFyIHNlbnRlbmNlZENhc2VkID0gcGFyYW0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwYXJhbS5zdWJzdHIoMSk7XG5cbiAgICAgIC8vIGlmIHdlIGhhdmUgbm8gb3B0cywgZG8gbm90aGluZ1xuICAgICAgaWYgKCEgb3B0cykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBpZiB0aGUgcGFyYW1ldGVyIGhhcyBiZWVuIGRlZmluZWQsIHRoZW4gYWRkIGl0IHRvIHRoZSBjb25zdHJhaW50c1xuICAgICAgZWxzZSBpZiAob3B0c1twYXJhbV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdHJhaW50c1twYXJhbV0gPSBvcHRzW3BhcmFtXTtcbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBzZW50ZW5jZWQgY2FzZWQgdmVyc2lvbiBoYXMgYmVlbiBhZGRlZCwgdGhlbiB1c2UgdGhhdFxuICAgICAgZWxzZSBpZiAob3B0c1tzZW50ZW5jZWRDYXNlZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdHJhaW50c1twYXJhbV0gPSBvcHRzW3NlbnRlbmNlZENhc2VkXTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRPRE86IG9ubHkgZG8gdGhpcyBmb3IgdGhlIG9sZGVyIGJyb3dzZXJzIHRoYXQgcmVxdWlyZSBpdFxuICAgIHJlZm9ybWF0Q29uc3RyYWludHMoKTtcblxuICAgIHJldHVybiBjb25zdHJhaW50cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHByZXBOZWdvdGlhdGUobWV0aG9kTmFtZSwgYWxsb3dlZCwgcHJlZmxpZ2h0Q2hlY2tzKSB7XG4gICAgdmFyIGNvbnN0cmFpbnRzID0gZ2VuZXJhdGVDb25zdHJhaW50cyhtZXRob2ROYW1lKTtcblxuICAgIC8vIGVuc3VyZSB3ZSBoYXZlIGEgdmFsaWQgcHJlZmxpZ2h0Q2hlY2tzIGFycmF5XG4gICAgcHJlZmxpZ2h0Q2hlY2tzID0gW10uY29uY2F0KHByZWZsaWdodENoZWNrcyB8fCBbXSk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmVnb3RpYXRlKHRhc2ssIGNiKSB7XG4gICAgICB2YXIgY2hlY2tzT0sgPSB0cnVlO1xuXG4gICAgICAvLyBpZiB0aGUgdGFzayBpcyBub3QgYWxsb3dlZCwgdGhlbiBzZW5kIGEgbmVnb3RpYXRlIHJlcXVlc3QgdG8gb3VyXG4gICAgICAvLyBwZWVyXG4gICAgICBpZiAoISBhbGxvd2VkKSB7XG4gICAgICAgIHNpZ25hbGxlci50byh0YXJnZXRJZCkuc2VuZCgnL25lZ290aWF0ZScpO1xuICAgICAgICByZXR1cm4gY2IoKTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYgdGhlIGNvbm5lY3Rpb24gaXMgY2xvc2VkLCB0aGVuIGFib3J0XG4gICAgICBpZiAoaXNDbG9zZWQoKSkge1xuICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdjb25uZWN0aW9uIGNsb3NlZCwgY2Fubm90IG5lZ290aWF0ZScpKTtcbiAgICAgIH1cblxuICAgICAgLy8gcnVuIHRoZSBwcmVmbGlnaHQgY2hlY2tzXG4gICAgICBwcmVmbGlnaHRDaGVja3MuZm9yRWFjaChmdW5jdGlvbihjaGVjaykge1xuICAgICAgICBjaGVja3NPSyA9IGNoZWNrc09LICYmIGNoZWNrKG5lZ290aWF0ZSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaWYgdGhlIGNoZWNrcyBoYXZlIG5vdCBwYXNzZWQsIHRoZW4gYWJvcnQgZm9yIHRoZSBtb21lbnRcbiAgICAgIGlmICghIGNoZWNrc09LKSB7XG4gICAgICAgIGRlYnVnKCdwcmVmbGlnaHQgY2hlY2tzIGRpZCBub3QgcGFzcywgYWJvcnRpbmcgJyArIG1ldGhvZE5hbWUpO1xuICAgICAgICByZXR1cm4gY2IoKTtcbiAgICAgIH1cblxuICAgICAgLy8gY3JlYXRlIHRoZSBvZmZlclxuICAgICAgZGVidWcoJ2NhbGxpbmcgJyArIG1ldGhvZE5hbWUpO1xuICAgICAgLy8gZGVidWcoJ2dhdGhlcmluZyBzdGF0ZSA9ICcgKyBwYy5pY2VHYXRoZXJpbmdTdGF0ZSk7XG4gICAgICAvLyBkZWJ1ZygnY29ubmVjdGlvbiBzdGF0ZSA9ICcgKyBwYy5pY2VDb25uZWN0aW9uU3RhdGUpO1xuICAgICAgLy8gZGVidWcoJ3NpZ25hbGluZyBzdGF0ZSA9ICcgKyBwYy5zaWduYWxpbmdTdGF0ZSk7XG5cbiAgICAgIHBjW21ldGhvZE5hbWVdKFxuICAgICAgICBmdW5jdGlvbihkZXNjKSB7XG5cbiAgICAgICAgICAvLyBpZiBhIGZpbHRlciBoYXMgYmVlbiBzcGVjaWZpZWQsIHRoZW4gYXBwbHkgdGhlIGZpbHRlclxuICAgICAgICAgIGlmICh0eXBlb2Ygc2RwRmlsdGVyID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGRlc2Muc2RwID0gc2RwRmlsdGVyKGRlc2Muc2RwLCBwYywgbWV0aG9kTmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcS5wdXNoKHsgb3A6IHF1ZXVlTG9jYWxEZXNjKGRlc2MpIH0pO1xuICAgICAgICAgIGNiKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gb24gZXJyb3IsIGFib3J0XG4gICAgICAgIGFib3J0KG1ldGhvZE5hbWUsICcnLCBjYiksXG5cbiAgICAgICAgLy8gaW5jbHVkZSB0aGUgYXBwcm9wcmlhdGUgY29uc3RyYWludHNcbiAgICAgICAgY29uc3RyYWludHNcbiAgICAgICk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUNvbm5lY3Rpb25DbG9zZSgpIHtcbiAgICBkZWJ1ZygnY2FwdHVyZWQgcGMgY2xvc2UsIGljZUNvbm5lY3Rpb25TdGF0ZSA9ICcgKyBwYy5pY2VDb25uZWN0aW9uU3RhdGUpO1xuICAgIGRlY291cGxlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVEaXNjb25uZWN0KCkge1xuICAgIGRlYnVnKCdjYXB0dXJlZCBwYyBkaXNjb25uZWN0LCBtb25pdG9yaW5nIGNvbm5lY3Rpb24gc3RhdHVzJyk7XG5cbiAgICAvLyBzdGFydCB0aGUgZGlzY29ubmVjdCB0aW1lclxuICAgIGRpc2Nvbm5lY3RUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1ZygnbWFudWFsbHkgY2xvc2luZyBjb25uZWN0aW9uIGFmdGVyIGRpc2Nvbm5lY3QgdGltZW91dCcpO1xuICAgICAgcGMuY2xvc2UoKTtcbiAgICB9LCBkaXNjb25uZWN0VGltZW91dCk7XG5cbiAgICBtb24ub24oJ2NoYW5nZScsIGhhbmRsZURpc2Nvbm5lY3RBYm9ydCk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVEaXNjb25uZWN0QWJvcnQoKSB7XG4gICAgZGVidWcoJ2Nvbm5lY3Rpb24gc3RhdGUgY2hhbmdlZCB0bzogJyArIHBjLmljZUNvbm5lY3Rpb25TdGF0ZSk7XG4gICAgcmVzZXREaXNjb25uZWN0VGltZXIoKTtcblxuICAgIC8vIGlmIHdlIGhhdmUgYSBjbG9zZWQgb3IgZmFpbGVkIHN0YXR1cywgdGhlbiBjbG9zZSB0aGUgY29ubmVjdGlvblxuICAgIGlmIChDTE9TRURfU1RBVEVTLmluZGV4T2YocGMuaWNlQ29ubmVjdGlvblN0YXRlKSA+PSAwKSB7XG4gICAgICByZXR1cm4gbW9uLmVtaXQoJ2Nsb3NlZCcpO1xuICAgIH1cblxuICAgIG1vbi5vbmNlKCdkaXNjb25uZWN0JywgaGFuZGxlRGlzY29ubmVjdCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gaGFuZGxlTG9jYWxDYW5kaWRhdGUoZXZ0KSB7XG4gICAgaWYgKGV2dC5jYW5kaWRhdGUpIHtcbiAgICAgIHJlc2V0RGlzY29ubmVjdFRpbWVyKCk7XG5cbiAgICAgIHNpZ25hbGxlci50byh0YXJnZXRJZCkuc2VuZCgnL2NhbmRpZGF0ZScsIGV2dC5jYW5kaWRhdGUpO1xuICAgICAgZW5kT2ZDYW5kaWRhdGVzID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKCEgZW5kT2ZDYW5kaWRhdGVzKSB7XG4gICAgICBlbmRPZkNhbmRpZGF0ZXMgPSB0cnVlO1xuICAgICAgZGVidWcoJ2ljZSBnYXRoZXJpbmcgc3RhdGUgY29tcGxldGUnKTtcbiAgICAgIHNpZ25hbGxlci50byh0YXJnZXRJZCkuc2VuZCgnL2VuZG9mY2FuZGlkYXRlcycsIHt9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVOZWdvdGlhdGVSZXF1ZXN0KHNyYykge1xuICAgIGlmIChzcmMuaWQgPT09IHRhcmdldElkKSB7XG4gICAgICBkZWJ1ZygnZ290IG5lZ290aWF0ZSByZXF1ZXN0IGZyb20gJyArIHRhcmdldElkICsgJywgY3JlYXRpbmcgb2ZmZXInKTtcbiAgICAgIHEucHVzaCh7IG9wOiBjcmVhdGVPZmZlciB9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVSZW1vdGVDYW5kaWRhdGUoZGF0YSwgc3JjKSB7XG4gICAgaWYgKCghIHNyYykgfHwgKHNyYy5pZCAhPT0gdGFyZ2V0SWQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcXVldWUgY2FuZGlkYXRlcyB3aGlsZSB0aGUgc2lnbmFsaW5nIHN0YXRlIGlzIG5vdCBzdGFibGVcbiAgICBpZiAocGMuc2lnbmFsaW5nU3RhdGUgIT0gJ3N0YWJsZScgfHwgKCEgcGMucmVtb3RlRGVzY3JpcHRpb24pKSB7XG4gICAgICBkZWJ1ZygncXVldWluZyBjYW5kaWRhdGUnKTtcbiAgICAgIHF1ZXVlZENhbmRpZGF0ZXMucHVzaChkYXRhKTtcblxuICAgICAgbW9uLnJlbW92ZUxpc3RlbmVyKCdjaGFuZ2UnLCBhcHBseUNhbmRpZGF0ZXNXaGVuU3RhYmxlKTtcbiAgICAgIG1vbi5vbignY2hhbmdlJywgYXBwbHlDYW5kaWRhdGVzV2hlblN0YWJsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHBjLmFkZEljZUNhbmRpZGF0ZShjcmVhdGVJY2VDYW5kaWRhdGUoZGF0YSkpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgZGVidWcoJ2ludmFsaWRhdGUgY2FuZGlkYXRlIHNwZWNpZmllZDogJywgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlU2RwKGRhdGEsIHNyYykge1xuICAgIHZhciBhYm9ydFR5cGUgPSBkYXRhLnR5cGUgPT09ICdvZmZlcicgPyAnY3JlYXRlQW5zd2VyJyA6ICdjcmVhdGVPZmZlcic7XG5cbiAgICAvLyBpZiB0aGUgc291cmNlIGlzIHVua25vd24gb3Igbm90IGEgbWF0Y2gsIHRoZW4gYWJvcnRcbiAgICBpZiAoKCEgc3JjKSB8fCAoc3JjLmlkICE9PSB0YXJnZXRJZCkpIHtcbiAgICAgIHJldHVybiBkZWJ1ZygncmVjZWl2ZWQgc2RwIGJ1dCBkcm9wcGluZyBkdWUgdG8gdW5tYXRjaGVkIHNyYycpO1xuICAgIH1cblxuICAgIC8vIHByaW9yaXRpemUgc2V0dGluZyB0aGUgcmVtb3RlIGRlc2NyaXB0aW9uIG9wZXJhdGlvblxuICAgIHEucHVzaCh7IG9wOiBmdW5jdGlvbih0YXNrLCBjYikge1xuICAgICAgaWYgKGlzQ2xvc2VkKCkpIHtcbiAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcigncGMgY2xvc2VkOiBjYW5ub3Qgc2V0IHJlbW90ZSBkZXNjcmlwdGlvbicpKTtcbiAgICAgIH1cblxuICAgICAgLy8gdXBkYXRlIHRoZSByZW1vdGUgZGVzY3JpcHRpb25cbiAgICAgIC8vIG9uY2Ugc3VjY2Vzc2Z1bCwgc2VuZCB0aGUgYW5zd2VyXG4gICAgICBkZWJ1Zygnc2V0dGluZyByZW1vdGUgZGVzY3JpcHRpb24nKTtcbiAgICAgIHBjLnNldFJlbW90ZURlc2NyaXB0aW9uKFxuICAgICAgICBjcmVhdGVTZXNzaW9uRGVzY3JpcHRpb24oZGF0YSksXG4gICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgYW5zd2VyXG4gICAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ29mZmVyJykge1xuICAgICAgICAgICAgcXVldWUoY3JlYXRlQW5zd2VyKSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHRyaWdnZXIgdGhlIGNhbGxiYWNrXG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhYm9ydChhYm9ydFR5cGUsIGRhdGEuc2RwLCBjYilcbiAgICAgICk7XG4gICAgfX0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNDbG9zZWQoKSB7XG4gICAgcmV0dXJuIENMT1NFRF9TVEFURVMuaW5kZXhPZihwYy5pY2VDb25uZWN0aW9uU3RhdGUpID49IDA7XG4gIH1cblxuICBmdW5jdGlvbiBxdWV1ZShuZWdvdGlhdGVUYXNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcS5wdXNoKFtcbiAgICAgICAgeyBvcDogbmVnb3RpYXRlVGFzayB9XG4gICAgICBdKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcXVldWVMb2NhbERlc2MoZGVzYykge1xuICAgIHJldHVybiBmdW5jdGlvbiBzZXRMb2NhbERlc2ModGFzaywgY2IpIHtcbiAgICAgIGlmIChpc0Nsb3NlZCgpKSB7XG4gICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ2Nvbm5lY3Rpb24gY2xvc2VkLCBhYm9ydGluZycpKTtcbiAgICAgIH1cblxuICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgbG9jYWwgZGVzY3JpcHRpb25cbiAgICAgIGRlYnVnKCdzZXR0aW5nIGxvY2FsIGRlc2NyaXB0aW9uJyk7XG4gICAgICBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKFxuICAgICAgICBkZXNjLFxuXG4gICAgICAgIC8vIGlmIHN1Y2Nlc3NmdWwsIHRoZW4gc2VuZCB0aGUgc2RwIG92ZXIgdGhlIHdpcmVcbiAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gc2VuZCB0aGUgc2RwXG4gICAgICAgICAgc2lnbmFsbGVyLnRvKHRhcmdldElkKS5zZW5kKCcvc2RwJywgZGVzYyk7XG5cbiAgICAgICAgICAvLyBjYWxsYmFja1xuICAgICAgICAgIGNiKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gYWJvcnQoJ3NldExvY2FsRGVzYycsIGRlc2Muc2RwLCBjYilcbiAgICAgICAgLy8gb24gZXJyb3IsIGFib3J0XG4gICAgICAgIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGRlYnVnKCdlcnJvciBzZXR0aW5nIGxvY2FsIGRlc2NyaXB0aW9uJywgZXJyKTtcbiAgICAgICAgICBkZWJ1ZyhkZXNjLnNkcCk7XG4gICAgICAgICAgLy8gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyAgIHNldExvY2FsRGVzYyh0YXNrLCBjYiwgKHJldHJ5Q291bnQgfHwgMCkgKyAxKTtcbiAgICAgICAgICAvLyB9LCA1MDApO1xuXG4gICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzZXREaXNjb25uZWN0VGltZXIoKSB7XG4gICAgbW9uLnJlbW92ZUxpc3RlbmVyKCdjaGFuZ2UnLCBoYW5kbGVEaXNjb25uZWN0QWJvcnQpO1xuXG4gICAgLy8gY2xlYXIgdGhlIGRpc2Nvbm5lY3QgdGltZXJcbiAgICBkZWJ1ZygncmVzZXQgZGlzY29ubmVjdCB0aW1lciwgc3RhdGU6ICcgKyBwYy5pY2VDb25uZWN0aW9uU3RhdGUpO1xuICAgIGNsZWFyVGltZW91dChkaXNjb25uZWN0VGltZXIpO1xuICB9XG5cbiAgLy8gd2hlbiByZWdvdGlhdGlvbiBpcyBuZWVkZWQgbG9vayBmb3IgdGhlIHBlZXJcbiAgaWYgKHJlYWN0aXZlKSB7XG4gICAgcGMub25uZWdvdGlhdGlvbm5lZWRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgZGVidWcoJ3JlbmVnb3RpYXRpb24gcmVxdWlyZWQsIHdpbGwgY3JlYXRlIG9mZmVyIGluIDUwbXMnKTtcbiAgICAgIGNsZWFyVGltZW91dChvZmZlclRpbWVvdXQpO1xuICAgICAgb2ZmZXJUaW1lb3V0ID0gc2V0VGltZW91dChxdWV1ZShjcmVhdGVPZmZlciksIDUwKTtcbiAgICB9O1xuICB9XG5cbiAgcGMub25pY2VjYW5kaWRhdGUgPSBoYW5kbGVMb2NhbENhbmRpZGF0ZTtcblxuICAvLyB3aGVuIHdlIHJlY2VpdmUgc2RwLCB0aGVuXG4gIHNpZ25hbGxlci5vbignc2RwJywgaGFuZGxlU2RwKTtcbiAgc2lnbmFsbGVyLm9uKCdjYW5kaWRhdGUnLCBoYW5kbGVSZW1vdGVDYW5kaWRhdGUpO1xuXG4gIC8vIGlmIHRoaXMgaXMgYSBtYXN0ZXIgY29ubmVjdGlvbiwgbGlzdGVuIGZvciBuZWdvdGlhdGUgZXZlbnRzXG4gIGlmIChpc01hc3Rlcikge1xuICAgIHNpZ25hbGxlci5vbignbmVnb3RpYXRlJywgaGFuZGxlTmVnb3RpYXRlUmVxdWVzdCk7XG4gIH1cblxuICAvLyB3aGVuIHRoZSBjb25uZWN0aW9uIGNsb3NlcywgcmVtb3ZlIGV2ZW50IGhhbmRsZXJzXG4gIG1vbi5vbmNlKCdjbG9zZWQnLCBoYW5kbGVDb25uZWN0aW9uQ2xvc2UpO1xuICBtb24ub25jZSgnZGlzY29ubmVjdGVkJywgaGFuZGxlRGlzY29ubmVjdCk7XG5cbiAgLy8gcGF0Y2ggaW4gdGhlIGNyZWF0ZSBvZmZlciBmdW5jdGlvbnNcbiAgbW9uLmNyZWF0ZU9mZmVyID0gcXVldWUoY3JlYXRlT2ZmZXIpO1xuXG4gIHJldHVybiBtb247XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY291cGxlO1xuIiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gICMjIyBydGMtdG9vbHMvZGV0ZWN0XG5cbiAgUHJvdmlkZSB0aGUgW3J0Yy1jb3JlL2RldGVjdF0oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGMtY29yZSNkZXRlY3QpXG4gIGZ1bmN0aW9uYWxpdHkuXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgncnRjLWNvcmUvZGV0ZWN0Jyk7XG4iLCIvKiBqc2hpbnQgbm9kZTogdHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdjb2cvbG9nZ2VyJykoJ2dlbmVyYXRvcnMnKTtcbnZhciBkZXRlY3QgPSByZXF1aXJlKCcuL2RldGVjdCcpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnY29nL2RlZmF1bHRzJyk7XG5cbnZhciBtYXBwaW5ncyA9IHtcbiAgY3JlYXRlOiB7XG4gICAgZHRsczogZnVuY3Rpb24oYykge1xuICAgICAgaWYgKCEgZGV0ZWN0Lm1veikge1xuICAgICAgICBjLm9wdGlvbmFsID0gKGMub3B0aW9uYWwgfHwgW10pLmNvbmNhdCh7IER0bHNTcnRwS2V5QWdyZWVtZW50OiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gICMjIyBydGMtdG9vbHMvZ2VuZXJhdG9yc1xuXG4gIFRoZSBnZW5lcmF0b3JzIHBhY2thZ2UgcHJvdmlkZXMgc29tZSB1dGlsaXR5IG1ldGhvZHMgZm9yIGdlbmVyYXRpbmdcbiAgY29uc3RyYWludCBvYmplY3RzIGFuZCBzaW1pbGFyIGNvbnN0cnVjdHMuXG5cbiAgYGBganNcbiAgdmFyIGdlbmVyYXRvcnMgPSByZXF1aXJlKCdydGMvZ2VuZXJhdG9ycycpO1xuICBgYGBcblxuKiovXG5cbi8qKlxuICAjIyMjIGdlbmVyYXRvcnMuY29uZmlnKGNvbmZpZylcblxuICBHZW5lcmF0ZSBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHN1aXRhYmxlIGZvciBwYXNzaW5nIGludG8gYW4gVzNDXG4gIFJUQ1BlZXJDb25uZWN0aW9uIGNvbnN0cnVjdG9yIGZpcnN0IGFyZ3VtZW50LCBiYXNlZCBvbiBvdXIgY3VzdG9tIGNvbmZpZy5cbioqL1xuZXhwb3J0cy5jb25maWcgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgcmV0dXJuIGRlZmF1bHRzKGNvbmZpZywge1xuICAgIGljZVNlcnZlcnM6IFtdXG4gIH0pO1xufTtcblxuLyoqXG4gICMjIyMgZ2VuZXJhdG9ycy5jb25uZWN0aW9uQ29uc3RyYWludHMoZmxhZ3MsIGNvbnN0cmFpbnRzKVxuXG4gIFRoaXMgaXMgYSBoZWxwZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGdlbmVyYXRlIGFwcHJvcHJpYXRlIGNvbm5lY3Rpb25cbiAgY29uc3RyYWludHMgZm9yIGEgbmV3IGBSVENQZWVyQ29ubmVjdGlvbmAgb2JqZWN0IHdoaWNoIGlzIGNvbnN0cnVjdGVkXG4gIGluIHRoZSBmb2xsb3dpbmcgd2F5OlxuXG4gIGBgYGpzXG4gIHZhciBjb25uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKGZsYWdzLCBjb25zdHJhaW50cyk7XG4gIGBgYFxuXG4gIEluIG1vc3QgY2FzZXMgdGhlIGNvbnN0cmFpbnRzIG9iamVjdCBjYW4gYmUgbGVmdCBlbXB0eSwgYnV0IHdoZW4gY3JlYXRpbmdcbiAgZGF0YSBjaGFubmVscyBzb21lIGFkZGl0aW9uYWwgb3B0aW9ucyBhcmUgcmVxdWlyZWQuICBUaGlzIGZ1bmN0aW9uXG4gIGNhbiBnZW5lcmF0ZSB0aG9zZSBhZGRpdGlvbmFsIG9wdGlvbnMgYW5kIGludGVsbGlnZW50bHkgY29tYmluZSBhbnlcbiAgdXNlciBkZWZpbmVkIGNvbnN0cmFpbnRzIChpbiBgY29uc3RyYWludHNgKSB3aXRoIHNob3J0aGFuZCBmbGFncyB0aGF0XG4gIG1pZ2h0IGJlIHBhc3NlZCB3aGlsZSB1c2luZyB0aGUgYHJ0Yy5jcmVhdGVDb25uZWN0aW9uYCBoZWxwZXIuXG4qKi9cbmV4cG9ydHMuY29ubmVjdGlvbkNvbnN0cmFpbnRzID0gZnVuY3Rpb24oZmxhZ3MsIGNvbnN0cmFpbnRzKSB7XG4gIHZhciBnZW5lcmF0ZWQgPSB7fTtcbiAgdmFyIG0gPSBtYXBwaW5ncy5jcmVhdGU7XG4gIHZhciBvdXQ7XG5cbiAgLy8gaXRlcmF0ZSB0aHJvdWdoIHRoZSBmbGFncyBhbmQgYXBwbHkgdGhlIGNyZWF0ZSBtYXBwaW5nc1xuICBPYmplY3Qua2V5cyhmbGFncyB8fCB7fSkuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAobVtrZXldKSB7XG4gICAgICBtW2tleV0oZ2VuZXJhdGVkKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIGdlbmVyYXRlIHRoZSBjb25uZWN0aW9uIGNvbnN0cmFpbnRzXG4gIG91dCA9IGRlZmF1bHRzKHt9LCBjb25zdHJhaW50cywgZ2VuZXJhdGVkKTtcbiAgZGVidWcoJ2dlbmVyYXRlZCBjb25uZWN0aW9uIGNvbnN0cmFpbnRzOiAnLCBvdXQpO1xuXG4gIHJldHVybiBvdXQ7XG59O1xuIiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAgIyBydGMtdG9vbHNcblxuICBUaGUgYHJ0Yy10b29sc2AgbW9kdWxlIGRvZXMgbW9zdCBvZiB0aGUgaGVhdnkgbGlmdGluZyB3aXRoaW4gdGhlXG4gIFtydGMuaW9dKGh0dHA6Ly9ydGMuaW8pIHN1aXRlLiAgUHJpbWFyaWx5IGl0IGhhbmRsZXMgdGhlIGxvZ2ljIG9mIGNvdXBsaW5nXG4gIGEgbG9jYWwgYFJUQ1BlZXJDb25uZWN0aW9uYCB3aXRoIGl0J3MgcmVtb3RlIGNvdW50ZXJwYXJ0IHZpYSBhblxuICBbcnRjLXNpZ25hbGxlcl0oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGMtc2lnbmFsbGVyKSBzaWduYWxsaW5nXG4gIGNoYW5uZWwuXG5cbiAgIyMgR2V0dGluZyBTdGFydGVkXG5cbiAgSWYgeW91IGRlY2lkZSB0aGF0IHRoZSBgcnRjLXRvb2xzYCBtb2R1bGUgaXMgYSBiZXR0ZXIgZml0IGZvciB5b3UgdGhhbiBlaXRoZXJcbiAgW3J0Yy1xdWlja2Nvbm5lY3RdKGh0dHBzOi8vZ2l0aHViLmNvbS9ydGMtaW8vcnRjLXF1aWNrY29ubmVjdCkgb3JcbiAgW3J0Yy1nbHVlXShodHRwczovL2dpdGh1Yi5jb20vcnRjLWlvL3J0Yy1nbHVlKSB0aGVuIHRoZSBjb2RlIHNuaXBwZXQgYmVsb3dcbiAgd2lsbCBwcm92aWRlIHlvdSBhIGd1aWRlIG9uIGhvdyB0byBnZXQgc3RhcnRlZCB1c2luZyBpdCBpbiBjb25qdW5jdGlvbiB3aXRoXG4gIHRoZSBbcnRjLXNpZ25hbGxlcl0oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGMtc2lnbmFsbGVyKSBhbmRcbiAgW3J0Yy1tZWRpYV0oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGMtbWVkaWEpIG1vZHVsZXM6XG5cbiAgPDw8IGV4YW1wbGVzL2dldHRpbmctc3RhcnRlZC5qc1xuXG4gIFRoaXMgY29kZSBkZWZpbml0ZWx5IGRvZXNuJ3QgY292ZXIgYWxsIHRoZSBjYXNlcyB0aGF0IHlvdSBuZWVkIHRvIGNvbnNpZGVyXG4gIChpLmUuIHBlZXJzIGxlYXZpbmcsIGV0YykgYnV0IGl0IHNob3VsZCBkZW1vbnN0cmF0ZSBob3cgdG86XG5cbiAgMS4gQ2FwdHVyZSB2aWRlbyBhbmQgYWRkIGl0IHRvIGEgcGVlciBjb25uZWN0aW9uXG4gIDIuIENvdXBsZSBhIGxvY2FsIHBlZXIgY29ubmVjdGlvbiB3aXRoIGEgcmVtb3RlIHBlZXIgY29ubmVjdGlvblxuICAzLiBEZWFsIHdpdGggdGhlIHJlbW90ZSBzdGVhbSBiZWluZyBkaXNjb3ZlcmVkIGFuZCBob3cgdG8gcmVuZGVyXG4gICAgIHRoYXQgdG8gdGhlIGxvY2FsIGludGVyZmFjZS5cblxuICAjIyBSZWZlcmVuY2VcblxuKiovXG5cbnZhciBnZW4gPSByZXF1aXJlKCcuL2dlbmVyYXRvcnMnKTtcblxuLy8gZXhwb3J0IGRldGVjdFxudmFyIGRldGVjdCA9IGV4cG9ydHMuZGV0ZWN0ID0gcmVxdWlyZSgnLi9kZXRlY3QnKTtcbnZhciBmaW5kUGx1Z2luID0gcmVxdWlyZSgncnRjLWNvcmUvcGx1Z2luJyk7XG5cbi8vIGV4cG9ydCBjb2cgbG9nZ2VyIGZvciBjb252ZW5pZW5jZVxuZXhwb3J0cy5sb2dnZXIgPSByZXF1aXJlKCdjb2cvbG9nZ2VyJyk7XG5cbi8vIGV4cG9ydCBwZWVyIGNvbm5lY3Rpb25cbnZhciBSVENQZWVyQ29ubmVjdGlvbiA9XG5leHBvcnRzLlJUQ1BlZXJDb25uZWN0aW9uID0gZGV0ZWN0KCdSVENQZWVyQ29ubmVjdGlvbicpO1xuXG4vLyBhZGQgdGhlIGNvdXBsZSB1dGlsaXR5XG5leHBvcnRzLmNvdXBsZSA9IHJlcXVpcmUoJy4vY291cGxlJyk7XG5cbi8qKlxuICAjIyMgY3JlYXRlQ29ubmVjdGlvblxuXG4gIGBgYFxuICBjcmVhdGVDb25uZWN0aW9uKG9wdHM/LCBjb25zdHJhaW50cz8pID0+IFJUQ1BlZXJDb25uZWN0aW9uXG4gIGBgYFxuXG4gIENyZWF0ZSBhIG5ldyBgUlRDUGVlckNvbm5lY3Rpb25gIGF1dG8gZ2VuZXJhdGluZyBkZWZhdWx0IG9wdHMgYXMgcmVxdWlyZWQuXG5cbiAgYGBganNcbiAgdmFyIGNvbm47XG5cbiAgLy8gdGhpcyBpcyBva1xuICBjb25uID0gcnRjLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAvLyBhbmQgc28gaXMgdGhpc1xuICBjb25uID0gcnRjLmNyZWF0ZUNvbm5lY3Rpb24oe1xuICAgIGljZVNlcnZlcnM6IFtdXG4gIH0pO1xuICBgYGBcbioqL1xuZXhwb3J0cy5jcmVhdGVDb25uZWN0aW9uID0gZnVuY3Rpb24ob3B0cywgY29uc3RyYWludHMpIHtcbiAgdmFyIHBsdWdpbiA9IGZpbmRQbHVnaW4oKG9wdHMgfHwge30pLnBsdWdpbnMpO1xuICB2YXIgbm9ybWFsaXplID0gKHBsdWdpbiA/IHBsdWdpbi5ub3JtYWxpemVJY2UgOiBudWxsKSB8fCByZXF1aXJlKCdub3JtYWxpY2UnKTtcblxuICAvLyBnZW5lcmF0ZSB0aGUgY29uZmlnIGJhc2VkIG9uIG9wdGlvbnMgcHJvdmlkZWRcbiAgdmFyIGNvbmZpZyA9IGdlbi5jb25maWcob3B0cyk7XG5cbiAgLy8gZ2VuZXJhdGUgYXBwcm9wcmlhdGUgY29ubmVjdGlvbiBjb25zdHJhaW50c1xuICB2YXIgY29uc3RyYWludHMgPSBnZW4uY29ubmVjdGlvbkNvbnN0cmFpbnRzKG9wdHMsIGNvbnN0cmFpbnRzKTtcblxuICAvLyBlbnN1cmUgd2UgaGF2ZSB2YWxpZCBpY2VTZXJ2ZXJzXG4gIGNvbmZpZy5pY2VTZXJ2ZXJzID0gKGNvbmZpZy5pY2VTZXJ2ZXJzIHx8IFtdKS5tYXAobm9ybWFsaXplKTtcblxuICBpZiAocGx1Z2luICYmIHR5cGVvZiBwbHVnaW4uY3JlYXRlQ29ubmVjdGlvbiA9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHBsdWdpbi5jcmVhdGVDb25uZWN0aW9uKGNvbmZpZywgY29uc3RyYWludHMpO1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiBuZXcgKChvcHRzIHx8IHt9KS5SVENQZWVyQ29ubmVjdGlvbiB8fCBSVENQZWVyQ29ubmVjdGlvbikoXG4gICAgICBjb25maWcsIGNvbnN0cmFpbnRzXG4gICAgKTtcbiAgfVxufTtcbiIsIi8qIGpzaGludCBub2RlOiB0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJyk7XG5cbi8vIGRlZmluZSBzb21lIHN0YXRlIG1hcHBpbmdzIHRvIHNpbXBsaWZ5IHRoZSBldmVudHMgd2UgZ2VuZXJhdGVcbnZhciBzdGF0ZU1hcHBpbmdzID0ge1xuICBjb21wbGV0ZWQ6ICdjb25uZWN0ZWQnXG59O1xuXG4vLyBkZWZpbmUgdGhlIGV2ZW50cyB0aGF0IHdlIG5lZWQgdG8gd2F0Y2ggZm9yIHBlZXIgY29ubmVjdGlvblxuLy8gc3RhdGUgY2hhbmdlc1xudmFyIHBlZXJTdGF0ZUV2ZW50cyA9IFtcbiAgJ3NpZ25hbGluZ3N0YXRlY2hhbmdlJyxcbiAgJ2ljZWNvbm5lY3Rpb25zdGF0ZWNoYW5nZScsXG5dO1xuXG4vKipcbiAgIyMjIHJ0Yy10b29scy9tb25pdG9yXG5cbiAgYGBgXG4gIG1vbml0b3IocGMsIHRhcmdldElkLCBzaWduYWxsZXIsIG9wdHM/KSA9PiBFdmVudEVtaXR0ZXJcbiAgYGBgXG5cbiAgVGhlIG1vbml0b3IgaXMgYSB1c2VmdWwgdG9vbCBmb3IgZGV0ZXJtaW5pbmcgdGhlIHN0YXRlIG9mIGBwY2AgKGFuXG4gIGBSVENQZWVyQ29ubmVjdGlvbmApIGluc3RhbmNlIGluIHRoZSBjb250ZXh0IG9mIHlvdXIgYXBwbGljYXRpb24uIFRoZVxuICBtb25pdG9yIHVzZXMgYm90aCB0aGUgYGljZUNvbm5lY3Rpb25TdGF0ZWAgaW5mb3JtYXRpb24gb2YgdGhlIHBlZXJcbiAgY29ubmVjdGlvbiBhbmQgYWxzbyB0aGUgdmFyaW91c1xuICBbc2lnbmFsbGVyIGV2ZW50c10oaHR0cHM6Ly9naXRodWIuY29tL3J0Yy1pby9ydGMtc2lnbmFsbGVyI3NpZ25hbGxlci1ldmVudHMpXG4gIHRvIGRldGVybWluZSB3aGVuIHRoZSBjb25uZWN0aW9uIGhhcyBiZWVuIGBjb25uZWN0ZWRgIGFuZCB3aGVuIGl0IGhhc1xuICBiZWVuIGBkaXNjb25uZWN0ZWRgLlxuXG4gIEEgbW9uaXRvciBjcmVhdGVkIGBFdmVudEVtaXR0ZXJgIGlzIHJldHVybmVkIGFzIHRoZSByZXN1bHQgb2YgYVxuICBbY291cGxlXShodHRwczovL2dpdGh1Yi5jb20vcnRjLWlvL3J0YyNydGNjb3VwbGUpIGJldHdlZW4gYSBsb2NhbCBwZWVyXG4gIGNvbm5lY3Rpb24gYW5kIGl0J3MgcmVtb3RlIGNvdW50ZXJwYXJ0LlxuXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocGMsIHRhcmdldElkLCBzaWduYWxsZXIsIG9wdHMpIHtcbiAgdmFyIGRlYnVnTGFiZWwgPSAob3B0cyB8fCB7fSkuZGVidWdMYWJlbCB8fCAncnRjJztcbiAgdmFyIGRlYnVnID0gcmVxdWlyZSgnY29nL2xvZ2dlcicpKGRlYnVnTGFiZWwgKyAnL21vbml0b3InKTtcbiAgdmFyIG1vbml0b3IgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHZhciBzdGF0ZTtcblxuICBmdW5jdGlvbiBjaGVja1N0YXRlKCkge1xuICAgIHZhciBuZXdTdGF0ZSA9IGdldE1hcHBlZFN0YXRlKHBjLmljZUNvbm5lY3Rpb25TdGF0ZSk7XG4gICAgZGVidWcoJ3N0YXRlIGNoYW5nZWQ6ICcgKyBwYy5pY2VDb25uZWN0aW9uU3RhdGUgKyAnLCBtYXBwZWQ6ICcgKyBuZXdTdGF0ZSk7XG5cbiAgICAvLyBmbGFnIHRoZSB3ZSBoYWQgYSBzdGF0ZSBjaGFuZ2VcbiAgICBtb25pdG9yLmVtaXQoJ2NoYW5nZScsIHBjKTtcblxuICAgIC8vIGlmIHRoZSBhY3RpdmUgc3RhdGUgaGFzIGNoYW5nZWQsIHRoZW4gc2VuZCB0aGUgYXBwb3ByaWF0ZSBtZXNzYWdlXG4gICAgaWYgKHN0YXRlICE9PSBuZXdTdGF0ZSkge1xuICAgICAgbW9uaXRvci5lbWl0KG5ld1N0YXRlKTtcbiAgICAgIHN0YXRlID0gbmV3U3RhdGU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlUGVlckxlYXZlKHBlZXJJZCkge1xuICAgIGRlYnVnKCdjYXB0dXJlZCBwZWVyIGxlYXZlIGZvciBwZWVyOiAnICsgcGVlcklkKTtcblxuICAgIC8vIGlmIHRoZSBwZWVyIGxlYXZpbmcgaXMgbm90IHRoZSBwZWVyIHdlIGFyZSBjb25uZWN0ZWQgdG9cbiAgICAvLyB0aGVuIHdlIGFyZW4ndCBpbnRlcmVzdGVkXG4gICAgaWYgKHBlZXJJZCAhPT0gdGFyZ2V0SWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyB0cmlnZ2VyIGEgY2xvc2VkIGV2ZW50XG4gICAgbW9uaXRvci5lbWl0KCdjbG9zZWQnKTtcbiAgfVxuXG4gIHBjLm9uY2xvc2UgPSBtb25pdG9yLmVtaXQuYmluZChtb25pdG9yLCAnY2xvc2VkJyk7XG4gIHBlZXJTdGF0ZUV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGV2dE5hbWUpIHtcbiAgICBwY1snb24nICsgZXZ0TmFtZV0gPSBjaGVja1N0YXRlO1xuICB9KTtcblxuICBtb25pdG9yLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBwYy5vbmNsb3NlID0gbnVsbDtcbiAgICBwZWVyU3RhdGVFdmVudHMuZm9yRWFjaChmdW5jdGlvbihldnROYW1lKSB7XG4gICAgICBwY1snb24nICsgZXZ0TmFtZV0gPSBudWxsO1xuICAgIH0pO1xuXG4gICAgLy8gcmVtb3ZlIHRoZSBwZWVyOmxlYXZlIGxpc3RlbmVyXG4gICAgaWYgKHNpZ25hbGxlciAmJiB0eXBlb2Ygc2lnbmFsbGVyLnJlbW92ZUxpc3RlbmVyID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHNpZ25hbGxlci5yZW1vdmVMaXN0ZW5lcigncGVlcjpsZWF2ZScsIGhhbmRsZVBlZXJMZWF2ZSk7XG4gICAgfVxuICB9O1xuXG4gIG1vbml0b3IuY2hlY2tTdGF0ZSA9IGNoZWNrU3RhdGU7XG5cbiAgLy8gaWYgd2UgaGF2ZW4ndCBiZWVuIHByb3ZpZGVkIGEgdmFsaWQgcGVlciBjb25uZWN0aW9uLCBhYm9ydFxuICBpZiAoISBwYykge1xuICAgIHJldHVybiBtb25pdG9yO1xuICB9XG5cbiAgLy8gZGV0ZXJtaW5lIHRoZSBpbml0aWFsIGlzIGFjdGl2ZSBzdGF0ZVxuICBzdGF0ZSA9IGdldE1hcHBlZFN0YXRlKHBjLmljZUNvbm5lY3Rpb25TdGF0ZSk7XG5cbiAgLy8gaWYgd2UndmUgYmVlbiBwcm92aWRlZCBhIHNpZ25hbGxlciwgdGhlbiB3YXRjaCBmb3IgcGVlcjpsZWF2ZSBldmVudHNcbiAgaWYgKHNpZ25hbGxlciAmJiB0eXBlb2Ygc2lnbmFsbGVyLm9uID09ICdmdW5jdGlvbicpIHtcbiAgICBzaWduYWxsZXIub24oJ3BlZXI6bGVhdmUnLCBoYW5kbGVQZWVyTGVhdmUpO1xuICB9XG5cbiAgLy8gaWYgd2UgYXJlIGFjdGl2ZSwgdHJpZ2dlciB0aGUgY29ubmVjdGVkIHN0YXRlXG4gIC8vIHNldFRpbWVvdXQobW9uaXRvci5lbWl0LmJpbmQobW9uaXRvciwgc3RhdGUpLCAwKTtcblxuICByZXR1cm4gbW9uaXRvcjtcbn07XG5cbi8qIGludGVybmFsIGhlbHBlcnMgKi9cblxuZnVuY3Rpb24gZ2V0TWFwcGVkU3RhdGUoc3RhdGUpIHtcbiAgcmV0dXJuIHN0YXRlTWFwcGluZ3Nbc3RhdGVdIHx8IHN0YXRlO1xufVxuIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qIVxuICogYXN5bmNcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jYW9sYW4vYXN5bmNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IENhb2xhbiBNY01haG9uXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuLypqc2hpbnQgb25ldmFyOiBmYWxzZSwgaW5kZW50OjQgKi9cbi8qZ2xvYmFsIHNldEltbWVkaWF0ZTogZmFsc2UsIHNldFRpbWVvdXQ6IGZhbHNlLCBjb25zb2xlOiBmYWxzZSAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBhc3luYyA9IHt9O1xuXG4gICAgLy8gZ2xvYmFsIG9uIHRoZSBzZXJ2ZXIsIHdpbmRvdyBpbiB0aGUgYnJvd3NlclxuICAgIHZhciByb290LCBwcmV2aW91c19hc3luYztcblxuICAgIHJvb3QgPSB0aGlzO1xuICAgIGlmIChyb290ICE9IG51bGwpIHtcbiAgICAgIHByZXZpb3VzX2FzeW5jID0gcm9vdC5hc3luYztcbiAgICB9XG5cbiAgICBhc3luYy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByb290LmFzeW5jID0gcHJldmlvdXNfYXN5bmM7XG4gICAgICAgIHJldHVybiBhc3luYztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gb25seV9vbmNlKGZuKSB7XG4gICAgICAgIHZhciBjYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNhbGxlZCkgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgd2FzIGFscmVhZHkgY2FsbGVkLlwiKTtcbiAgICAgICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICBmbi5hcHBseShyb290LCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8vLyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGl0eSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgdmFyIF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIF90b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcblxuICAgIHZhciBfZWFjaCA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIGlmIChhcnIuZm9yRWFjaCkge1xuICAgICAgICAgICAgcmV0dXJuIGFyci5mb3JFYWNoKGl0ZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaXRlcmF0b3IoYXJyW2ldLCBpLCBhcnIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBfbWFwID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgaWYgKGFyci5tYXApIHtcbiAgICAgICAgICAgIHJldHVybiBhcnIubWFwKGl0ZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICBfZWFjaChhcnIsIGZ1bmN0aW9uICh4LCBpLCBhKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IoeCwgaSwgYSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcblxuICAgIHZhciBfcmVkdWNlID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIG1lbW8pIHtcbiAgICAgICAgaWYgKGFyci5yZWR1Y2UpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnIucmVkdWNlKGl0ZXJhdG9yLCBtZW1vKTtcbiAgICAgICAgfVxuICAgICAgICBfZWFjaChhcnIsIGZ1bmN0aW9uICh4LCBpLCBhKSB7XG4gICAgICAgICAgICBtZW1vID0gaXRlcmF0b3IobWVtbywgeCwgaSwgYSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuXG4gICAgdmFyIF9rZXlzID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICBpZiAoT2JqZWN0LmtleXMpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgIH07XG5cbiAgICAvLy8vIGV4cG9ydGVkIGFzeW5jIG1vZHVsZSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgLy8vLyBuZXh0VGljayBpbXBsZW1lbnRhdGlvbiB3aXRoIGJyb3dzZXItY29tcGF0aWJsZSBmYWxsYmFjayAvLy8vXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSAndW5kZWZpbmVkJyB8fCAhKHByb2Nlc3MubmV4dFRpY2spKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBhc3luYy5uZXh0VGljayA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIC8vIG5vdCBhIGRpcmVjdCBhbGlhcyBmb3IgSUUxMCBjb21wYXRpYmlsaXR5XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUgPSBhc3luYy5uZXh0VGljaztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFzeW5jLm5leHRUaWNrID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlID0gYXN5bmMubmV4dFRpY2s7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGFzeW5jLm5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgLy8gbm90IGEgZGlyZWN0IGFsaWFzIGZvciBJRTEwIGNvbXBhdGliaWxpdHlcbiAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUgPSBhc3luYy5uZXh0VGljaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jLmVhY2ggPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgaWYgKCFhcnIubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY29tcGxldGVkID0gMDtcbiAgICAgICAgX2VhY2goYXJyLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgaXRlcmF0b3IoeCwgb25seV9vbmNlKGRvbmUpICk7XG4gICAgICAgIH0pO1xuICAgICAgICBmdW5jdGlvbiBkb25lKGVycikge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGNvbXBsZXRlZCArPSAxO1xuICAgICAgICAgICAgICBpZiAoY29tcGxldGVkID49IGFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGFzeW5jLmZvckVhY2ggPSBhc3luYy5lYWNoO1xuXG4gICAgYXN5bmMuZWFjaFNlcmllcyA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBpZiAoIWFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb21wbGV0ZWQgPSAwO1xuICAgICAgICB2YXIgaXRlcmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKGFycltjb21wbGV0ZWRdLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZWQgPj0gYXJyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBpdGVyYXRlKCk7XG4gICAgfTtcbiAgICBhc3luYy5mb3JFYWNoU2VyaWVzID0gYXN5bmMuZWFjaFNlcmllcztcblxuICAgIGFzeW5jLmVhY2hMaW1pdCA9IGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZuID0gX2VhY2hMaW1pdChsaW1pdCk7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIFthcnIsIGl0ZXJhdG9yLCBjYWxsYmFja10pO1xuICAgIH07XG4gICAgYXN5bmMuZm9yRWFjaExpbWl0ID0gYXN5bmMuZWFjaExpbWl0O1xuXG4gICAgdmFyIF9lYWNoTGltaXQgPSBmdW5jdGlvbiAobGltaXQpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgaWYgKCFhcnIubGVuZ3RoIHx8IGxpbWl0IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb21wbGV0ZWQgPSAwO1xuICAgICAgICAgICAgdmFyIHN0YXJ0ZWQgPSAwO1xuICAgICAgICAgICAgdmFyIHJ1bm5pbmcgPSAwO1xuXG4gICAgICAgICAgICAoZnVuY3Rpb24gcmVwbGVuaXNoICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVkID49IGFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHJ1bm5pbmcgPCBsaW1pdCAmJiBzdGFydGVkIDwgYXJyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzdGFydGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3IoYXJyW3N0YXJ0ZWQgLSAxXSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlZCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVkID49IGFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxlbmlzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG5cbiAgICB2YXIgZG9QYXJhbGxlbCA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIFthc3luYy5lYWNoXS5jb25jYXQoYXJncykpO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgdmFyIGRvUGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uKGxpbWl0LCBmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIFtfZWFjaExpbWl0KGxpbWl0KV0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHZhciBkb1NlcmllcyA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIFthc3luYy5lYWNoU2VyaWVzXS5jb25jYXQoYXJncykpO1xuICAgICAgICB9O1xuICAgIH07XG5cblxuICAgIHZhciBfYXN5bmNNYXAgPSBmdW5jdGlvbiAoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhcnIgPSBfbWFwKGFyciwgZnVuY3Rpb24gKHgsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiB7aW5kZXg6IGksIHZhbHVlOiB4fTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKHgudmFsdWUsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKHgudmFsdWUsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1t4LmluZGV4XSA9IHY7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBhc3luYy5tYXAgPSBkb1BhcmFsbGVsKF9hc3luY01hcCk7XG4gICAgYXN5bmMubWFwU2VyaWVzID0gZG9TZXJpZXMoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBMaW1pdCA9IGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIF9tYXBMaW1pdChsaW1pdCkoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB2YXIgX21hcExpbWl0ID0gZnVuY3Rpb24obGltaXQpIHtcbiAgICAgICAgcmV0dXJuIGRvUGFyYWxsZWxMaW1pdChsaW1pdCwgX2FzeW5jTWFwKTtcbiAgICB9O1xuXG4gICAgLy8gcmVkdWNlIG9ubHkgaGFzIGEgc2VyaWVzIHZlcnNpb24sIGFzIGRvaW5nIHJlZHVjZSBpbiBwYXJhbGxlbCB3b24ndFxuICAgIC8vIHdvcmsgaW4gbWFueSBzaXR1YXRpb25zLlxuICAgIGFzeW5jLnJlZHVjZSA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoU2VyaWVzKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihtZW1vLCB4LCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgbWVtbyA9IHY7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIC8vIGluamVjdCBhbGlhc1xuICAgIGFzeW5jLmluamVjdCA9IGFzeW5jLnJlZHVjZTtcbiAgICAvLyBmb2xkbCBhbGlhc1xuICAgIGFzeW5jLmZvbGRsID0gYXN5bmMucmVkdWNlO1xuXG4gICAgYXN5bmMucmVkdWNlUmlnaHQgPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJldmVyc2VkID0gX21hcChhcnIsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSkucmV2ZXJzZSgpO1xuICAgICAgICBhc3luYy5yZWR1Y2UocmV2ZXJzZWQsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcbiAgICAvLyBmb2xkciBhbGlhc1xuICAgIGFzeW5jLmZvbGRyID0gYXN5bmMucmVkdWNlUmlnaHQ7XG5cbiAgICB2YXIgX2ZpbHRlciA9IGZ1bmN0aW9uIChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIGFyciA9IF9tYXAoYXJyLCBmdW5jdGlvbiAoeCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHtpbmRleDogaSwgdmFsdWU6IHh9O1xuICAgICAgICB9KTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LnZhbHVlLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhfbWFwKHJlc3VsdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmluZGV4IC0gYi5pbmRleDtcbiAgICAgICAgICAgIH0pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGFzeW5jLmZpbHRlciA9IGRvUGFyYWxsZWwoX2ZpbHRlcik7XG4gICAgYXN5bmMuZmlsdGVyU2VyaWVzID0gZG9TZXJpZXMoX2ZpbHRlcik7XG4gICAgLy8gc2VsZWN0IGFsaWFzXG4gICAgYXN5bmMuc2VsZWN0ID0gYXN5bmMuZmlsdGVyO1xuICAgIGFzeW5jLnNlbGVjdFNlcmllcyA9IGFzeW5jLmZpbHRlclNlcmllcztcblxuICAgIHZhciBfcmVqZWN0ID0gZnVuY3Rpb24gKGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgYXJyID0gX21hcChhcnIsIGZ1bmN0aW9uICh4LCBpKSB7XG4gICAgICAgICAgICByZXR1cm4ge2luZGV4OiBpLCB2YWx1ZTogeH07XG4gICAgICAgIH0pO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgudmFsdWUsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhfbWFwKHJlc3VsdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmluZGV4IC0gYi5pbmRleDtcbiAgICAgICAgICAgIH0pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGFzeW5jLnJlamVjdCA9IGRvUGFyYWxsZWwoX3JlamVjdCk7XG4gICAgYXN5bmMucmVqZWN0U2VyaWVzID0gZG9TZXJpZXMoX3JlamVjdCk7XG5cbiAgICB2YXIgX2RldGVjdCA9IGZ1bmN0aW9uIChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIG1haW5fY2FsbGJhY2spIHtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBtYWluX2NhbGxiYWNrKHgpO1xuICAgICAgICAgICAgICAgICAgICBtYWluX2NhbGxiYWNrID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBtYWluX2NhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgYXN5bmMuZGV0ZWN0ID0gZG9QYXJhbGxlbChfZGV0ZWN0KTtcbiAgICBhc3luYy5kZXRlY3RTZXJpZXMgPSBkb1NlcmllcyhfZGV0ZWN0KTtcblxuICAgIGFzeW5jLnNvbWUgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgbWFpbl9jYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIG1haW5fY2FsbGJhY2sodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIG1haW5fY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBtYWluX2NhbGxiYWNrKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvLyBhbnkgYWxpYXNcbiAgICBhc3luYy5hbnkgPSBhc3luYy5zb21lO1xuXG4gICAgYXN5bmMuZXZlcnkgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgbWFpbl9jYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICghdikge1xuICAgICAgICAgICAgICAgICAgICBtYWluX2NhbGxiYWNrKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgbWFpbl9jYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIG1haW5fY2FsbGJhY2sodHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLy8gYWxsIGFsaWFzXG4gICAgYXN5bmMuYWxsID0gYXN5bmMuZXZlcnk7XG5cbiAgICBhc3luYy5zb3J0QnkgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgYXN5bmMubWFwKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAoZXJyLCBjcml0ZXJpYSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHt2YWx1ZTogeCwgY3JpdGVyaWE6IGNyaXRlcmlhfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBmbiA9IGZ1bmN0aW9uIChsZWZ0LCByaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWEsIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgX21hcChyZXN1bHRzLnNvcnQoZm4pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5hdXRvID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICB2YXIga2V5cyA9IF9rZXlzKHRhc2tzKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZ1Rhc2tzID0ga2V5cy5sZW5ndGhcbiAgICAgICAgaWYgKCFyZW1haW5pbmdUYXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0cyA9IHt9O1xuXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgdmFyIGFkZExpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMudW5zaGlmdChmbik7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldID09PSBmbikge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgdGFza0NvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVtYWluaW5nVGFza3MtLVxuICAgICAgICAgICAgX2VhY2gobGlzdGVuZXJzLnNsaWNlKDApLCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgYWRkTGlzdGVuZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFyZW1haW5pbmdUYXNrcykge1xuICAgICAgICAgICAgICAgIHZhciB0aGVDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgZmluYWwgY2FsbGJhY2sgZnJvbSBjYWxsaW5nIGl0c2VsZiBpZiBpdCBlcnJvcnNcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgICAgICAgICAgICAgdGhlQ2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9lYWNoKGtleXMsIGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICB2YXIgdGFzayA9IF9pc0FycmF5KHRhc2tzW2tdKSA/IHRhc2tzW2tdOiBbdGFza3Nba11dO1xuICAgICAgICAgICAgdmFyIHRhc2tDYWxsYmFjayA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNhZmVSZXN1bHRzID0ge307XG4gICAgICAgICAgICAgICAgICAgIF9lYWNoKF9rZXlzKHJlc3VsdHMpLCBmdW5jdGlvbihya2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1tya2V5XSA9IHJlc3VsdHNbcmtleV07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgc2FmZVJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIHN1YnNlcXVlbnQgZXJyb3JzIGhpdHRpbmcgY2FsbGJhY2sgbXVsdGlwbGUgdGltZXNcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUodGFza0NvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHJlcXVpcmVzID0gdGFzay5zbGljZSgwLCBNYXRoLmFicyh0YXNrLmxlbmd0aCAtIDEpKSB8fCBbXTtcbiAgICAgICAgICAgIHZhciByZWFkeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3JlZHVjZShyZXF1aXJlcywgZnVuY3Rpb24gKGEsIHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChhICYmIHJlc3VsdHMuaGFzT3duUHJvcGVydHkoeCkpO1xuICAgICAgICAgICAgICAgIH0sIHRydWUpICYmICFyZXN1bHRzLmhhc093blByb3BlcnR5KGspO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMucmV0cnkgPSBmdW5jdGlvbih0aW1lcywgdGFzaywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIERFRkFVTFRfVElNRVMgPSA1O1xuICAgICAgICB2YXIgYXR0ZW1wdHMgPSBbXTtcbiAgICAgICAgLy8gVXNlIGRlZmF1bHRzIGlmIHRpbWVzIG5vdCBwYXNzZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aW1lcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB0YXNrO1xuICAgICAgICAgICAgdGFzayA9IHRpbWVzO1xuICAgICAgICAgICAgdGltZXMgPSBERUZBVUxUX1RJTUVTO1xuICAgICAgICB9XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aW1lcyBpcyBhIG51bWJlclxuICAgICAgICB0aW1lcyA9IHBhcnNlSW50KHRpbWVzLCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgdmFyIHdyYXBwZWRUYXNrID0gZnVuY3Rpb24od3JhcHBlZENhbGxiYWNrLCB3cmFwcGVkUmVzdWx0cykge1xuICAgICAgICAgICAgdmFyIHJldHJ5QXR0ZW1wdCA9IGZ1bmN0aW9uKHRhc2ssIGZpbmFsQXR0ZW1wdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrKGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKCFlcnIgfHwgZmluYWxBdHRlbXB0LCB7ZXJyOiBlcnIsIHJlc3VsdDogcmVzdWx0fSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHdyYXBwZWRSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHdoaWxlICh0aW1lcykge1xuICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlBdHRlbXB0KHRhc2ssICEodGltZXMtPTEpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhc3luYy5zZXJpZXMoYXR0ZW1wdHMsIGZ1bmN0aW9uKGRvbmUsIGRhdGEpe1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgKHdyYXBwZWRDYWxsYmFjayB8fCBjYWxsYmFjaykoZGF0YS5lcnIsIGRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIGEgY2FsbGJhY2sgaXMgcGFzc2VkLCBydW4gdGhpcyBhcyBhIGNvbnRyb2xsIGZsb3dcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrID8gd3JhcHBlZFRhc2soKSA6IHdyYXBwZWRUYXNrXG4gICAgfTtcblxuICAgIGFzeW5jLndhdGVyZmFsbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgaWYgKCFfaXNBcnJheSh0YXNrcykpIHtcbiAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKTtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdyYXBJdGVyYXRvciA9IGZ1bmN0aW9uIChpdGVyYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKHdyYXBJdGVyYXRvcihuZXh0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRvci5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgd3JhcEl0ZXJhdG9yKGFzeW5jLml0ZXJhdG9yKHRhc2tzKSkoKTtcbiAgICB9O1xuXG4gICAgdmFyIF9wYXJhbGxlbCA9IGZ1bmN0aW9uKGVhY2hmbiwgdGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG4gICAgICAgIGlmIChfaXNBcnJheSh0YXNrcykpIHtcbiAgICAgICAgICAgIGVhY2hmbi5tYXAodGFza3MsIGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm4oZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwobnVsbCwgZXJyLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgIGVhY2hmbi5lYWNoKF9rZXlzKHRhc2tzKSwgZnVuY3Rpb24gKGssIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGFza3Nba10oZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW2tdID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMucGFyYWxsZWwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbCh7IG1hcDogYXN5bmMubWFwLCBlYWNoOiBhc3luYy5lYWNoIH0sIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnBhcmFsbGVsTGltaXQgPSBmdW5jdGlvbih0YXNrcywgbGltaXQsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbCh7IG1hcDogX21hcExpbWl0KGxpbWl0KSwgZWFjaDogX2VhY2hMaW1pdChsaW1pdCkgfSwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuc2VyaWVzID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBpZiAoX2lzQXJyYXkodGFza3MpKSB7XG4gICAgICAgICAgICBhc3luYy5tYXBTZXJpZXModGFza3MsIGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm4oZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwobnVsbCwgZXJyLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgIGFzeW5jLmVhY2hTZXJpZXMoX2tleXModGFza3MpLCBmdW5jdGlvbiAoaywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0YXNrc1trXShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5pdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgICAgICB2YXIgbWFrZUNhbGxiYWNrID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0YXNrc1tpbmRleF0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLm5leHQoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG1ha2VDYWxsYmFjaygwKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuYXBwbHkgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KFxuICAgICAgICAgICAgICAgIG51bGwsIGFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgX2NvbmNhdCA9IGZ1bmN0aW9uIChlYWNoZm4sIGFyciwgZm4sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBjYikge1xuICAgICAgICAgICAgZm4oeCwgZnVuY3Rpb24gKGVyciwgeSkge1xuICAgICAgICAgICAgICAgIHIgPSByLmNvbmNhdCh5IHx8IFtdKTtcbiAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgYXN5bmMuY29uY2F0ID0gZG9QYXJhbGxlbChfY29uY2F0KTtcbiAgICBhc3luYy5jb25jYXRTZXJpZXMgPSBkb1NlcmllcyhfY29uY2F0KTtcblxuICAgIGFzeW5jLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHRlc3QoKSkge1xuICAgICAgICAgICAgaXRlcmF0b3IoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFzeW5jLndoaWxzdCh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICBpdGVyYXRvcihmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICBpZiAodGVzdC5hcHBseShudWxsLCBhcmdzKSkge1xuICAgICAgICAgICAgICAgIGFzeW5jLmRvV2hpbHN0KGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMudW50aWwgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGVzdCgpKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXN5bmMudW50aWwodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5kb1VudGlsID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICBpdGVyYXRvcihmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICBpZiAoIXRlc3QuYXBwbHkobnVsbCwgYXJncykpIHtcbiAgICAgICAgICAgICAgICBhc3luYy5kb1VudGlsKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMucXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuICAgICAgICBpZiAoY29uY3VycmVuY3kgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcG9zLCBjYWxsYmFjaykge1xuICAgICAgICAgIGlmICghcS5zdGFydGVkKXtcbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgaWYgKHEuZHJhaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfZWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayA6IG51bGxcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgICAgICAgcS50YXNrcy51bnNoaWZ0KGl0ZW0pO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEudGFza3MucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChxLnNhdHVyYXRlZCAmJiBxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3b3JrZXJzID0gMDtcbiAgICAgICAgdmFyIHEgPSB7XG4gICAgICAgICAgICB0YXNrczogW10sXG4gICAgICAgICAgICBjb25jdXJyZW5jeTogY29uY3VycmVuY3ksXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG51bGwsXG4gICAgICAgICAgICBlbXB0eTogbnVsbCxcbiAgICAgICAgICAgIGRyYWluOiBudWxsLFxuICAgICAgICAgICAgc3RhcnRlZDogZmFsc2UsXG4gICAgICAgICAgICBwYXVzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcHVzaDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgZmFsc2UsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBraWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHEuZHJhaW4gPSBudWxsO1xuICAgICAgICAgICAgICBxLnRhc2tzID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5zaGlmdDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEudGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXNrID0gcS50YXNrcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocS5lbXB0eSAmJiBxLnRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcnMgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZXJzIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFzay5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhc2suY2FsbGJhY2suYXBwbHkodGFzaywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxLmRyYWluICYmIHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHEucHJvY2VzcygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2IgPSBvbmx5X29uY2UobmV4dCk7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcih0YXNrLmRhdGEsIGNiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEudGFza3MubGVuZ3RoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2VycztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpZGxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGggKyB3b3JrZXJzID09PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSB0cnVlKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocS5wYXVzZWQgPT09IGZhbHNlKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcS5wcm9jZXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG4gICAgXG4gICAgYXN5bmMucHJpb3JpdHlRdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBfY29tcGFyZVRhc2tzKGEsIGIpe1xuICAgICAgICAgIHJldHVybiBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIF9iaW5hcnlTZWFyY2goc2VxdWVuY2UsIGl0ZW0sIGNvbXBhcmUpIHtcbiAgICAgICAgICB2YXIgYmVnID0gLTEsXG4gICAgICAgICAgICAgIGVuZCA9IHNlcXVlbmNlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgd2hpbGUgKGJlZyA8IGVuZCkge1xuICAgICAgICAgICAgdmFyIG1pZCA9IGJlZyArICgoZW5kIC0gYmVnICsgMSkgPj4+IDEpO1xuICAgICAgICAgICAgaWYgKGNvbXBhcmUoaXRlbSwgc2VxdWVuY2VbbWlkXSkgPj0gMCkge1xuICAgICAgICAgICAgICBiZWcgPSBtaWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlbmQgPSBtaWQgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYmVnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgIGlmICghcS5zdGFydGVkKXtcbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgaWYgKHEuZHJhaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfZWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayA6IG51bGxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKF9iaW5hcnlTZWFyY2gocS50YXNrcywgaXRlbSwgX2NvbXBhcmVUYXNrcykgKyAxLCAwLCBpdGVtKTtcblxuICAgICAgICAgICAgICBpZiAocS5zYXR1cmF0ZWQgJiYgcS50YXNrcy5sZW5ndGggPT09IHEuY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFN0YXJ0IHdpdGggYSBub3JtYWwgcXVldWVcbiAgICAgICAgdmFyIHEgPSBhc3luYy5xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5KTtcbiAgICAgICAgXG4gICAgICAgIC8vIE92ZXJyaWRlIHB1c2ggdG8gYWNjZXB0IHNlY29uZCBwYXJhbWV0ZXIgcmVwcmVzZW50aW5nIHByaW9yaXR5XG4gICAgICAgIHEucHVzaCA9IGZ1bmN0aW9uIChkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBSZW1vdmUgdW5zaGlmdCBmdW5jdGlvblxuICAgICAgICBkZWxldGUgcS51bnNoaWZ0O1xuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICBhc3luYy5jYXJnbyA9IGZ1bmN0aW9uICh3b3JrZXIsIHBheWxvYWQpIHtcbiAgICAgICAgdmFyIHdvcmtpbmcgICAgID0gZmFsc2UsXG4gICAgICAgICAgICB0YXNrcyAgICAgICA9IFtdO1xuXG4gICAgICAgIHZhciBjYXJnbyA9IHtcbiAgICAgICAgICAgIHRhc2tzOiB0YXNrcyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQsXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG51bGwsXG4gICAgICAgICAgICBlbXB0eTogbnVsbCxcbiAgICAgICAgICAgIGRyYWluOiBudWxsLFxuICAgICAgICAgICAgZHJhaW5lZDogdHJ1ZSxcbiAgICAgICAgICAgIHB1c2g6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2VhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRhc2ssXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2sgOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjYXJnby5kcmFpbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXJnby5zYXR1cmF0ZWQgJiYgdGFza3MubGVuZ3RoID09PSBwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJnby5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShjYXJnby5wcm9jZXNzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiBwcm9jZXNzKCkge1xuICAgICAgICAgICAgICAgIGlmICh3b3JraW5nKSByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZihjYXJnby5kcmFpbiAmJiAhY2FyZ28uZHJhaW5lZCkgY2FyZ28uZHJhaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgY2FyZ28uZHJhaW5lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgdHMgPSB0eXBlb2YgcGF5bG9hZCA9PT0gJ251bWJlcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRhc2tzLnNwbGljZSgwLCBwYXlsb2FkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGFza3Muc3BsaWNlKDAsIHRhc2tzLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZHMgPSBfbWFwKHRzLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFzay5kYXRhO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYoY2FyZ28uZW1wdHkpIGNhcmdvLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgd29ya2luZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgd29ya2VyKGRzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgX2VhY2godHMsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEuY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFza3MubGVuZ3RoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2luZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGNhcmdvO1xuICAgIH07XG5cbiAgICB2YXIgX2NvbnNvbGVfZm4gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbnNvbGVbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9lYWNoKGFyZ3MsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZVtuYW1lXSh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV0pKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGFzeW5jLmxvZyA9IF9jb25zb2xlX2ZuKCdsb2cnKTtcbiAgICBhc3luYy5kaXIgPSBfY29uc29sZV9mbignZGlyJyk7XG4gICAgLyphc3luYy5pbmZvID0gX2NvbnNvbGVfZm4oJ2luZm8nKTtcbiAgICBhc3luYy53YXJuID0gX2NvbnNvbGVfZm4oJ3dhcm4nKTtcbiAgICBhc3luYy5lcnJvciA9IF9jb25zb2xlX2ZuKCdlcnJvcicpOyovXG5cbiAgICBhc3luYy5tZW1vaXplID0gZnVuY3Rpb24gKGZuLCBoYXNoZXIpIHtcbiAgICAgICAgdmFyIG1lbW8gPSB7fTtcbiAgICAgICAgdmFyIHF1ZXVlcyA9IHt9O1xuICAgICAgICBoYXNoZXIgPSBoYXNoZXIgfHwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgdmFyIGtleSA9IGhhc2hlci5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIGlmIChrZXkgaW4gbWVtbykge1xuICAgICAgICAgICAgICAgIGFzeW5jLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgbWVtb1trZXldKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSBpbiBxdWV1ZXMpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldID0gW2NhbGxiYWNrXTtcbiAgICAgICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBtZW1vW2tleV0gPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBxID0gcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBxdWV1ZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBxLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgIHFbaV0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIG1lbW9pemVkLm1lbW8gPSBtZW1vO1xuICAgICAgICBtZW1vaXplZC51bm1lbW9pemVkID0gZm47XG4gICAgICAgIHJldHVybiBtZW1vaXplZDtcbiAgICB9O1xuXG4gICAgYXN5bmMudW5tZW1vaXplID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKGZuLnVubWVtb2l6ZWQgfHwgZm4pLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH07XG5cbiAgICBhc3luYy50aW1lcyA9IGZ1bmN0aW9uIChjb3VudCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjb3VudGVyID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgY291bnRlci5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3luYy5tYXAoY291bnRlciwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudGltZXNTZXJpZXMgPSBmdW5jdGlvbiAoY291bnQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY291bnRlciA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGNvdW50ZXIucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXN5bmMubWFwU2VyaWVzKGNvdW50ZXIsIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcSA9IGZ1bmN0aW9uICgvKiBmdW5jdGlvbnMuLi4gKi8pIHtcbiAgICAgICAgdmFyIGZucyA9IGFyZ3VtZW50cztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICBhc3luYy5yZWR1Y2UoZm5zLCBhcmdzLCBmdW5jdGlvbiAobmV3YXJncywgZm4sIGNiKSB7XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgbmV3YXJncy5jb25jYXQoW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCBuZXh0YXJncyk7XG4gICAgICAgICAgICAgICAgfV0pKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGF0LCBbZXJyXS5jb25jYXQocmVzdWx0cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGFzeW5jLmNvbXBvc2UgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICByZXR1cm4gYXN5bmMuc2VxLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuICAgIHZhciBfYXBwbHlFYWNoID0gZnVuY3Rpb24gKGVhY2hmbiwgZm5zIC8qYXJncy4uLiovKSB7XG4gICAgICAgIHZhciBnbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4gZWFjaGZuKGZucywgZnVuY3Rpb24gKGZuLCBjYikge1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIGFyZ3MuY29uY2F0KFtjYl0pKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgICAgICAgICAgcmV0dXJuIGdvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGdvO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBhc3luYy5hcHBseUVhY2ggPSBkb1BhcmFsbGVsKF9hcHBseUVhY2gpO1xuICAgIGFzeW5jLmFwcGx5RWFjaFNlcmllcyA9IGRvU2VyaWVzKF9hcHBseUVhY2gpO1xuXG4gICAgYXN5bmMuZm9yZXZlciA9IGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgZnVuY3Rpb24gbmV4dChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZuKG5leHQpO1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKTtcbiAgICB9O1xuXG4gICAgLy8gTm9kZS5qc1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFzeW5jO1xuICAgIH1cbiAgICAvLyBBTUQgLyBSZXF1aXJlSlNcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFzeW5jO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gaW5jbHVkZWQgZGlyZWN0bHkgdmlhIDxzY3JpcHQ+IHRhZ1xuICAgIGVsc2Uge1xuICAgICAgICByb290LmFzeW5jID0gYXN5bmM7XG4gICAgfVxuXG59KCkpO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIlpiaTdnYlwiKSkiLCIvKipcbiAgIyBub3JtYWxpY2VcblxuICBOb3JtYWxpemUgYW4gaWNlIHNlcnZlciBjb25maWd1cmF0aW9uIG9iamVjdCAob3IgcGxhaW4gb2xkIHN0cmluZykgaW50byBhIGZvcm1hdFxuICB0aGF0IGlzIHVzYWJsZSBpbiBhbGwgYnJvd3NlcnMgc3VwcG9ydGluZyBXZWJSVEMuICBQcmltYXJpbHkgdGhpcyBtb2R1bGUgaXMgZGVzaWduZWRcbiAgdG8gaGVscCB3aXRoIHRoZSB0cmFuc2l0aW9uIG9mIHRoZSBgdXJsYCBhdHRyaWJ1dGUgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHRvXG4gIHRoZSBgdXJsc2AgYXR0cmlidXRlLlxuXG4gICMjIEV4YW1wbGUgVXNhZ2VcblxuICA8PDwgZXhhbXBsZXMvc2ltcGxlLmpzXG5cbioqL1xuXG52YXIgcHJvdG9jb2xzID0gW1xuICAnc3R1bjonLFxuICAndHVybjonXG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciB1cmwgPSAoaW5wdXQgfHwge30pLnVybCB8fCBpbnB1dDtcbiAgdmFyIHByb3RvY29sO1xuICB2YXIgcGFydHM7XG4gIHZhciBvdXRwdXQgPSB7fTtcblxuICAvLyBpZiB3ZSBkb24ndCBoYXZlIGEgc3RyaW5nIHVybCwgdGhlbiBhbGxvdyB0aGUgaW5wdXQgdG8gcGFzc3Rocm91Z2hcbiAgaWYgKHR5cGVvZiB1cmwgIT0gJ3N0cmluZycgJiYgKCEgKHVybCBpbnN0YW5jZW9mIFN0cmluZykpKSB7XG4gICAgcmV0dXJuIGlucHV0O1xuICB9XG5cbiAgLy8gdHJpbSB0aGUgdXJsIHN0cmluZywgYW5kIGNvbnZlcnQgdG8gYW4gYXJyYXlcbiAgdXJsID0gdXJsLnRyaW0oKTtcblxuICAvLyBpZiB0aGUgcHJvdG9jb2wgaXMgbm90IGtub3duLCB0aGVuIHBhc3N0aHJvdWdoXG4gIHByb3RvY29sID0gcHJvdG9jb2xzW3Byb3RvY29scy5pbmRleE9mKHVybC5zbGljZSgwLCA1KSldO1xuICBpZiAoISBwcm90b2NvbCkge1xuICAgIHJldHVybiBpbnB1dDtcbiAgfVxuXG4gIC8vIG5vdyBsZXQncyBhdHRhY2sgdGhlIHJlbWFpbmluZyB1cmwgcGFydHNcbiAgdXJsID0gdXJsLnNsaWNlKDUpO1xuICBwYXJ0cyA9IHVybC5zcGxpdCgnQCcpO1xuXG4gIG91dHB1dC51c2VybmFtZSA9IGlucHV0LnVzZXJuYW1lO1xuICBvdXRwdXQuY3JlZGVudGlhbCA9IGlucHV0LmNyZWRlbnRpYWw7XG4gIC8vIGlmIHdlIGhhdmUgYW4gYXV0aGVudGljYXRpb24gcGFydCwgdGhlbiBzZXQgdGhlIGNyZWRlbnRpYWxzXG4gIGlmIChwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgdXJsID0gcGFydHNbMV07XG4gICAgcGFydHMgPSBwYXJ0c1swXS5zcGxpdCgnOicpO1xuXG4gICAgLy8gYWRkIHRoZSBvdXRwdXQgY3JlZGVudGlhbCBhbmQgdXNlcm5hbWVcbiAgICBvdXRwdXQudXNlcm5hbWUgPSBwYXJ0c1swXTtcbiAgICBvdXRwdXQuY3JlZGVudGlhbCA9IChpbnB1dCB8fCB7fSkuY3JlZGVudGlhbCB8fCBwYXJ0c1sxXSB8fCAnJztcbiAgfVxuXG4gIG91dHB1dC51cmwgPSBwcm90b2NvbCArIHVybDtcbiAgb3V0cHV0LnVybHMgPSBbIG91dHB1dC51cmwgXTtcblxuICByZXR1cm4gb3V0cHV0O1xufTtcbiJdfQ==
