#!/usr/bin/env node
// `npm create aedis` is `aedis init` from the exact @aedis/cli version this package pins; options pass through.
process.argv.splice(2, 0, "init");
await import("@aedis/cli/dist/aedis.js");
