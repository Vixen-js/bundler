import fs from "fs";
import path from "path";
import { spawn } from "child_process";
// @ts-ignore
import qode from "@nodegui/qode";
// @ts-ignore
import { qtHome } from "@vixen-js/core/config/setupQt";
import { loadConfig } from "../utils/config";

const { configFile, outputDir } = loadConfig();

const linuxQtBin = path.resolve(__dirname, "..", "..", "deps", "linuxdeployqt");

const copyQode = (dest: string) => {
  const binFile = qode.qodePath;
  fs.chmodSync(binFile, 0o755);
  fs.copyFileSync(binFile, path.resolve(dest, "qode"));
};

const copyApplicationRelease = (releasePath: string, resourceDir: string) => {
  fs.cpSync(releasePath, path.resolve(resourceDir, "release"), {
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

const addonCmd = (addons: string[]) => {
  return addons
    .map((addon) => {
      return `-executable=${addon}`;
    })
    .join(" ");
};

const runLinuxReleaseQT = async (buildDir: string) => {
  const distPath = path.resolve(buildDir, "dist");
  const allAddons = getAllNodeAddons(distPath);

  const LD_LIBRARY_PATH = `${qtHome}/lib:${process.env.LD_LIBRARY_PATH}`;

  const linuxReleaseQt = spawn(
    linuxQtBin,
    [
      "qode",
      "--verbose=2",
      "--bundle-non-qt-libs",
      "-appimage",
      `-qmake=${path.resolve(qtHome, "bin", "qmake")}`,
      ...addonCmd(allAddons),
    ],
    {
      cwd: buildDir,
      env: {
        ...process.env,
        LD_LIBRARY_PATH,
      },
    }
  );

  return new Promise((resolve, reject) => {
    linuxReleaseQt.stdout.on("data", function (data) {
      console.log("stdout: " + data.toString());
    });

    linuxReleaseQt.stderr.on("data", function (data) {
      console.log("stderr: " + data.toString());
    });

    linuxReleaseQt.on("close", function (code) {
      if (code === 0) {
        return resolve(true);
      } else {
        return reject(`child process failed with exit code ${code}`);
      }
    });
  });
};

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

    console.info("🗑️ Cleaning build Dir...");
    fs.rmSync(buildDir, { recursive: true, force: true });

    console.info("📁 Creating build Directory at ", buildDir);
    fs.cpSync(appTemplate, buildPkg, { recursive: true });

    console.info("🚢 Copying qode to build directory");
    copyQode(buildPkg);

    console.info("📬 Copying application release to build directory");
    copyApplicationRelease(distPath, buildPkg);

    console.info("📦 Running linuxdeployqt...");
    runLinuxReleaseQT(buildPkg);

    console.info("✅ Done.");
  },
};
