# Help

If you are experiencing a problem with the addon that is not addressed here, please visit the github page and [open a discussion](https://github.com/wilgaboury/super-speedy-dial/discussions/new?category=q-a) or [submit an issue](https://github.com/wilgaboury/super-speedy-dial/issues/new).

A possibly a more up to date version of this document can also be [found on github](https://github.com/wilgaboury/super-speedy-dial/blob/master/help.md).

## Common Issues

### Bookmark tile images not loading

This can happen if you are not connected to the internet when the addon attempts to retrieve images. You can right click on individual bookmark tiles to reload their images or in the toolbar on the upper right find the "Reload" button and use it to bulk reload images.

### Search icon favicons are all missing

This happens for the same reasons as the issue above. Open the search modal and select the refresh button next to the search field to refresh the favicon images.

## Guide To Super Speedy Dial (SSD)

Super speedy dial is convienent and aesthetically pleasing view of the bookmark tree stored in your browser that replaces the default browser new tab page. Any changes in SSD, such as reordering, renaming, creating or deleteing will be reflected in your browser bookmarks and vice-versa.

### The Main UI

The main UI consistes of a few primary components

- Breadcrumb Navigator: Found in the upper left, this is a list of folders from the root to the current. Each folder name is a button that you can click to navigate to it.
- Toolbar: Found in the upper right, this is a group of buttons and a drop down allowing for quick access to a number of specialized actions.
- Tile Grid: An interactive grid represtation of the bookmarks in the current folder.

### The Tile Grid

The tile grid has a number of features that may not be immediatley aparaent.

- Drag and Drop: Users can press + hold + drap to quickly reorder bookmarks.
- Context Menu: Right clicking on a tile will give you a context menu with a specialized list of actions, such as editing, deleting, or opening the bookmark.
- Opening Shortcuts: Bookmark tiles are much like links, they can be opened quickly in a number of ways using keyboard modifiers.

### Tile Open Modifier Shortcuts

| Action        | Result                                                  |
| ------------- | ------------------------------------------------------- |
| click         | opens target in current tab and window                  |
| ctrl + click  | opens target in new tab and then changes to that tab    |
| alt + click   | opens target in new tab but does not change to that tab |
| shift + click | opens target in new window                              |

### Settings Panel

- Light/Dark Mode - In the upper right hand corner there is a light/dark mode switch. This will make the UI use either light background and dark text (light mode) or a dark background and light text (dark mode).
- Background - This is where you can set a background. Press the large button with a plus to upload an image from your computer or use the color picker to choose a flat color for your background.
- Default Folder - This is the bookmark folder that SSD will launch into by when it is opened.
- Customize Sizes - This allows you to change the the sizes of various parts of the main UI. This means the size of tiles, gaps, fonts, and the toolbar.
