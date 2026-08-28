import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

function resolveNixOutput(packageName) {
  try {
    return execFileSync(
      'nix',
      ['eval', '--raw', `nixpkgs#${packageName}.outPath`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
  } catch {
    return '';
  }
}

const env = { ...process.env };
const libglvndOutput = resolveNixOutput('libglvnd');
const gstLibavOutput = resolveNixOutput('gst_all_1.gst-libav');

env.LD_LIBRARY_PATH = [
  libglvndOutput && path.join(libglvndOutput, 'lib'),
  gstLibavOutput && path.join(gstLibavOutput, 'lib'),
  gstLibavOutput && path.join(gstLibavOutput, 'lib', 'gstreamer-1.0'),
  env.REPLIT_LD_LIBRARY_PATH,
  env.LD_LIBRARY_PATH,
]
  .filter(Boolean)
  .join(':');

if (gstLibavOutput) {
  env.GST_PLUGIN_PATH = [
    path.join(gstLibavOutput, 'lib', 'gstreamer-1.0'),
    env.GST_PLUGIN_PATH,
  ]
    .filter(Boolean)
    .join(':');
}

if (libglvndOutput && gstLibavOutput && env.REPLIT_LD_LIBRARY_PATH) {
  env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = '1';
}

const playwrightCommand =
  process.platform === 'win32' ? 'playwright.cmd' : 'playwright';

function runPlaywright(args) {
  const result = spawnSync(playwrightCommand, args, {
    env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

const installStatus = runPlaywright([
  'install',
  'chromium',
  'firefox',
  'webkit',
]);

if (installStatus !== 0) process.exit(installStatus);

process.exit(
  runPlaywright([
    'test',
    '--config',
    'playwright.config.ts',
    ...process.argv.slice(2),
  ]),
);