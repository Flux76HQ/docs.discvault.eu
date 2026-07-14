import { execFileSync } from 'node:child_process';

let current = '';
try {
  current = execFileSync('git', ['config', '--local', '--get', 'core.hooksPath'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  // No local value is configured yet.
}

if (current !== '.githooks') {
  execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
}
console.log('Git hooks configured at .githooks.');
