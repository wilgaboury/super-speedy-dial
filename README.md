# Super Speedy Dial

Download from the [Firefox Addon Store](https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/)

Firefox extension that replaces your home page and new tab page with a bookmark speed dial inspired by the Opera browser. It seamlessly uses your current firefox bookmarks and is designed to look good, work well, and be dead simple. Please feel free to use the code as you see fit.

The interface is build using [Solidjs](https://www.solidjs.com) which is an extremely performant reactive javascript framework with a pleasant developer experience.

## Data Collection

This addon does NOT collect user information or do telemetry. The "Access your data for all websites" permission is needed in order for the addon to fetch thumbnail images for each bookmark. This permission is disabled by default to comply with Firefox's permissions policy, but for full functionality, I would strongly encourage users to turn it on. The code is open source, so please check for yourself that there is nothing malicious about how this information is used.

## Build Instructions

- Use linux system with BASH and GNU Make (version >= 4.3) installed
- Install Node.js, the latest LTS version or newer (find that information here: https://nodejs.org)
- Update NPM to the latest version (run `npm install -g npm@latest`, may require `sudo`)
- Download the source or clone the git repository and `cd` into directory
- `> make dist-addon` - generates build artifacts in `./build` and creates a zip archive of them placed at `./dist/super-speedy-dial.zip`

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

To get a list of development commands and descriptions run `make` or `make help`.

### Style Guidlines

- Use the Prettier formatting tool
- Use camel case event callback names in JSX
