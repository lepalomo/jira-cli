/**
 * Fix for pkg with axios ES modules issue
 * This script provides alternative solutions for packaging with pkg
 */

const fs = require('fs');
const path = require('path');

console.log('=== PKG with Axios Fix Solutions ===\n');

console.log('Solution 1: Use axios v0.x (compatible with pkg)');
console.log('  npm uninstall axios');
console.log('  npm install axios@0.27.2\n');

console.log('Solution 2: Use alternative HTTP client');
console.log('  npm uninstall axios');
console.log('  npm install got@12\n');

console.log('Solution 3: Patch axios for pkg compatibility');
console.log('  Create a wrapper file that forces CommonJS loading:\n');

const wrapperCode = `// axios-wrapper.js
// Force CommonJS loading for pkg compatibility
const axios = require('axios').default;
module.exports = axios;
`;

console.log('Solution 4: Use pkg with --no-bytecode flag (already in package.json)');
console.log('  This should work with the updated build script.\n');

console.log('Solution 5: Use alternative packaging tool');
console.log('  - nexe: npm install -g nexe');
console.log('  - node-packer: Alternative to pkg');
console.log('  - boxednode: Commercial solution\n');

console.log('Recommended: Try Solution 4 first with the updated build command:');
console.log('  npm run build:win');
console.log('\nIf that fails, use Solution 1 (downgrade axios to 0.27.2)');