var l = require('./list')

function _compare (a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

module.exports = function (buffer, get, compare) {
  compare = compare || _compare
  if('number' == typeof buffer)
    buffer = Buffer.alloc(buffer)
  // first field is length, i.e. pointer to next free block.
  // and also number of items in the skiplist.

  //each block is [offset, next]

  function readValue(ptr, cb) {
    get(l.readValue(buffer, ptr), cb)
  }

  function find (query, cb) {
    ;(function next (ptr, _ptr) {
      if(ptr === 0)
        cb(null, null, ptr, _ptr)
      else
        get(ptr, function (err, value) {
          if(compare(value, query) <= 0) next(l.readNext(buffer, ptr), ptr)
          else cb(null, value, ptr, _ptr)
        })
    })(l.readNext(buffer, 0), 0) //pointer to first value
  }

  return {
    insert: function (value, offset, cb) {
      find(value, function (err, _, __, prev) {
        l.insert(buffer, prev, offset)
        cb()
      })
    },
    find: find,
    all: function () {
      var next = l.readNext(buffer, 0)
      var a = []
      for(var i = 0; next; next = l.readNext(buffer, next))
        readValue(next, function (err, value) {
          a.push(value)
        })
      return a
    }
  }
}



