import { spawn } from "child_process";
// @ts-ignore
import qode from "@nodegui/qode";
// @ts-ignore
import { qtHome } from "@vixen-js/core/config/setupQt";
import { loadConfig } from "../utils/config";
import fs from "fs";
import path from "path";

export const { configFile, outputDir } = loadConfig();

export const copyQode = (des: string) => {
  const binFile = qode.qodePath;
  fs.chmodSync(binFile, 0o755);
  fs.copyFileSync(binFile, path.resolve(des, "qode.exe"));
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

export const runWinReleaseQT = async (buildDir: string) => {
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
