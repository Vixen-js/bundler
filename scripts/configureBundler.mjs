#!/usr/bin/env node --no-warnings

import os from "os";
import fs from "fs";
import path from "path";

import { downloadFile } from "@vixen-js/pkg-installer";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const platform = os.platform(__dirname, "..", "deps");
const output = path.resolve();
const linuxBinQt = path.resolve(output, "linuxdeployqt");

function getConfig() {
  const components = [
    {
      name: "QT Deploy for linux",
      link: "https://github.com/probonopd/linuxdeployqt/releases/download/5/linuxdeployqt-5-x86_64.AppImage",
      output: linuxBinQt,
      permissionSetup: async () => {
        console.info("Configuring permissions for Linux QT Deploy");
        return fs.chmodSync(linuxBinQt, 0o755);
      },
    },
  ];

  return components;
}

async function configureBundler() {
  if (platform !== "linux") {
    return console.log("Nothing to configure");
  }

  return Promise.all(
    getConfig().map(async (config) => {
      return downloadFile(config.link, config.output, {
        name: config.name,
        skipIfExists: true,
      }).then(config.permissionSetup);
    })
  );
}

configureBundler().catch((err) => {
  console.error(err);
  process.exit(1);
});
