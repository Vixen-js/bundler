import fs from "fs";
import path from "path";

import {
  outputDir,
  configFile,
  fixupTemplateApp,
  copyQode,
  copyAppRelease,
  runMacDeployQt,
  usertemplateDir,
  buildDir,
} from "./helpers";

export default {
  initialize(name: string) {
    const template = path.resolve(__dirname, "../../template/darwin");
    const appTemplate = path.resolve(usertemplateDir, `${name}.app`);
    fs.mkdirSync(path.resolve(usertemplateDir, appTemplate), {
      recursive: true,
    });

    fs.cpSync(template, appTemplate, { recursive: true });
    const config = {
      name,
    };
    fs.writeFileSync(configFile, JSON.stringify(config), {
      encoding: "utf8",
    });
    fixupTemplateApp(config, appTemplate);
  },
  async build(distPath: string) {
    const config = JSON.parse(
      fs.readFileSync(path.resolve(outputDir, "config.json"), "utf8")
    );
    const { name } = config;

    const appTemplate = path.resolve(usertemplateDir, `${name}.app`);
    const buildPkg = path.resolve(buildDir, `${name}.app`);
    const Contents = path.resolve(buildPkg, "Contents");
    const MacOs = path.resolve(Contents, "MacOS");
    const Resources = path.resolve(Contents, "Resources");

    console.info("🗑️  Cleaning build Dir...");
    fs.rmSync(buildDir, { recursive: true, force: true });

    console.info("📁 Creating build Directory at ", buildPkg);
    fs.cpSync(appTemplate, buildPkg, { recursive: true });

    console.info("🚢 Copying qode to build directory");
    copyQode(MacOs);

    console.info("📬 Copying application release to build directory");
    copyAppRelease(distPath, Resources);

    console.info("📦 Running macdeployqt...");
    await runMacDeployQt({
      appName: name,
      buildDir,
      resourceDir: Resources,
    });

    console.info("✅ Done.");
  },
};
