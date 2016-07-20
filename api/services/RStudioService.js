var Promise = require('bluebird');
var _ = require('lodash');
cheerio = require('cheerio');

module.exports = {
	orderedFindByAlias :function(packageName,alias){
		return Alias.orderedFindByAlias(packageName,alias).then(function(aliases){
			if (aliases.length == 0) return _notfound(); //no match found anywhere, 404
            if (aliases.length == 1) { //if there is only 1 match, redirect to this one
        		return Topic.findOnePopulated({id: aliases[0].id}, {
			        include: [{
			          model: PackageVersion,
			          as: 'package_version',
			          attributes: ['package_name', 'version']
			        }]
			      }).then(function(topic) {
			        if(topic === null) return [];
			        else {
			          return TopicService.computeLinks('/link/', topic)
			            .then(function(topic) {
			              topic.pageTitle = topic.name;
			              return [topic];
			            });
			        }
			    });
			}
            return aliases;
		});
	},
	externalBindGlobalClickHandler: function(html){
		if(inViewerPane){
			$  = cheerio.load(html);
    		$('a:not(.js-external)').unbind('click', window.asyncClickHandler);
    		$('a:not(.js-external)').bind('click', window.asyncClickHandler); 
    		return $.html();
		}
		return html;		
  	}
};
_notfound = function(){	
	return [];
};