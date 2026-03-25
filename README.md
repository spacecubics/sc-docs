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
npm install
```

### Build

```
npx antora antora-playbook.yml
```

[3]: https://docs.antora.org/antora/latest/

> [!NOTE]
> Antora does NOT fetch anything if you have your repos already
> cached.  Make sure to use `--fetch` if you are rebuilding after any
> push or merged upstream.
> ```
> npx antora --fetch antora-playbook.yml
> ```
> https://docs.antora.org/antora/latest/playbook/runtime-fetch/#fetch-option

## How To Build A Single Document

When you are updating or fixing one document set, you may prefer to
build only that component.

As an example, to build the SC-OBC Module V1 manual, you need the
following three additional repositories:

```
git clone https://github.com/spacecubics/scobc-v1-product-manual v1-product
git clone https://github.com/spacecubics/scobc-v1-software-manual v1-software
git clone https://github.com/spacecubics/scobc-v1-fpga-developers-guide v1-fpga
```

After clone them, you will have directories like this:

```
tree -L 1
.
├── sc-docs
├── v1-fpga
├── v1-product
└── v1-software

```

Then, you can build the documentation using antora-playbook-v1-local.yml:

```
cd sc-docs
npx antora antora-playbook-v1-local.yml
```
