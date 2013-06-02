$(function() {
  "use strict";
  $(new EventSource('/update-event')).on('message', function () {
      $.getJSON('/content', function (obj) {
        $('.markdown-body')[0].innerHTML = obj.html;
        $(document).trigger('moo:change', obj).first().title = obj.title;
      });
    }).on('error', function () {
      this.close();
    }).trigger('message');
});
