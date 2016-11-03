(function ($) {
  /*
  helper function for interaction with rstudio
  */
  var _rStudioRequest = function (method, params) {
    var data={},
    shared_secret = urlParam("RS_SHARED_SECRET"),
    port = urlParam("Rstudio_port");
    data.method = method;
    data.params = params;
    data.clientId = '33e600bb-c1b1-46bf-b562-ab5cba070b0e';
    data.clientVersion = "";

    if (method === 'console_input' && RStudio.version >= 1) {
      //RStudio 1.0 expect 2 parameters, instead of 1 for RStudio < 1.0
      data.params = data.params.concat("");
    }

    return $.ajax({
      url: 'http://127.0.0.1:' + port + RStudioRPCEndpoints[method],
      headers:
      {
          'Accept':'application/json',
          'Content-Type':'application/json',
          'X-Shared-Secret':shared_secret
      },
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify(data),
      processData: false,
      crossDomain:true,
      xhrFields: {
        withCredentials: true
      }
    });
  };

  RStudioRPCEndpoints = {
    execute_r_code: '/rpc/execute_r_code',
    console_input: '/rpc/console_input'
  };

  RStudioRequests = {

    rdoc_package_version: "0.7.1",

    checkRDocumentationPackageVersion: function() {
      return RStudioRequests.checkPackageVersion("RDocumentation", RStudioRequests.rdoc_package_version).then(function(installed) {
        if( installed !== 0 ) {
          Loader.replacePage("/rstudio/update");
          return false;
        } else return true;
      });
    },

    /*
    Helper function to store credentials in Rstudio and to stay loggedIn for fututre ajax request
    */
    logInForRstudio: function (sid) {
      return _rStudioRequest('execute_r_code',
        ["dir.create(paste0(find.package('RDocumentation'),'/config')) \n write('" + 'sid=' + sid + "', file = paste0(find.package('RDocumentation'),'/config/creds.txt'))"])
      .then(function () {
        console.log("Stored creds in RStudio: "+ sid);
        return RStudio.stayLoggedIn(sid);
      });
    },

    /*
    function to run the examples on a topic page
    */
    runExamples: function (e) {
      e.preventDefault();
      var package = $(".packageData").data("package-name");
      var version = $(".packageData").data("latest-version");
      RStudioRequests.checkPackageVersion(package,version).then(function (installed) {
        if(installed === 0 || installed == -1) {
          var examples= $('.topic').find('.topic--title').filter(function (i,el) {
            return $(this).text() == "Examples";
          }).parent().find('.R').text();
          _rStudioRequest('console_input',["require(" + package + ")\n" + examples]);
        }
      });
      return false;
    },

    checkRStudioVersion: function() {
      return _rStudioRequest('execute_r_code',["toString(RStudio.Version()$version)"])
      .then(function (result) {
        var version = result.result.replace('"', '').split('.');
        var major = parseInt(version[0]);
        return major
      });
    },

    /*
    function for the 'make default' button
    */
    setDefault: function (e) {
      e.preventDefault();
      _rStudioRequest('console_input',["RDocumentation::makeDefault()"]);
      return false;
    },

    /*
    function for the 'continue without making default' button
    */
    hideViewer: function (e) {
      e.preventDefault();
      _rStudioRequest('console_input',["RDocumentation::hideViewer()"]);
      return false;
    },


    /************************************************************************************************************************************************
    checking installation of package and package version
    ************************************************************************************************************************************************/

    /*
    helper function to check the package version
    */
    checkPackageVersion: function (package,version) {
      version = String(version).replace("-",".");
      return _rStudioRequest('execute_r_code',["check_package('" + package + "','"+version+"')"])
      .then(function (result) {
          return parseInt(result.result);
      });
    },

    /*
    function to hide/show elements dependent on package installation
    */
    packageVersionControl: function () {
      var packageName = $(".packageData").data("package-name");
      var version = $(".packageData").data("latest-version");
      if(packageName) {
        RStudioRequests.checkPackageVersion(packageName,version).then(function (installed) {
          if(installed == 1) {
            $('.versionCheck').html('<button type="button" id="js-install" class="btn btn-large pull-right btn-primary js-external">Install</button>');
            $('.visible-installed').hide();
          }
          else if(installed == -1) {
            $('.versionCheck').html('<button type="button" id="js-install" class="btn btn-large pull-right btn-primary js-external">Update</button>');
          }
          else{
            $('.versionCheck').html('<i class="fa fa-check icon-green" aria-hidden="true"></i><span class="latest">You have the latest version<span>');
          }
          $('#js-install').unbind('click',RStudioRequests.installpackage);
          $('#js-install').bind('click',RStudioRequests.installpackage);
        });
      }
    },

    /*
    function for the install button
    */
    installpackage: function (e) {
      e.preventDefault();
      var packageName = $(".packageData").data("package-name");
      var packageSource = $(".packageData").data("type-id");
      _rStudioRequest('console_input',
                ["install_package('" + packageName + "'," + packageSource + ")"]);
      return false;
    },

    /*
    function to run user-defined examples
    */
    executePackageCode: function (package,code) {
      _rStudioRequest('console_input', ["require(" + package + ")\n" + code]);
    },

    updateRDoc: function() {
      _rStudioRequest('console_input', ["install_package('RDocumentation',3)"]);
    }

  };


})($jq);
