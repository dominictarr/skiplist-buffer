# skiplist-buffer

A skiplist implemented directly on top of buffers.

I looked at other skiplist implementations on npm,
and found them to be quite slow.
Actually, slower than just using a sorted array + binary search.

(there are some other problems with array + sort, like, can't add items to the array
while you are querying through it)

## example

``` js
var b = Buffer.alloc(1024*1024*2) //create a large buffer
var skiplist = require('skiplist-buffer')
var item = require('skiplist-buffer/debug').item
//create an initial block, this has the most pointers
var c = item(b, 0, [0, 0, 0, 0, 0, 0, 0])

//returns a pointer to where the string is recorded
var ptr = skiplist.insertString(b, c, 'hello world')
var _ptr = skiplist.find(b, c, 'hello world')

//these are the same
assert.equal(ptr, _ptr)

//get the actual string
assert.equal(skiplist.getString(b, ptr), 'hello world')

```

## web assembly

there is also an (partial) implemention in webassembly.

implemented so far:

* find

todo: insert, findString, insertString

## benchmarks

a test on 1 millon random integers

```
insert    3691
find      3015
find.wasm 1625
```

1.6 seconds to insert 1000000 items, means 615 items per millisecond

storing integers in the skiplist probably isn't very useful.
TODO: implement string support in wasm

## License

MIT

