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

exports.findAsync = findAsync
exports.insertAsync = insertAsync
