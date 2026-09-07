const test = require('node:test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const files = [
  'server.js',
  'middleware/auth.js',
  'models/User.js',
  'routes/auth.js',
  'routes/oauth.js',
  'utils/seedCars.js',
];

for (const file of files) {
  test(`syntax: ${file}`, () => {
    execFileSync(process.execPath, ['--check', path.resolve(__dirname, '..', file)], { stdio: 'pipe' });
  });
}
