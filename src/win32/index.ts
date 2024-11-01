import fs from "fs";
import path from "path";
import { switchToGuiSubsystem } from "./patchQode";

import {
  outputDir,
  configFile,
  copyQode,
  copyApplicationRelease,
  runWinReleaseQT,
} from "./helpers";

export default {
  initialize(name: string) {
    const config = {
      name: null,
    };
    const template = path.resolve(__dirname, "../../template/win32");
    const userTemplate = path.resolve(outputDir, "win32");
    const appDir = path.resolve(userTemplate, name);

    fs.mkdirSync(path.resolve(userTemplate, appDir), { recursive: true });
    fs.cpSync(template, appDir, { recursive: true });
    Object.assign(config, { name });
    fs.writeFileSync(configFile, JSON.stringify(config), { encoding: "utf8" });
  },
  async build(distPath: string) {
    const config = JSON.parse(
      fs.readFileSync(path.resolve(outputDir, "config.json"), "utf8")
    );
    const { name } = config;
    const userTemplate = path.resolve(outputDir, "win32");
    const appTemplate = path.resolve(userTemplate, name);
    const buildDir = path.resolve(appTemplate, "build");

    const buildPkg = path.resolve(buildDir, name);
    console.info("🗑️  Cleaning build Dir...");
    fs.rmSync(buildDir, { recursive: true, force: true });

    console.info("📁 Creating build Directory at ", buildDir);
    fs.cpSync(appTemplate, buildPkg, { recursive: true });

    console.info("🚢 Copying qode to build directory");
    copyQode(buildPkg);

    console.info("📬 Copying application release to build directory");
    copyApplicationRelease(distPath, buildPkg);

    console.info("📦 Running windeployqt...");
    await runWinReleaseQT(buildPkg);

    console.info("🫣 Hiding Qode console...");
    await switchToGuiSubsystem(path.resolve(buildPkg, "qode.exe"));

    console.info("✅ Done.");
  },
};
