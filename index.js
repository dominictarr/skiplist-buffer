function r_value (b, ptr) {
  return b.readUInt32LE(ptr)
}

function r_level (b, ptr, level) {
  return b.readUInt32LE(ptr+4+level*4) & 0x7fffffff
}

function r_has_more (b, ptr, level) {
  return b.readInt32LE(ptr) >= 0
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

function r_levels (b, ptr) {
  var i = 0
  while(b.readUInt32LE(ptr+=4) & 0x80000000)
    i++
  return i
}

function compare (a, b) {
  return a - b
}

function find(b, ptr, target) {
  var level = r_levels(b, ptr)
  var a = []
  var ptr
  var l= 100
  while(l--) {
    if(level < 0) break;
    //if this level is last item
    if(r_level(b, ptr, level) === 0) {
      a.push(ptr)
      level --
    }
    //if current pointer is greater
    else if (compare(r_value(b, r_level(b, ptr, level)), target) > 0) {
      a.push(ptr)
      level --
    }
    else {
      ptr = r_level(b, ptr, level)
    }
  }
  return a
}

function _find(b, ptr, target, levels) {
  var level = levels || 
    r_levels(b, ptr)
  var ptr
  while(true) {
    if(level < 0) break;
    //if this level is last item
    if(r_level(b, ptr, level) === 0)
      level --
    //if current pointer is greater
    else if (compare(r_value(b, r_level(b, ptr, level)), target) > 0)
      level --
    else
      ptr = r_level(b, ptr, level)
  }
  return ptr
}


var r = 0

function insert (b, ptr, value) {
  var levels = find(b, ptr, value)
  var l = []
  var free = b.readUInt32LE(0)
  var again = ~~(Math.random()*(1<<30))
  do {
    var _ptr = levels.pop()
    var val = b.readUInt32LE(_ptr)
    var next = b.readUInt32LE(_ptr+4+4*l.length)
    //write as int32 (not uint) to prevent out of bounds check
    b.writeInt32LE(free | (next & 0x80000000), _ptr + 4 + 4*l.length)
    l.push(next&0x7ffffff)
    //again =>> 1
//    var again = Math.random() > 0.5
  } while(levels.length && ((again >>= 1) & 1)) //(again&1))
  var c = item(b, value, l)

  return c
}

function all (b) {
  var a = []
  var ptr = 8
  while(ptr = r_level(b, ptr, 0)) {
    a.push(r_value(b, ptr))
  }
  return a
}

module.exports = {
  item: item, dump: dump, find: _find, all: all,
  insert: insert, get: r_value, next: r_level, levels: r_levels
}

//debugging stuff...

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




