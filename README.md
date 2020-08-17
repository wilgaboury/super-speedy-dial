# Wil's Home Page
This is a firefox plugin that replaces the default new tab page with a replica of opera's speed dial home page. It is designed to seemlessly integrate with your current firefox bookmarks. The main external library used in this project is the Mithril javascript library (essentially a super lightweight react-like library). I chose it because it was very easy to learn and the entire library can be put in a single javascript file which makes packaging the plugin easy. This project also uses the free set of Font Awesome icons.

## Rationale
The main reason I made this was for my own convenience. Having your browser homescreen be an easy graphical way to both access and edit bookmarks is a feature that popular browsers like firefox, chrome, and edge are missing (safari has favorites which is similar but does not support folders). I could not find an even halfway decent free speed dial plugin on the Firefox plugin store as none of them fully integrate with your current firefox bookmarks and most of them look downright ugly. I figured if wanted somthing done right I should just do it myself.

## Current Features
* navigatable grid display of bookmark and folder tiles
* settings page (set background image and root folder for speed dial display)
* make bookmark url and title editable via dialog

## Planned Features
* graphical reordering of bookmarks with pleasant animation
* good looking and customizable images for boomark tiles
* new bookmark / new folder
* toggleable dark mode / light mode
