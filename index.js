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
    var next_ptr = r_level(b, ptr, level)
    if(next_ptr === 0 || compare(r_value(b, next_ptr), target) > 0)
      level --
    else
      ptr = next_ptr
  }

  return ptr
}

function findAsync(b, get, ptr, target, level, _cb) {
  level = level || r_levels(b, ptr)

  function cb (err, ptr) {
    get(r_value(b, ptr), function (err, value) {
      _cb(err, value, ptr)
    })
  }

  ;(function next (ptr, _value) {
    if(level < 0) return cb(null, ptr)
    //if this level is last item
      console.log('next', ptr, level)
      var next_ptr = r_level(b, ptr, level)
      if(next_ptr === 0) {
        level --
        console.log('null_ptr', level)
        if(level < 0) cb(null, ptr)
        else next(ptr)
      }
      else
        get(r_value(b, next_ptr), function (err, value) {
          if(compare(value, target) > 0)
            level --
          else
            ptr = next_ptr

          console.log('cmp', compare(value, target), ptr)
          if(level < 0) cb(null, ptr)
          else next(ptr)
        })

  })(ptr)
}

function insert (b, ptr, target, level) {
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
    var next_ptr = r_level(b, ptr, level)
    if(
      next_ptr === 0 ||
      compare(r_value(b, next_ptr), target) > 0
    ) {
      if(level <= _level)
        b.writeUInt32LE(ptr, free+4+(4*level))

      level --
    }
    else {
      ptr = next_ptr
    }
  }

  //I think if insert items bottom up, and set the new pointer first
  //then this should be fully threadsafe.
  for(var i = 0; i <= _level; i++) {
    var prev = b.readUInt32LE(free+4+i*4)
    var next = b.readUInt32LE(prev+4+i*4) //includes msb continue flag
    b.writeInt32LE(i < _level ? next | 0x80000000 : next & 0x7fffffff, free+4+i*4)
    //free, free | (next & 0x80000000))
    b.writeInt32LE(free | (next & 0x80000000), prev+4+i*4)
  }

  return free
}

function insertAsync (b, get, ptr, target, offset, level, cb) {
  level = level || r_levels(b, ptr)
  var free = b.readUInt32LE(0) || 8
  //figure out before hand how many levels deep we want to insert this value
  for(var _level = 0; _level < level && Math.random() > 0.5; )
    _level ++

  b.writeUInt32LE(free+4+4+_level*4, 0) //make space for this item.

  //the value we want to insert
  console.log("OFFSET", offset, free)
  b.writeUInt32LE(offset, free)

  ;(function next (ptr) {

    function save (ptr) {
    }

    console.log('next:', ptr)
    if(level < 0) return write()
    //if this level is last item
    var next_ptr = r_level(b, ptr, level)
    if(next_ptr === 0) {
      if(level <= _level)
        b.writeUInt32LE(ptr, free+4+(4*level))
      level --
      if(level < 0) write()
      else next(ptr)
    }
    else
      get(r_value(b, next_ptr), function (err, value) {
        if(err) return cb(err)
        if(compare(value, target) > 0) {
          if(level <= _level)
            b.writeUInt32LE(ptr, free+4+(4*level))
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
    console.log("------- WRITE", free)
    for(var i = 0; i <= _level; i++) {
      var prev = b.readUInt32LE(free+4+i*4)
      var next = b.readUInt32LE(prev+4+i*4) //includes msb continue flag
      console.log('WRITE next:', i, [prev, next&0x7fffffff], [free+4+i*4, prev+4+i*4])
      if(free+4+i*4 === 8) throw new Error('overwriting root:free')
      b.writeInt32LE(i < _level ? next | 0x80000000 : next & 0x7fffffff, free+4+i*4)
      //free, free | (next & 0x80000000))
      if(prev+4+i*4 === 8) throw new Error('overwriting root - prev:'+prev)
      b.writeInt32LE(free | (next & 0x80000000), prev+4+i*4)
    }
    cb(null, free)
  }
}


module.exports = {
  find: find, insert: insert,
  findAsync: findAsync, insertAsync: insertAsync,
  get: r_value,
  next: r_level, levels: r_levels
}













