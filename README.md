# Super Speedy Dial

Download Here: https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/

Firefox extension that replaces your home page and new tab page with a bookmark speed dial inspired by the Opera browser. It seamlessly uses your current firefox bookmarks and is designed to look good, work well, and be dead simple. Please feel free to use the code as you see fit.

The interface is build using [Solidjs](https://www.solidjs.com) which is an extremely performant reactive javascript framework with a pleasant developer experience.

## Data Collection

This app does NOT collect user information or do telemetry. The reason that "Access your data for all websites" is an optional permission is that it is not possible for automatic website screenshot thumbnails to work without it. If you don't care about this feature or are concerned about privacy, I encourage users to leave the permission disabled. The code is open source, so please check for yourself that there is nothing malicious about how this information is used.

## Build Instructions

This addon uses Vite + Rollup for its build process. In order to avoid issues, it is HIGHLY RECOMENDED you use the latest Node.js LTS version or newer (found here: https://nodejs.org) and the latest version of NPM (run `npm install -g npm@latest`, may require `sudo`). This project's build process also uses `make` and other Linux specific command line tools.

- download the source or clone the git repository
- `> make` - install project dependencies and generate build directory and output
- `> make distAddon` - creates `dist/super-speedy-dial.zip`, a zip archive of the build output

## Development Commands

- `> npm run dev` - starts a continual process that will watch for file changes and automatically rebuild the addon, placing the output in the`build_dev` directory
- `> make clean` - delete all build outputs
- `> make cleanAll` - deletes build outputs and `node_modules`
- `> make distSource` - creates a zip archive of the source placed at `dist/source.zip`, this command uses `git archive` so it must be performed inside a clone of the repo
- `> make dist` - does the same as running both `distAddon` and `distSource`

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

## Coding Style

- Use Prettier formatter
- Always prefer to use camel case event callbacks in JSX
