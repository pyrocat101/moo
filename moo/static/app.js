"use strict";
$.domReady(function() {
    (function poll() {
        var polling_interval = 1000;
        var content$ = $('#content');
        var timestamp = content$.data('timestamp');
        var request = {'timestamp': timestamp};

        setTimeout(function() {
            $.ajax({
                url: '/update',
                type: 'json',
                method: 'post',
                data: JSON.stringify(request),
                contentType:"application/json; charset=utf-8",
                success: function(data) {
                    if (data && (data.html_part !== null)) {
                        // Fill the title
                        document.title = data.title;
                        content$.data('timestamp', data.timestamp);
                        // Replace content with latest one
                        content$.empty().html(data.html_part);
                    }
                },
                complete: poll
            });
        }, polling_interval);
    })();
});
