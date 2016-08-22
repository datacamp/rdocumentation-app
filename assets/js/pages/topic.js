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
          bootstrapDCL();
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
    bootstrapDCL();
  });

};
