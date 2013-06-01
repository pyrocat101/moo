$.domReady(function() {
  "use strict";
  var update = function () {
    $.ajax({
      url: '/content',
      type: 'json',
      success: function (obj) {
        $('.markdown-body').html(obj.html);
        document.title = obj.title;
      }
    });
  };
  var source = new EventSource('/update-event');
  source.onmessage = update;
  source.onerror = function () {
    source.close();
  };
  // get content immediately
  update();
});
