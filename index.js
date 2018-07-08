'use strict'

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

function find(b, ptr, target, level, compare) {
  level = level || r_levels(b, ptr)
  compare = compare || _compare

  while(true) {
    if(level < 0) break;
    //if this level is last item
    var next_ptr = r_level(b, ptr, level)
    if(next_ptr === 0 || compare(r_value(b, next_ptr), target, b) > 0)
      level --
    else
      ptr = next_ptr
  }

  return ptr
}

function findAsync(b, get, ptr, target, level, compare, _cb) {
  if(!_cb) _cb = compare, compare = _compare

  level = level || r_levels(b, ptr)

  function cb (err, ptr) {
    get(r_value(b, ptr), function (err, value) {
      _cb(err, value, ptr)
    })
  }

  ;(function next (ptr, _value) {
    if(level < 0) return cb(null, ptr)
    //if this level is last item
      var next_ptr = r_level(b, ptr, level)
      if(next_ptr === 0) {
        level --
        if(level < 0) cb(null, ptr)
        else next(ptr)
      }
      else
        get(r_value(b, next_ptr), function (err, value) {
          if(compare(value, target) > 0)
            level --
          else
            ptr = next_ptr

          if(level < 0) cb(null, ptr)
          else next(ptr)
        })

  })(ptr)
}

function insert (b, ptr, target, level, compare) {
  level = level || r_levels(b, ptr)
  compare = compare || _compare
  var free = b.readUInt32LE(0) || 8
  //figure out before hand how many levels deep we want to insert this value
  for(var _level = 0; _level < level && Math.random() > 0.5;)
    _level ++

  //address of last level + 4
  b.writeUInt32LE(4+get_next(free, _level), 0) //make space for this item.

  //the value we want to insert
  b.writeUInt32LE(target, free)

  while(true) {
    if(level < 0) break;
    //if this level is last item
    var next_ptr = r_level(b, ptr, level)
    if(
      next_ptr === 0 ||
      compare(r_value(b, next_ptr), target, b) > 0
    ) {
      if(level <= _level)
        b.writeUInt32LE(ptr, get_next(free, level))

      level --
    }
    else {
      ptr = next_ptr
    }
  }

  //I think if insert items bottom up, and set the new pointer first
  //then this should be fully threadsafe.
  for(var i = 0; i <= _level; i++) {
    var prev = b.readUInt32LE(get_next(free, i))
    var next = b.readUInt32LE(get_next(prev, i)) //includes msb continue flag
    b.writeInt32LE(i < _level ? next | 0x80000000 : next & 0x7fffffff, get_next(free, i))
    //free, free | (next & 0x80000000))
    b.writeInt32LE(free | (next & 0x80000000), get_next(prev, i))
  }

  return free
}

function insertAsync (b, get, ptr, target, offset, level, compare, cb) {
  if(!cb) cb = compare, compare = _compare

  level = level || r_levels(b, ptr)
  var free = b.readUInt32LE(0) || 8
  //figure out before hand how many levels deep we want to insert this value
  for(var _level = 0; _level < level && Math.random() > 0.5; )
    _level ++

  b.writeUInt32LE(4+get_next(free, level), 0) //make space for this item.

  //the value we want to insert
  b.writeUInt32LE(offset, free)

  ;(function next (ptr) {

    if(level < 0) return write()
    //if this level is last item
    var next_ptr = r_level(b, ptr, level)
    if(next_ptr === 0) {
      if(level <= _level)
        b.writeUInt32LE(ptr, get_next(free, level))
      level --
      if(level < 0) write()
      else next(ptr)
    }
    else
      get(r_value(b, next_ptr), function (err, value) {
        if(err) return cb(err)
        if(compare(value, target) > 0) {
          if(level <= _level)
            b.writeUInt32LE(ptr, get_next(free, level))
          level --
        }

        else {
          ptr = next_ptr
        }
        if(level < 0) write()
        else next(ptr)
    })
  })(ptr)

  function write () {
    //I think if insert items bottom up, and set the new pointer first
    //then this should be fully threadsafe.
    for(var i = 0; i <= _level; i++) {
      var prev = b.readUInt32LE(get_next(free, i))
      var next = b.readUInt32LE(get_next(prev, i)) //includes msb continue flag
      b.writeInt32LE(i < _level ? next | 0x80000000 : next & 0x7fffffff, free+4+i*4)
      //free, free | (next & 0x80000000))
      b.writeInt32LE(free | (next & 0x80000000), get_next(prev, i))
    }
    cb(null, free)
  }
}


function string_compare (ptr, target, b) {
  return target.compare(b, ptr+4, ptr+4+b.readUInt32LE(ptr), 0, target.length)
}

function findString (b, ptr, string) {
  var target = new Buffer(string)
  return find(b, ptr, target, null, string_compare)
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
  findAsync: findAsync, insertAsync: insertAsync,
  get: r_value,
  next: r_level, levels: r_levels,
  insertString: insertString,
  findString, findString,
  getString: getString,
  get_next: get_next
}




