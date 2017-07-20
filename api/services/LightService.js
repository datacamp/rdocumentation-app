// LightService.js - in api/services
module.exports = {
  addAnchorItem: function(items, item, title, anchor){
    if(item !== undefined && item !== null &&
    (!Object.prototype.toString.call( item ) === '[object Array]' || item.length > 0))
      items.push({
        title,
        anchor
      });
  }
}
