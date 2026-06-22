import astroConsent from './dist/index.js';
import fs from 'fs';

const scripts = [];
const integration = astroConsent({ siteName: 'Test Site' });
integration.hooks['astro:config:setup']({ injectScript: (_, code) => scripts.push(code) });

fs.writeFileSync('test-runtime.js', scripts.join('\n'));
console.log('extracted', scripts.length, 'script blocks, bytes:', scripts.join('').length);
