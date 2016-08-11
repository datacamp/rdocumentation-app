$(document).ready(function(){
	$('.exampleR').attr("data-type","sample-code");
	$('.exampleR').wrap("<div class = 'substitute'></div>").parent().prepend("<code class='nohighlight' data-type='pre-exercise-code'>library("+$(".exampleR").attr("data-package-name")+")</code>");
	var substitution = $('.substitute').html();
	$('.substitute').replaceWith("<div data-datacamp-exercise data-lang='r'>"+substitution+"</div>");
});