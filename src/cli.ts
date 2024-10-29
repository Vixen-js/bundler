#!/usr/bin/env node --no-warnings

import { program } from "commander";
import process from "process";
import { getBundler, Platform } from "./main";

program
  .option("-i, --initialize <name>", "Initialize Deployment")
  .option("-b, --build <distPath>", "Build Application binary");

program.parse(process.argv);

const options = program.opts();

const platform = process.platform;
getBundler(platform as Platform).then(({ default: bundler }) => {
  if (options.initialize) {
    bundler.initialize(options.initialize);
  }

  if (options.build) {
    bundler.build(options.build);
  }
});
