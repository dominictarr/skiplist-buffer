# skiplist

A skiplist implemented directly on top of buffers.

I looked at other skiplist implementations on npm,
and found them to be quite slow.
Actually, slower than just using a sorted array + binary search.

(there are some other problems with array + sort, like, can't add items to the array
while you are querying through it)

This implementation still needs some improvements:
* don't use arrays in find/insert. create the record to be inserted while searching.
* support async lookups
* support fixed width keys and/or length delimited keys.

## License

MIT
