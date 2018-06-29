

//allocate a new cons
function cons (b, value, next) {
  var free = readValue(b, 0) || 8
  updateValue(b, free, value); updateNext(b, free, next)
  updateValue(b, 0, free+8) //update free pointer
  return free
}

function readValue (buffer, cons) {
  return buffer.readUInt32LE(cons)
}
function readNext (buffer, cons) {
  return buffer.readUInt32LE(cons+4)
}

//update a cons to point to a new value
function updateValue (buffer, node, value) {
  buffer.writeUInt32LE(value, node)
  return value
}
function updateNext (buffer, node, next) {
  buffer.writeUInt32LE(next, node+4)
  return next
}

//insert value into a list after node.
function insert (b, node, value) {
  return updateNext(b, node, cons(b, value, readNext(b, node)))
}

function each (b, node, iter) {
  if(node == 0) return
  iter(readValue(b, node))
  each(b, readNext(b, node), iter)
}

function find (b, node, test) {
  if(node == 0) return
  if(iter(readValue(b, node))) return node
  return each(b, readNext(b, node), iter)
}

module.exports = {
  cons: cons,
  readValue: readValue, readNext: readNext,
  updateValue: updateValue, updateNext: updateNext,
  insert: insert,
  each: each, find: find,
}

