function getPath() {
  var loc = window.location;
  var lastIndex = loc.pathname.length;
  var firstIndex = (loc.pathname.lastIndexOf('/') + 1) || 0;
  var pathName = loc.pathname.substring(firstIndex, lastIndex);
  return pathName;
}
