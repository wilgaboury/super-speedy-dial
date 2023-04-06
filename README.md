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

## Design Principles

This plugin is designed to look good, work well, and be dead simple. Please feel free to clone the repository and modify the look/feel/functionality as you see fit.

## Tips and General Info

- Bookmark tiles can be dragged around to reorder them
- Right clicking on tiles pulls up a context menu of actions
- The button in the upper left opens a settings drawer

## Assorted TODO Items (TODO: make these issues in github)

- edit bookmark rename, cancel button doesn't cancel the changes
- implement open all in folder
- implement delete folder - make delete button have be pressed and held for over 2 seconds
- save scroll position to history state
- implement drag autoscroll
- do releases and make sure add-on can be installed from zip
- dynamic icon and text size - part of this will be redoing html/css of tiles padding,margins,etc.
- dark mode
- test and make sure private browsing works
- manually test and make sure storage.local database works correctl, last I checked seems like there are problems but it might be faster than indexeddb
- cleanup css
- add multiscelect/open mode so that that you can click on multiple tiles and open them all at once
- add choose image dialog with image carosel
- make it impossible to end up in non-existent folder, always redirect to root, have default setting be undefined and load root id on settings
- Experiment with using a store instead of a plain list signal for the bookmark list. Subsequently update stale views using the web visibility api or check window focus.
- Minor detail: make close animation of context menu happen when clicking to new context menu - probably not worth it because it would require rethinking how context menu is done
- use solidjs primitives library and clean up code that duplicates better implemented functionality
- handle unmodifiable bookmarks
- Still need to investigate and handle when some images have height/width of 0 and load forever
