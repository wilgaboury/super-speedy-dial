import Background from './background.js';

Muuri.defaultPacker.destroy();
Muuri.defaultPacker = new Muuri.Packer(0);

m.mount(document.body, Background);