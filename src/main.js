import Background from './background.js';

// Makes the default muuri layout algorithm run synchronously
Muuri.defaultPacker.destroy();
Muuri.defaultPacker = new Muuri.Packer(0);

m.mount(document.body, Background);