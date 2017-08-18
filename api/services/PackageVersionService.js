module.exports = {
  getSourceList: function(res, package_name, version){
    var key = 'rdocs_source_' + package_name + '_' + version + '_tree';
    return RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      var prefix = "rpackages/unarchived/" + package_name + "/" + version + "/R/";
      return s3Service.getAllFilesInFolder(prefix, true)
        .then(function(data){
          var url = process.env.BASE_URL + "/packages/" + package_name + "/versions/" + version
              + "/source/";

          var list = data.list.map(function(item){
            var name = item.Key.substring(prefix.length, item.Key.length);
            var parts = name.split('/');
            return {
              'name': name,
              'parts': parts
            }
          });
          var data = {};
          for(var item of list){
            PackageVersionService.setObjectValue(data, item.parts, item.name);
          }
          var tree = [];
          PackageVersionService.toTreeStructure(tree, data);
          return {
              tree: tree
          }
        });

    });
  },

  setObjectValue: function(obj, indices, value) {
    if (indices.length==1)
        return obj[indices[0]] = value;
    else if (indices.length==0)
        return obj;
    else{
        if(obj[indices[0]] === undefined)
          obj[indices[0]] = {};
        return setObjectValue(obj[indices[0]],indices.slice(1), value);
    }
  },

  toTreeStructure: function(tree, data){
    if(typeof(data) !== 'object')
      return;
    for(var key of Object.keys(data)){
      var nodes = [];
      toTreeStructure(nodes, data[key]);
      var node = {
        text: key,
        selectable: nodes.length === 0,
        state: {
          selected: false
        }
      };
      if(nodes.length === 0)
        node.href = data[key];
      else
        node.nodes = nodes;
      tree.push(node);
    }
  }


}
