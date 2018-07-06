var fs = require('fs'), path = require('path')
var wasm = fs.readFileSync(path.join(__dirname, './skiplist.wasm'))

//instantiate the module synchronously
//http://devdocs.io/javascript/global_objects/webassembly/module
//
//https://twitter.com/mafintosh/status/875399010521141248
//
//there are infuriating arbitary limits on loading wasm sync
//(that differ between js engines of course) but this module is tiny

var m = WebAssembly.Module(wasm, )
var instance = WebAssembly.Instance(m, {console: { log: function (a, b, c) {
//  throw new Error('weird')
  console.log("LOG", String.fromCodePoint(a),b,c)
  return 0
}}}
)
//module.exports = instance.exports

//console.log(instance)
//instance.exports.memory.grow(100)

exports.find = instance.exports.find
exports.compare = instance.exports.compare


exports.sort = instance.exports.sort

exports.buffer = new Buffer(instance.exports.memory.buffer)

exports.grow = function (n) {
  instance.exports.memory.grow(n)
  exports.buffer = new Buffer(instance.exports.memory.buffer)
}

exports.findString = function (c, string, level) {
  var b = exports.buffer
  var free = b.readUInt32LE(0)
  b.write(string, free+4)
  b.writeUInt32LE(Buffer.byteLength(string), free)
  return instance.exports.findString(c, free, level)
}

exports.compareStrings = instance.exports.compareStrings
