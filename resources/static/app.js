'use strict';
document.addEventListener('DOMContentLoaded', function () {
  var src = new EventSource('/update-event');
  src.onmessage = function () {
    var req, obj;
    req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status === 200) {
          obj = JSON.parse(req.responseText);
          document.querySelector('.markdown-body').innerHTML = obj.html;
          document.title = obj.title;
        } else {
          throw new Error(req.statusText);
        }
      }
    };
    req.open('GET', '/content', true);
    req.send(null);
  };
  src.onerror = function () {
    this.close();
  };
  src.dispatchEvent(new Event('message'));
});