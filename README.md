# Wil's Home Page
Download Here: [https://addons.mozilla.org/en-US/firefox/addon/wils-home-page/]

This is a firefox plugin that replaces the default new tab page with a speed dial home page inspired by the Opera browser. It is designed to seemlessly integrate with your current firefox bookmarks. 

## External Libraries Used
* [Mithril](https://mithril.js.org/) - Very lightweight and modern cliend-side JavaScript library for making single page applications. I chose it because it was very easy to learn and the entire library can be put in a single javascript file which makes packaging the plugin easy.
* [Muuri](https://muuri.dev/) - Configurable and flexible layouting library. Used to layout tiles, drag and drop them, and provides nice animations.
* [Font Awesome](https://fontawesome.com/) - Uses the free set of icons.

## Rationale
The main reason I made this was for my own convenience. Having your browser homescreen be an easy graphical way to both access and edit bookmarks is a feature that popular browsers like firefox, chrome, and edge are missing (safari has favorites which is similar but does not support folders). I could not find an even halfway decent free speed dial plugin on the Firefox plugin store as none of them fully integrate with your current firefox bookmarks and most of them look downright ugly. I figured if wanted somthing done right I should just do it myself.

## Current Features
* navigatable grid display of bookmark and folder tiles
* settings page (set background image and root folder for speed dial display)
* make bookmark url and title editable via dialog

## Planned Features (In order of importance)
* graphical reordering of bookmarks with pleasant animations
* new bookmark / new folder buttons
* good looking and customizable images for boomark tiles
* toggleable dark mode / light mode
* button to switch into edit mode (file explorer view for easier editing/moving around of bookmarks)
