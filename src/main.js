import Background from './background.js';
import Redirect from './redirect.js';

// Makes the default muuri layout algorithm run synchronously
Muuri.defaultPacker.destroy();
Muuri.defaultPacker = new Muuri.Packer(0);

// m.mount(document.body, Background);
m.route(document.body, '/', {
    '/': Redirect, 
    '/folder/:bookmarkId': Background
});