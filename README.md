<div align="center"><img src="http://gabrielecirulli.github.io/koral/images/logo.svg" width="348" alt="Koral"/></div>

**Koral** is a Version Control system for designers. It's completely free and Open-Source. This repository contains the source of the public website.

**Koral is currently a work in progress.**

## How this repository works

Since for organization repositories GitHub requires the `master` branch to be the one representing the domain on GitHub pages (which we use to power [koral.io](http://koral.io)), this repository works in a slightly different way. **`source`** is the **default branch.**. **`master`** is the branch that represents the GitHub pages site. To make changes, we edit the contents of the `source` branch, then build it for GitHub Pages using the command `gulp deploy`. 

Please do not make changes directly to **master.**
