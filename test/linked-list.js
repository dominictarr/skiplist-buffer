
var tape = require('tape')

var ll = require('../list')
function toArray(b, c) {
  var a = []
  ll.each(b, c, function (v) { a.push(v) })
  return a
}

tape('create simple linked lists', function (t) {
  var b = Buffer.alloc(100)
  var c = ll.cons(b, 10)
  t.equal(ll.readValue(b, c), 10)
  console.log(c)
  t.deepEqual(toArray(b, c), [10])
  t.end()
})

tape('create simple linked lists', function (t) {
  var b = Buffer.alloc(100)

  var c = ll.cons(b, 10, ll.cons(b, 20, ll.cons(b, 30)))
  console.log(c)
  var a = []
  console.log(b)
  ll.each(b, c, function (v) { a.push(v) })
  t.deepEqual(toArray(b, c), [10, 20, 30])
  t.end()
})

tape('insert', function (t) {
  var b = Buffer.alloc(100)

  var c = ll.cons(b, 10, ll.cons(b, 20, ll.cons(b, 30)))
  ll.insert(b, ll.readNext(b, c), 25)

  t.deepEqual(toArray(b, c), [10, 20, 25, 30])
  ll.insert(b, c, 15)
  t.deepEqual(toArray(b, c), [10, 15, 20, 25, 30])
  t.end()

})









