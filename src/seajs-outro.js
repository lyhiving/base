// Enable to load `sea.js` self asynchronously
if (_seajs && _seajs.args) {
  var methods = ["define", "config", "use"]
  var args = _seajs.args
  for (var g = 0; g < args.length; g += 2) {
    seajs[methods[args[g]]].apply(seajs, args[g + 1])
  }
}