<div align="center"><img src="http://gabrielecirulli.github.io/koral/images/logo.svg" width="348" alt="Koral"/></div>

**Koral** is a Version Control system for designers. It's completely free and Open-Source. This repository contains the source of the public website.

**Koral is currently a work in progress.**

## How this repository works

For organization repositories GitHub requires the `master` branch to be the one representing the domain on GitHub Pages (which we use to power [koral.io](http://koral.io)).

This repository works in a slightly different way to accomodate that: **`source`** is the default branch, while **`master`** represents the GitHub Pages site.

To make changes, edit the contents of the `source` branch, then build it for GitHub Pages using the command `gulp deploy`. Never make edits **directly on `master`.**
