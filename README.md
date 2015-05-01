# Moo

```
   _____________________
  /   _ __   ___  ___   \
  |  | '  \ / _ \/ _ \  |
  \  |_|_|_|\___/\___/  /
   ---------------------
          \   ^__^
           \  (oo)\_______
              (__)\       )\/\\
                  ||----w |
                  ||     ||
```

moo is your **editor-agnostic** markdown live previewer. Write markdown in your favorite editor, save changes, and view pretty HTML output in your browser **instantly**.

![demo](artwork/demo.gif)

## Features

* Live preview
* Github-flavored markdown
* Strip YAML front-matter automatically (Jekyll-friendly)
* Syntax highlight in code-blocks
* Github look-and-feel

## Usage

**Preview:** open live preview for `README.md` in browser.

``` bash
moo README.md
moo -p 8888 README.md             # http://127.0.0.1:8888
```

**Export:** generate self-contained HTML docs.

``` bash
moo --export ch1.md ch2.md ch3.md # generates ch{1,2,3}.html
moo -e *.md                       # export all markdown files to HTML docs with inline css
moo -e --disable-css *.md         # export without css
cat README.md | moo -e - | less   # export STDIN to STDOUT
```

**Custom css:** use the specified CSS.

```bash
moo -c ~/style.css README.md      # use `~/style.css` for styling README.md
moo -e -c style.css README.md     # generates README.html with style.css embed
```

## Installation

``` bash
pip install moo
```

### Sublime support

1. Create file ``Markdown.sublime-build`` in ``Packages/User/``
2. copy and paste below content.

    ```json
    {
        "cmd": ["subl", "$file"],
        "osx":
        {
            "cmd": ["moo", "$file"],
        },
    }
    ```

3. ``compile`` and enjoy!

## LICENSE

MIT