var ll = require('../')

var b = Buffer.alloc(4*1024*1024)
var c = ll.item(b, 0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

var start = Date.now()
for(var i = 0; i < 200000; i++) {
  var v = ~~(100000*Math.random())
  ll.insert(b, c, v)
}
console.log(Date.now() - start)

var start = Date.now()
for(var i = 0; i < 200000; i++) {
  ll.levels(b, c)
}
console.log(Date.now() - start)


