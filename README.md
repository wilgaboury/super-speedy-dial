# Super Speedy Dial

Download Here: https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/

This is a Firefox extension that replaces the default new tab page with a speed dial home page inspired by the Opera browser. It is designed to seemlessly integrate with your firefox bookmarks.

## Build Instructions

- download the source or clone the git repository
- `> npm install` - install project dependencies
- `> npm run build` - generates build directory and output
- `> npm run dist` - creates dist directory contianing zipped resources for uploading to developer hub

## Main External Libraries Used

- [Solidjs](https://www.solidjs.com) - A reactive javascript framework. This library has impressive benchmark performace and is designed to be developer friendly.
- [Muuri](https://muuri.dev/) - Configurable and flexible layouting library. Used to layout tiles, drag and drop them, and provides nice animations.

## Design Principles

This plugin is designed to look good, work well, and be dead simple. Please feel free to clone the repository and modify the look/feel/functionality as you see fit.

## Tips and General Info

- Bookmark tiles can be dragged around to reorder them
- Right clicking on tiles pulls up a context menu of actions
- The button in the upper left opens a settings drawer
- This extension currently does not work well in private windows

## TODO Items (things I still need to implement/reimplement)

- set background image
- set background solid color
- set start folder - just have button to set current folder
- implement context menu items
- dynamic icon and text size
- drag autoscroll
- dark mode
- test and make sure private browsing works
