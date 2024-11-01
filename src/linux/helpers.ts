import { spawn } from "child_process";
// @ts-ignore
import qode from "@nodegui/qode";
// @ts-ignore
import { qtHome } from "@vixen-js/core/config/setupQt";
import { loadConfig } from "../utils/config";
import path from "path";
import fs from "fs";

export const { configFile, outputDir } = loadConfig();

const linuxQtBin = path.resolve(__dirname, "..", "..", "deps", "linuxdeployqt");

export const copyQode = (dest: string) => {
  const binFile = qode.qodePath;
  fs.chmodSync(binFile, 0o755);
  fs.copyFileSync(binFile, path.resolve(dest, "qode"));
};

export const copyApplicationRelease = (
  releasePath: string,
  resourceDir: string
) => {
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

const addonCmd = (addons: string[]) => {
  return addons
    .map((addon) => {
      return `-executable=${addon}`;
    })
    .join(" ");
};

export const runLinuxReleaseQT = async (buildDir: string) => {
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

export function copyAppIcon(iconFile: string, destinationFolder: string) {
  if (!fs.existsSync(iconFile)) {
    throw new Error(`AppIcon.png not found at ${iconFile}`);
  }
  fs.copyFileSync(iconFile, path.resolve(destinationFolder, "AppIcon.png"));
}
