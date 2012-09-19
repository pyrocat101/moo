# Moo

Moo is a mini markdown render server that provides preview of markdown files. It can automatically reload the preview in your broswer when the monitored file changes, which makes it suitable to live preview markdown in editors that does not provide this feature. Plugins can be easily written to interface with it.

![Screenshot](http://i.minus.com/ibnNN6nGKyGKD3.png)

Moo uses github's own [sundown][sundown] library to provide github flavored markdown preview. The stylesheet of the preview is extracted from the github website.

## Why Moo?

The idea of Moo is inspired by [instant-markdown-d][imd], a Node.js server with similar function. However, instant-markdown-d also depends on Ruby to provide syntax highlight (which interfaces with Python's pygments library). I use Vim in both Windows and Linux, and precompiled gVim for Windows often lacks Ruby interface. Considering cross-platform availability, I decide to implement a markdown preview server in Python.

## Installation

```
pip install moo
```

## RESTful API

| Action                  | HTTP Method | Request URL                      | Requst Body            |
|-------------------------|-------------|----------------------------------|------------------------|
| Get preview             | GET         | http://localhost:\<port\>        | \<Preview content\>    |
| Get update notification | GET         | http://localhost:\<port\>/update | update                 |
| Close server            | DELETE      | http://localhost:\<port\>        |                        |

By default, `port` is 5000

## Under the Hood

* Moo uses [misaka][misaka], a python wrapper of sundown, to render Markdown into HTML.
* Moo uses pygments to provide syntax highlight in code blocks.
* Moo uses [server-sent events][sse] to implement client-side reload on file changes. Server-sent events is a broswer API that enables server push. Once the monitored markdown file changes, the server push an update notification to the broswer, and the broswer subscribes to the update with a callback to reload the page itself. See Alex MacCaw's (author of Juggernaut) post [Killing a library][killing] for more information.

[sundown]: https://github.com/vmg/sundown
[imd]: https://github.com/suan/instant-markdown-d
[sse]: http://dev.w3.org/html5/eventsource/
[misaka]: https://github.com/FSX/misaka
[killing]: http://blog.alexmaccaw.com/killing-a-library