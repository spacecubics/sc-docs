# Documentation for Space Cubics Products

This is the source code for [Space Cubics Documentation Site][1]. It
is based on [Antora][2], an open-source static site generator.

[1]: https://spacecubics.github.io/sc-docs/top/latest/index.html
[2]: https://antora.org/

## How To Build

In order to build it, you need Antora. You can refer to [Antora
Documentation][3] how to install and run.

Here is a quick instructions for those who already know.

### Clone

```
git clone https://github.com/spacecubics/sc-docs
```

### Install

```
cd sc-docs
nvm install --lts
nvm alias default 16
npm install
```

### Build

```
npx antora antora-playbook.yml
```

[3]: https://docs.antora.org/antora/latest/

## How To Build A Single Document

When you are updating or fixing one document set, you may prefer to
build only that component.

As an example, clone the SC-OBC Module V1 Software Manual somewhere on
your machine:

```
git clone https://github.com/spacecubics/scobc-a1-software-manual
```

Edit `antora-playbook.yml` in `sc-docs`.  Point one `content.sources`
entries at your local clone and remove the others, like this:

```
content:
  sources:
    - url: ./
      start_path: top
      branches: HEAD

    - url: /where/to/scobc-a1-software-manual
      branches: [HEAD]
```

In other words, Remove all source entries under content. Add newly
cloned local instead.  Antora allows a local filesystem path in
`content.sources[*].url`, either absolute or relative. You can also
point to a local Git repository or worktree.  See [URLs for Content
Sources][4] for more details.

[4]: https://docs.antora.org/antora/latest/playbook/content-source-url/


Finally, you can build the doc as usual.

```
npx antora antora-playbook.yml
```
