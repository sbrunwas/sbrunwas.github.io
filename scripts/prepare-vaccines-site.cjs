// One browser app, two hosts. Stage only the vaccine assets in a separate Sites checkout.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Provide an absolute Sites staging directory.');
const source = path.join(root, 'vaccines');
const target = path.resolve(destination);
if (target === root || target === source || source.startsWith(target + path.sep) || target.startsWith(source + path.sep)) throw new Error('Use a separate staging directory.');
fs.mkdirSync(path.join(target, 'dist'), { recursive: true });
fs.mkdirSync(path.join(target, '.openai'), { recursive: true });
fs.mkdirSync(path.join(target, 'dist/assets/js'), { recursive: true });
fs.copyFileSync(path.join(root, 'assets/js/site-analytics.js'), path.join(target, 'dist/assets/js/site-analytics.js'));
// The loader only counts sbrunwas.github.io; the private Sites host stays excluded.
for (const file of ['index.html', 'styles.css', 'schedule.js', 'app.js', 'cdph-imm-395-2025.png']) {
  fs.copyFileSync(path.join(source, file), path.join(target, 'dist', file));
}
fs.copyFileSync(path.join(source, '.openai/hosting.json'), path.join(target, '.openai/hosting.json'));
fs.writeFileSync(path.join(target, 'README.md'), 'Well-Child Vaccine Timing\n\nCanonical source: https://github.com/sbrunwas/sbrunwas.github.io/tree/master/vaccines\nGenerated with scripts/prepare-vaccines-site.cjs. Edit the canonical source and restage for both hosts.\n');
console.log('Staged vaccine app in ' + target);
