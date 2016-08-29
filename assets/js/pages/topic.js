(function($) {

  var bootstrapExamples = function() {
    if(urlParam("viewer_pane") != 1) {
      window.initAddedDCLightExercises();
    }
    else {
      $('.run-example').each(function() {
        var packageName = $(this).parent().data('package-name') || $('.packageData').data('package-name');
        $(this).click(function(){
          window.executePackageCode(packageName,$(this).prev().text());
        });
      });
    }
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

  renderer.code = function(code, lang) {
    if(urlParam("viewer_pane") == 1 && (lang === 'r' || lang === '{r}')) {
      var $block = $("<div>");

      var exampleHTML = "<pre><code>" + code + "</code></pre>";

      var $button = $('<button type="button" class="visible-installed btn btn-primary js-external run-example">Run codeblock </button>');

      $block.append(exampleHTML);
      $block.append($button);
      return $block.prop('outerHTML');

    }
    else if(lang === '{r}' || lang === 'r' || lang === 'python' || lang === '{python}') {
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
    
  bootTopic = function () {


    if ($("#postExampleText").length >= 1) {
      var simplemde = new SimpleMDE({
        element: $("#postExampleText")[0],
        previewRender: function(plainText, preview) {
          setTimeout(function() {
            var rendered = marked(plainText, {renderer: renderer});
            $(preview).html(rendered);
              bootstrapExamples();
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

    bootstrapExamples();


    $("#openModalExample").bind('modal:ajax:complete',function(){
      if(urlParam('viewer_pane')==1){
        window.bindButtonAndForms();
      }
      var callback = function(){
        var auth = $(".authentication--form").serialize();
        $.post("/modalLogin",auth,function(json){
          var status = json.status;
          if(status === "success"){
            if(urlParam('viewer_pane')==1){
              window.logInForRstudio(auth).then(function(){
                $.modal.close();
                $(".example--form form").submit();
              });
            }
            else{
              $(".example--form form").submit();
            }
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
