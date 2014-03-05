
var gameboy = require('gameboy');
var Canvas = require('canvas');
var Emitter = require('events').EventEmitter;

module.exports = Emulator;

function Emulator(){
  if (!(this instanceof Emulator)) return new Emulator();
  this.canvas = new Canvas(160, 144);
  this.gbOpts = { drawEvents: true };
}

Emulator.prototype.__proto__ = Emitter.prototype;

Emulator.prototype.initWithRom = function(rom){
  this.gameboy = gameboy(this.canvas, rom, this.gbOpts);
  this.gameboy.start();
};

Emulator.prototype.initWithState = function(state){
  this.gameboy = gameboy(this.canvas, '', this.gbOpts);
  this.gameboy.returnFromState(state);
};

Emulator.prototype.run = function(){
  var gb = this.gameboy;
  gb.stopEmulator = 1; // not stopped
  this.loop = setInterval(gb.run.bind(gb), 8);
  var self = this;
  gb.on('draw', function(){
    self.canvas.toBuffer(function(err, buf){
      if (err) throw err;
      self.emit('frame', buf);
    });
  });
  this.running = true;
};

Emulator.prototype.snapshot = function(){
  if (!this.running) return;
  return this.gameboy.saveState();
};

Emulator.prototype.move = function(key){
  if (!this.running) return this;
  if (key >= 0 && key < 8) {
    var gb = this.gameboy;
    gb.JoyPadEvent(key, true);
    setTimeout(function(){
      gb.JoyPadEvent(key, false);
    }, 50);
  }
  return this;
};

Emulator.prototype.destroy = function(){
  if (this.destroyed) return this;
  clearInterval(this.loop);
  // ignore stacked key timers from Emulator#move
  this.gameboy.JoyPadEvent = function(){};
  this.destroyed = true;
  this.running = false;
  this.canvas = null;
  this.gameboy = null;
  return this;
};
