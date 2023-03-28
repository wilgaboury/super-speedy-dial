# Super Speedy Dial

Download Here: https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/

This is a firefox plugin that replaces the default new tab page with a speed dial home page inspired by the Opera browser. It is designed to seemlessly integrate with your current firefox bookmarks.

## Build Instructions

- download the source or clone the git repository
- `> npm install` - install project dependencies
- `> npm run build` - generates build directory and output
- `> ./dist.sh` - creates dist directory contianing zipped resources for uploading to firefox hub

## Main External Libraries Used

- [Solidjs](https://www.solidjs.com) - A reactive javascript framework. This library has impressive benchmark performace and is designed to be developer friendly.
- [Muuri](https://muuri.dev/) - Configurable and flexible layouting library. Used to layout tiles, drag and drop them, and provides nice animations.

## Design Principles

This plugin is designed to look good, work well, be dead simple and have bare minimum configurablitiy. Please feel free to clone the repository and modify the look/feel/functionality as you see fit.
