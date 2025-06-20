import { defineCommand } from 'citty';
import { resolve } from 'pathe';
import { l as loadKit } from '../shared/cli.DlcAx0De.mjs';
import { c as cleanupNuxtDirs } from '../shared/cli.CFGy0wx0.mjs';
import { b as legacyRootDirArgs, c as cwdArgs } from '../shared/cli.CyjRwZnH.mjs';
import 'jiti';
import 'node:fs';
import 'ohash';
import '../shared/cli.BI-F07wL.mjs';
import 'node:path';
import 'node:process';
import 'std-env';
import 'consola';
import 'node:url';

const cleanup = defineCommand({
  meta: {
    name: "cleanup",
    description: "Clean up generated Nuxt files and caches"
  },
  args: {
    ...cwdArgs,
    ...legacyRootDirArgs
  },
  async run(ctx) {
    const cwd = resolve(ctx.args.cwd || ctx.args.rootDir);
    const { loadNuxtConfig } = await loadKit(cwd);
    const nuxtOptions = await loadNuxtConfig({ cwd, overrides: { dev: true } });
    await cleanupNuxtDirs(nuxtOptions.rootDir, nuxtOptions.buildDir);
  }
});

export { cleanup as default };
