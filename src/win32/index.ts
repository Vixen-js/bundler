import fs from "fs";
import path from "path";
import { spawn } from "child_process";
// @ts-ignore
import qode from "@nodegui/qode";
// @ts-ignore
import { qtHome } from "@vixen-js/core/config/setupQt";

import { switchToGuiSubsystem } from "./patchQode";
import { loadConfig } from "../utils/config";

const { configFile, outputDir } = loadConfig();

const copyQode = (des: string) => {
  const binFile = qode.qodePath;
  fs.chmodSync(binFile, 0o755);
  fs.copyFileSync(binFile, path.resolve(des, "qode.exe"));
};

const copyApplicationRelease = (releasePath: string, resourceDir: string) => {
  fs.cpSync(releasePath, path.resolve(resourceDir, "dist"), {
    recursive: true,
  });
};

const getAllNodeAddons = (dirPath: string) => {
  const ext = "node";
  let directory = fs.readdirSync(dirPath);
  return directory
    .filter((file) => file.match(new RegExp(`.*\.(${ext}$)`, "ig")))
    .map((item) => path.resolve(dirPath, item));
};

const runWinReleaseQT = async (buildDir: string) => {
  const qtBin = path.resolve(qtHome, "bin", "windeployqt.exe");
  process.env.PATH = `${path.resolve(qtHome, "bin")};${process.env.PATH}`;

  const distPath = path.resolve(buildDir, "dist");
  const allAddons = getAllNodeAddons(distPath);

  const winReleaseQt = spawn(
    qtBin,
    [
      ...allAddons,
      "--verbose=2",
      "--release",
      "--no-translations",
      "--compiler-runtime",
      `--dir=${buildDir}`,
    ],
    {
      cwd: buildDir,
      env: process.env,
    }
  );

  return new Promise((resolve, reject) => {
    winReleaseQt.stdout.on("data", function (data) {
      console.log("stdout: " + data.toString());
    });

    winReleaseQt.stderr.on("data", function (data) {
      console.log("stderr: " + data.toString());
    });

    winReleaseQt.on("exit", function (code) {
      if (!code) {
        return resolve(true);
      }
      return reject("child process exited with code " + code);
    });
  });
};

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
