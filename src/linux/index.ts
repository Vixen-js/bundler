import fs from "fs";
import path from "path";

import {
  outputDir,
  configFile,
  copyQode,
  copyApplicationRelease,
  runLinuxReleaseQT,
  copyAppIcon,
} from "./helpers";

export default {
  initialize(name: string) {
    const config = {
      name: null,
    };
    const template = path.resolve(__dirname, "../../template/linux");
    const userTemplate = path.resolve(outputDir, "linux");
    const appDir = path.resolve(userTemplate, name);

    fs.mkdirSync(path.resolve(userTemplate, appDir), { recursive: true });
    fs.cpSync(template, appDir, { recursive: true });
    Object.assign(config, { name });
    fs.writeFileSync(configFile, JSON.stringify(config), { encoding: "utf8" });
  },
  build(distPath: string) {
    const config = JSON.parse(
      fs.readFileSync(path.resolve(outputDir, "config.json"), "utf8")
    );
    const { name } = config;
    const userTemplate = path.resolve(outputDir, "linux");
    const appTemplate = path.resolve(userTemplate, name);
    const buildDir = path.resolve(userTemplate, "build");
    const buildPkg = path.resolve(buildDir, name);
    const appIconFile = path.resolve(
      process.cwd(),
      "src/assets/images/AppIcon.png"
    );

    console.info("🗑️ Cleaning build Dir...");
    fs.rmSync(buildDir, { recursive: true, force: true });

    console.info("📁 Creating build Directory at ", buildDir);
    fs.cpSync(appTemplate, buildPkg, { recursive: true });

    console.info("🚢 Copying qode to build directory");
    copyQode(buildPkg);

    console.info("🐧 Copying AppIcon to build directory at ", appIconFile);
    copyAppIcon(appIconFile, buildPkg);

    console.info("📬 Copying application release to build directory");
    copyApplicationRelease(distPath, buildPkg);

    console.info("📦 Running linuxdeployqt...");
    runLinuxReleaseQT(buildPkg);

    console.info("✅ Done.");
  },
};
