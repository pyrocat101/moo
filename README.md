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

moo is an **editor-agnostic** markdown live previewer. Write markdown in your favorite editor, save changes, and view pretty HTML output in your browser **instantly**.

## Installation

``` bash
npm install -g moo.js
```

## Usage

**Preview mode:** open live preview for `README.md` in broswer.

``` bash
moo README.md
```

**Export mode:** generate self-contained HTML docs.

``` bash
moo -e ch1.md ch2.md ch3.md # generates ch{1,2,3}.html
```

See `moo --help` for detailed options and examples.

## Features

* Github-flavored markdown out of box
* Pandoc markdown support (requires `pandoc` installation)
* Strip YAML front-matter automatically (Jekyll-friendly)
* Syntax highlight in code-blocks
* Github look-n-feel

![Screenshot](http://i.minus.com/ibnNN6nGKyGKD3.png)

## LICENSE

MIT
