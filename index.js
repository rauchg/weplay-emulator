
var fs = require('fs');
var emulator = require('./emulator');
var join = require('path').join;
var md5 = require('crypto').createHash('md5');
var msgpack = require('msgpack');
var debug = require('debug')('weplay:worker');

if (!process.env.WEPLAY_ROM) {
  console.log('You must specify the ENV variable `WEPLAY_ROM` '
    + 'pointint to location of rom file to broadcast.');
  process.exit(1);
}

process.title = 'weplay-emulator';

// redis
var redis = require('./redis')();
var sub = require('./redis')();
var io = require('socket.io-emitter')(redis);

// rom
var file = process.env.WEPLAY_ROM;
if ('/' != file[0]) file = join(process.cwd(), file);
debug('rom %s', file);
var rom = fs.readFileSync(file);
var hash = md5.update(file).digest('hex');
debug('rom hash %s', hash);

// save interval
var saveInterval = process.env.WEPLAY_SAVE_INTERVAL || 60000;
debug('save interval %d', saveInterval);

// load emulator
var emu;

function load(){
  debug('loading emulator');
  emu = emulator();

  emu.on('error', function(){
    console.log(new Date + ' - restarting emulator');
    emu.destroy();
    setTimeout(load, 1000);
  });

  emu.on('frame', function(frame){
    io.emit('frame', frame);
    redis.set('weplay:frame', frame);
  });

  redis.get('weplay:state:' + hash, function(err, state){
    if (err) throw err;
    if (state) {
      debug('init from state');
      emu.initWithState(msgpack.unpack(state));
    } else {
      debug('init from rom');
      emu.initWithRom(rom);
    }
    emu.run();
    save();
  });

  function save(){
    debug('will save in %d', saveInterval);
    setTimeout(function(){
      var snap = emu.snapshot();
      if (snap) {
        debug('saving state');
        redis.set('weplay:state:' + hash, msgpack.pack(snap));
        save();
      }
    }, saveInterval);
  }
}

sub.subscribe('weplay:move');
sub.on('message', function(channel, move){
  if ('weplay:move' != channel) return;
  emu.move(move.toString());
});

load();
