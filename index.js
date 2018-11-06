'use strict'

//refactor to make space for backlink:
//introduced in 0b75389bbccd4c3a09a85d244102cdbe78e27e02
//(backlink isn't implemented yet)
const FORWARD = 8

function get_next (base, level) {
  return base + FORWARD + level * 4
}

function r_value (b, ptr) {
  return b.readUInt32LE(ptr)
}

function r_level (b, ptr, level) {
  return b.readUInt32LE(get_next(ptr, level)) & 0x7fffffff
}

function r_levels (b, ptr) {
  var i = 0
  ptr += FORWARD
  while(b.readUInt32LE(ptr) & 0x80000000) {
    i++
    ptr += 4
  }
  return i
}

function compare (a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

var _compare = compare

/*
ranges

  cmp > 0 // get last equal element
  cmp >= 0 // get last smaller element
  //to get first gt element, use find(>) + 1?
*/

function find(b, ptr, target, level, compare, gt) {
  level = level || r_levels(b, ptr)
  compare = compare || _compare
  gt = gt !== false
  var prev_ptr = 0
  while(true) {
    if(level < 0) break;
    //if this level is last item
    var next_ptr = r_level(b, ptr, level)
    if(next_ptr === 0)
      level --
    else {
      var cmp = compare(r_value(b, next_ptr), target, b)
      if(gt ? cmp > 0 : cmp >= 0)
        level --
      else {
        prev_ptr = ptr
        ptr = next_ptr
      }
    }
  }

  return ptr //gt ? ptr : prev_ptr
}

/*
  this function allocates space for the inserted value,
  and as it searches, uses that space to store the previous links.
  when it finds the insertion point, it flips those values around,
  updates the previous pointers to point to this value,
  and sets these pointers to point to the previous's next's values.
*/

function insert (b, ptr, target, level, compare) {
  level = level || r_levels(b, ptr)
  compare = compare || _compare
  var free = b.readUInt32LE(0) || 8

  //figure out before hand how many levels deep we want to insert this value
  for(var _level = 0; _level < level && Math.random() > 0.5;)
    _level ++

  //update free space pointer: address of last level + 4 (space for target value)
  b.writeUInt32LE(4+get_next(free, _level), 0) //make space for this item.

  //insert value at start of previous free space
  b.writeUInt32LE(target, free)

  while(true) {
    if(level < 0) break;
    //if this level is last item
    var next_ptr = r_level(b, ptr, level)
    if(
      next_ptr === 0 ||
      compare(r_value(b, next_ptr), target, b) > 0
    ) {
      //store value of previous pointer
      if(level <= _level)
        b.writeUInt32LE(ptr, get_next(free, level))

      level --
    }
    else {
      ptr = next_ptr
    }
  }

  //write a backlink.

  b.writeUInt32LE(b.readUInt32LE(free+get_next(0)) & 0x7fffffff)

  //I think if insert items bottom up, and set the new pointer first
  //then this should be fully threadsafe.
  for(var i = 0; i <= _level; i++) {
    var prev = b.readUInt32LE(get_next(free, i))
    var next = b.readUInt32LE(get_next(prev, i)) //includes msb continue flag
    //these say Int 32, but remember the msb is 1 which means negative.
    //so this is actually correct.
    b.writeInt32LE(i < _level ? next | 0x80000000 : next & 0x7fffffff, get_next(free, i))
    //free, free | (next & 0x80000000))
    b.writeInt32LE(free | (next & 0x80000000), get_next(prev, i))
  }

  return free
}

function string_compare (ptr, target, b) {
  return target.compare(b, ptr+4, ptr+4+b.readUInt32LE(ptr), 0, target.length)
}

function findString (b, ptr, string, gt) {
  var target = new Buffer(string)
  return find(b, ptr, target, null, string_compare, gt)
}

function insertString (b, ptr, string, level) {
  //copy the string into the same buffer...
  var free = b.readUInt32LE(0)
  var length = Buffer.byteLength(string)

  b.write(string, free+4)
  var target = b.slice(free+4, free+4+length)
  b.writeUInt32LE(length, free)
  b.writeUInt32LE(free+length+4, 0) //update free pointer
  return insert(b, ptr, free, null, function (value, _target) {
    return string_compare(value, target, b)
  })
}

function getString (b, ptr) {
  var string_ptr = b.readUInt32LE(ptr)
  var length = b.readUInt32LE(string_ptr)
  return b.toString('utf8', string_ptr+4, string_ptr+4+length)
}

module.exports = {
  find: find, insert: insert,
  get: r_value,
  r_level: r_level,
  levels: r_levels,
  insertString: insertString,
  findString, findString,
  getString: getString,
  get_next: get_next
}


