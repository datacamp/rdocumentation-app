(function($) {

  window.Examples = {
    bootstrapExamples: function() {
      if(urlParam("viewer_pane") != 1) {
        window.initAddedDCLightExercises();
      }
      else {
        $('.run-example').each(function() {
          var packageName = $(this).parent().parent().data('package-name') || $('.packageData').data('package-name');
          $(this).click(function(){
            window.executePackageCode(packageName,$(this).prev().text());
          });
        });
      }
    },

    renderer: (function() {
      var renderer = new marked.Renderer();
      var defaultCodeFunction = renderer.code;

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
      return renderer;
    })(),

    loadMDEWidget: function($textarea) {
      if($textarea) {
        var simplemde = new SimpleMDE({
          element: $textarea,
          previewRender: function(plainText, preview) {
            setTimeout(function() {
              var rendered = marked(plainText, {renderer: Examples.renderer});
              $(preview).html(rendered);
                Examples.bootstrapExamples();
            }, 0);
            return "Loading...";
          },
          spellChecker: false,
          status: false
        });
        return simplemde;
      }
    },

    renderExample: function($element) {
      var markdown = $element.html();
      var rendered =  marked(markdown, {renderer: Examples.renderer});
      $element.html(rendered);
    },

    renderExamples: function(selector) {
      //render the examples in markdown
      $(selector).each(function() { Examples.renderExample($(this)); });
      // initialize DCL widget for added examples
      Examples.bootstrapExamples();
    }


  };

  bootExamples = function () {

    if ($("#postExampleText").length >= 1) {
      Examples.loadMDEWidget($("#postExampleText")[0]);
    }

    Examples.renderExamples('.example--text');



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
