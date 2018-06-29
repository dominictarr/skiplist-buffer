'use strict'
function r_value (b, ptr) {
  return b.readUInt32LE(ptr)
}

function r_level (b, ptr, level) {
  return b.readUInt32LE(ptr+4+level*4) & 0x7fffffff
}

function r_levels (b, ptr) {
  var i = 0
  while(b.readUInt32LE(ptr+=4) & 0x80000000)
    i++
  return i
}

function compare (a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

function find(b, ptr, target, level) {
  level = level || r_levels(b, ptr)

  while(true) {
    if(level < 0) break;
    //if this level is last item
    if(r_level(b, ptr, level) === 0 || compare(r_value(b, r_level(b, ptr, level)), target) > 0)
      level --
    else
      ptr = r_level(b, ptr, level)
  }

  return ptr
}


function _insert (b, ptr, target, level) {
  level = level || r_levels(b, ptr)
  var free = b.readUInt32LE(0) || 8
  //figure out before hand how many levels deep we want to insert this value
  for(var _level = 0; _level < level && Math.random() > 0.5; )
    _level ++

  b.writeUInt32LE(free+4+4+_level*4, 0) //make space for this item.

  //the value we want to insert
  b.writeUInt32LE(target, free)
  while(true) {
    if(level < 0) break;
    //if this level is last item
    if(
      r_level(b, ptr, level) === 0 ||
      compare(r_value(b, r_level(b, ptr, level)), target) > 0
    ) {
      if(level <= _level)
        b.writeUInt32LE(ptr, free+4+(4*level))

      level --
    }
    else {
      ptr = r_level(b, ptr, level)
    }
  }

  for(var i = 0; i <= _level; i++) {
    var prev = b.readUInt32LE(free+4+i*4)
    var next = b.readUInt32LE(prev+4+i*4) //includes msb continue flag
    b.writeInt32LE(i < _level ? next | 0x80000000 : next & 0x7fffffff, free+4+i*4)
    //free, free | (next & 0x80000000))
    b.writeInt32LE(free | (next & 0x80000000), prev+4+i*4)
  }

  return free
}

module.exports = {
  item: item, dump: dump, find: find, all: all,
  insert: _insert, get: r_value, next: r_level, levels: r_levels
}

//debugging stuff...

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






