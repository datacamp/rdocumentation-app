var lifter = require('./sails-lifter');


//Load sails to benefit from services and models definition
// This will load a minimal version of sails without http, sessions, controllers, ...
task('sails-load', {async: true}, function(){
  lifter.lift(function(err, sails) {
    complete();
  });
});


desc('Call a fn in sails');
task('getPackage', ['sails-load'], {async: true}, function () {
  Package.findAll({
    where: {
      name: 'Rcpp'
    }
  }).then(function(packages){
    console.log(packages);
    complete();
  });

});


jake.addListener('complete', function () {
  process.exit();
});
