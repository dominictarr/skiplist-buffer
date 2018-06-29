//debugging stuff...

var ll = require('./')
var r_value = ll.get
var r_level = ll.next

function all (b) {
  var a = []
  var ptr = 8
  while(ptr = r_level(b, ptr, 0)) {
    a.push(r_value(b, ptr))
  }
  return a
}

function dump_node (b, ptr) {
  var levels = []
  var a = {value: b.readUInt32LE(ptr), levels: levels}
  var v
  do {
    ptr += 4
    v = b.readInt32LE(ptr)
    levels.push(v & 0x7fffffff)
  }
  while(v < 0)
  return a
}

function dump (b) {
  var a = {}
  var free = b.readUInt32LE(0)
  for(var ptr = 0; ptr < free;) {
    var levels = []
    a[ptr] = {value: b.readUInt32LE(ptr), levels: levels}
    var v
    do {
      ptr += 4
      v = b.readInt32LE(ptr)
      levels.push(v & 0x7fffffff)
    }
    while(v < 0)
    ptr += 4
  }
  return a
}

function item (b, value, levels) {
  if(levels.length < 1) throw new Error('levels must have at least [0]')
  var free = r_value(b, 0) //read pointer to the very first item.
  if(free == 0) {
    free = 8
    b.writeInt32LE(8, 4) //we are adding the first item, so set pointer.
  }
  b.writeUInt32LE(value, free)
  for(var i = 0; i < levels.length; i++)
    b.writeInt32LE(
      levels[i] | ((i + 1) < levels.length ? 0x80000000 : 0), free+4+i*4
    )

  b.writeUInt32LE(free + 4 + levels.length*4, 0) //update free pointer.

  return free
}

module.exports = {
  item: item, dump: dump, all: all
}





