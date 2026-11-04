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
npx antora --fetch antora-playbook.yml
```

[3]: https://docs.antora.org/antora/latest/

## How To Build A Single Document

When you are updating or fixing one document set, you may prefer to
build only that component.

As an example, to build the SC-OBC Module V1 manual, clone its documentation
repository next to `sc-docs`:

```
git clone https://github.com/spacecubics/sc-docs-v1
```

After clone them, you will have directories like this:

```
tree -L 1
.
├── sc-docs
└── sc-docs-v1

```

Then, you can build the documentation using antora-playbook-v1-local.yml:

```
cd sc-docs
npx antora --fetch antora-playbook-v1-local.yml
```

## How To Build With A Local UI

When you are updating or fixing the UI, you may prefer to
build it locally without waiting for a release.

To build the UI, clone its repository next to `sc-docs`:

```
git clone --branch main https://github.com/spacecubics/sc-docs-ui
```

After cloning, you will have directories like this:

```
tree -L 1
.
├── sc-docs
└── sc-docs-ui

```

Then, you can build the UI assets:

```
cd sc-docs-ui
npm install
npx gulp build
```

Build the documentation using the local UI bundle:

```
cd ../sc-docs
npx antora --fetch antora-playbook.yml --ui-bundle-url ../sc-docs-ui/public/_
```

The same option works with the single-document local playbooks:

```
npx antora antora-playbook-v1-local.yml --ui-bundle-url ../sc-docs-ui/public/_
npx antora antora-playbook-a1-local.yml --ui-bundle-url ../sc-docs-ui/public/_
```

After editing the UI sources, run `npx gulp build` in `sc-docs-ui` again
before rebuilding the documentation.
