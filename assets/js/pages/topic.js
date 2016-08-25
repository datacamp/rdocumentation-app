(function($) {
  window.bootTopic = function () {

  var bootstrapDCL = function() {
    var exercises = document.querySelectorAll("[data-datacamp-exercise]");
    //TODO add code to reinit exercices
  };

    var renderer = new marked.Renderer();
    var defaultCodeFunction = renderer.code;

    renderer.code = function(code, lang) {
      if(lang === '{r}' || lang === 'r' || lang === 'python' || lang === '{python}') {
        var codeBlock = '<div data-datacamp-exercise data-lang="r">';
        codeBlock += '<code data-type="sample-code">';
        codeBlock += code;
        codeBlock += '</code>';
        codeBlock += '</div>';
        return codeBlock;
      } else {
        return defaultCodeFunction.call(this, code, lang);
      }
    };

    if ($("#postExampleText").length >= 1) {
      var simplemde = new SimpleMDE({
        element: $("#postExampleText")[0],
        previewRender: function(plainText, preview) {
          setTimeout(function() {
            var rendered = marked(plainText, {renderer: renderer});
            $(preview).html(rendered);
            if(urlParam("viewer_pane") !== 1){
              bootstrapDCL();
            }
          }, 0);
          return "Loading...";
        },
        spellChecker: false,
        status: false
      });
    }

    $('.example--text').each(function() {
      var markdown = $(this).html();
      var rendered =  marked(markdown, {renderer: renderer});
      $(this).html(rendered);
    });
    if(urlParam("viewer_pane")==1){
      $('[data-datacamp-exercise]').each(function(){
        var r= $('<button type="button" class="visible-installed btn btn-primary js-external pull-right">Run codeblock </button>');
        r.bind('click',function(){
          window.executePackageCode($(this).prev().text());
        });
        $(this).append(r);
      });
      window.packageVersionControl();
    }
    else{
      bootstrapDCL();
    }

    $("#openModalExample").bind('modal:ajax:complete',function(){
      var callback = function(){
        $.post("/modalLogin",$(".authentication--form").serialize(),function(json){
          var status = json.status;
          if(status === "success"){
            $(".example--form form").submit();
          }else if(status === "invalid"){
            if($(".modal").find(".flash-error").length === 0){
            $(".modal").prepend("<div class = 'flash flash-error'>Invalid username or password.</div>");
            }
          }
        });
      };
      $("#modalLoginButton").click(callback);
      $("#username").keypress(function(e){
        if(e.which == 13){
          callback();
        }
      });
      $("#password").keypress(function(e){
        if(e.which == 13){
          callback();
        }
      });
    });

  };

})($jq);
