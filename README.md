# Super Speedy Dial

Download Here: https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/

This is a firefox plugin that replaces the default new tab page with a speed dial home page inspired by the Opera browser. It is designed to seemlessly integrate with your current firefox bookmarks.

## Build Instructions

- clone the git repository
- `> npm install` - install project dependencies
- `> npm run build` - generates build directory and output
- `> ./dist.sh` - creates dist directory contianing zipped resources for uploading to firefox hub

## Main External Libraries Used

- [Solidjs](https://www.solidjs.com) - A reactive javascript framework. This library has impressive benchmark performace and is designed to be developer friendly.
- [Muuri](https://muuri.dev/) - Configurable and flexible layouting library. Used to layout tiles, drag and drop them, and provides nice animations.

## Rationale

The main reason I made this was for my own convenience. Having your browser homescreen be an easy graphical way to both access and edit bookmarks is a feature that popular browsers like firefox, chrome, and edge are missing (safari has favorites which is similar but lacking in features). Most of the speed dial plugins on the Firefox store do not integrate well with your current firefox bookmarks or are missing critical functionality (in my opinion). I figured if wanted somthing done right I should just do it myself.

## Current Features

- navigatable grid display of bookmarks and folders
- settings page
  - upload background image
  - Set root folder for speed dial display
- bookmark/folder are deletable and their titles are editable
- graphical reordering of bookmarks (drag and drop) with pleasant animations

## Planned Features (In order of importance)

- search bar, easily search all bookmarks
- Edit mode - an explorer like interface for moving and editing bookmarks
- bookmark tile thumbnail customization
- toggleable dark mode / light mode
