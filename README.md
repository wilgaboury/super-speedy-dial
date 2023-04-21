# Super Speedy Dial

Download Here: https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/

Firefox extension that replaces your home page and new tab page with a bookmark speed dial inspired by the Opera browser. It seemlessly uses your current firefox bookmarks and is designed to look good, work well, and be dead simple. Please feel free to use the code as you see fit.

The interface is build using [Solidjs](https://www.solidjs.com) which is an extremely performant reactive javascript framework with a pleasent developer experience.

## Data Collection

This app does NOT collect user information or do telemetry. The reason that "Access your data for all websites" is an optional permission is that it that it is not possible for the website screenshot thumbnails to work without it. The code is open source, so I encourage users to confirm this for themselves.

## Build Instructions

Note: This project uses the Vite build tool, so you MUST use at least version 16.0.0 of Node.js. Preferably, use the latest LTS or newer.

- download the source or clone the git repository
- `> npm install` - install project dependencies
- `> npm run build` - generates build directory and output
- `> npm run dist` - creates zipped build and source for upload to developer hub - only works on linux

## Features and Tips

- Drag and drop reorder bookmarks and edit their names
- Right click on tiles to get a context menu of actions
- Set background image and default folder
- Breadcrumb navigation of bookmark tree
- Toggle between light and dark mode
- Works great in private browsing
- Fast fuzzy search of bookmarks

## Contributing

I'm a solo developer working on this in my free time. It is a passion of mine, but it's also not my job; therefore, I'll try to add features suggested by users, but I will not be implementing any or all feature requests that get submitted. That being said, if you have an idea for a feature and some coding skills, feel free to create a branch off of master and implement it yourself. I will gladly answer questions, provide feedback and do code review.
