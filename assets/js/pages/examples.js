(function($) {

  window.Examples = {
    bootstrapExamples: function() {
      if (urlParam("viewer_pane") == 1) {
        $('.run-example').each(function() {
          var packageName = $(this).parent().parent().data('package-name') || $('.packageData').data('package-name');
          $(this).click(function(){
            Loader.runExample(packageName,$(this).prev().text());
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
          if(RStudio.rpcActive || Loader.containerType === 'web-iframe') {
            $block.append($button);
          }
          return $block.prop('outerHTML');

        }
        else if(lang === '{r}' || lang === 'r') {
          var codeBlock = '<pre>';
          codeBlock += '<code class="R hljs">';
          codeBlock += code;
          codeBlock += '</code>';
          codeBlock += '</pre>';
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
          status: false,
          blockStyles: {
            code: '```'
          },
          toolbar: [ "bold", "italic", "heading",
            "|", "quote", "unordered-list", "ordered-list",
            "|", "link", "image", "table", "horizontal-rule",
            "|", "preview", "side-by-side", "fullscreen",
            "|", "guide",
            "|", "code"
          ],
          placeholder: "## New example\nUse markdown to format your example\n\nR code blocks are runnable and interactive:\n```r\na <- 2\nprint(a)\n```\n\nYou can also display normal code blocks\n```\nvar a = b\n```"
        });
        return simplemde;
      }
    },

    renderExample: function($element) {
      var markdown = $element.html();
      var rendered = marked(markdown, {renderer: Examples.renderer});
      $element.html(rendered);
    },

    renderExamples: function(selector) {
      //render the examples in markdown
      $(selector).each(function() { Examples.renderExample($(this)); });
      // initialize DCL widget for added examples
      Examples.bootstrapExamples();
    },

    validateExample: function(text) {
      var aliases = $('.topic--aliases li').toArray().map(function(li) {
        return $(li).text();
      });

      var predicates = [
        [function(text) { //not empty
          return text.trim() !== ""
        }, "Your example is empty"],
      ];

      var aliasesPredicateText = "Please use "
      if (aliases.length > 1) {
        var aliasesWithoutLast = aliases.slice(0, aliases.length - 1);
        aliasesPredicateText += aliasesWithoutLast.join(', ');
        aliasesPredicateText += " or " + aliases[aliases.length - 1];
      } else {
        aliasesPredicateText += aliases[0]
      }
      aliasesPredicateText += " in your example.";

      if(aliases.length > 0)
        predicates.push([function(text) { //actually contains the function name
          var present = $.grep(aliases, function(item) {
            return text.indexOf(item) >= 0
          });
          return present.length >= 1;
        }, aliasesPredicateText]);

      var result = predicates.reduce(function(acc, predicate) {
        if (acc === true) {
          return predicate[0](text) ? true : predicate[1];
        } else return acc;
      }, true);

      if (result === true) {
        return {
          valid: true
        }
      }
      return {
        valid: false,
        message: result
      }
    }


  };

  bootExamples = function () {

    if ($("#postExampleText").length >= 1) {
      Examples.loadMDEWidget($("#postExampleText")[0]);
    }

    Examples.renderExamples('.example--text');



    $("#openModalExample").bind('modal:ajax:complete',function(){
      var callback = function(){
        var auth = $(".authentication--form").serialize();
        $.post("/modalLogin",auth,function(json){
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
    $(".flash").find(".close").click(function(){
      $(this).parents(".flash")[0].remove();
    });

    $(".example--form form").submit(function(e) {
      var text = $(this).serializeArray()[0].value
      var validation = Examples.validateExample(text);
      if (validation.valid) {
        return true;
      } else {
        alert(validation.message);
        return false;
      }
    });
  };

})($jq);
