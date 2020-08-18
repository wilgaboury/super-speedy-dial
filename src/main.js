import Background from './background.js';
import { addWindowResizeListener } from './grid_width_hack.js'

// addWindowResizeListener();

Muuri.defaultPacker.destroy();
Muuri.defaultPacker = new Muuri.Packer(0);

m.mount(document.body, Background);