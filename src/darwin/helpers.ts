import { spawn } from "child_process";
import plist from "plist";
import path from "path";
import fs from "fs";
//@ts-ignore
import qode from "@nodegui/qode";
//@ts-ignore
import { qtHome } from "@vixen-js/core/config/setupQt";
import { loadConfig } from "../utils/config";

const cwd = process.cwd();
const { outputDir, configFile } = loadConfig();

export { outputDir, configFile };
export const usertemplateDir = path.resolve(outputDir, "darwin");
export const buildDir = path.resolve(usertemplateDir, "build");

function getAllNodeAddons(dirPath: string) {
  const addonExt = "node";
  let dir = fs.readdirSync(dirPath);
  return dir
    .filter((elm) => elm.match(new RegExp(`.*\.(${addonExt}$)`, "ig")))
    .map((eachElement) => path.resolve(dirPath, eachElement));
}

function addonCmd(addonPaths: string[]): string {
  return addonPaths
    .map((addon) => {
      return `-executable=${addon}`;
    })
    .join(" ");
}

export function copyQode(dest: string) {
  const qodeBinaryFile = qode.qodePath;
  fs.chmodSync(qodeBinaryFile, "755");
  fs.cpSync(qodeBinaryFile, path.resolve(dest, "qode"), {
    recursive: true,
  });
}

export function copyAppRelease(distPath: string, resourceDir: string) {
  fs.cpSync(distPath, path.resolve(resourceDir, "release"), {
    recursive: true,
  });
}

type macDeployQtOptions = {
  appName: string;
  buildDir: string;
  resourceDir: string;
};

export async function runMacDeployQt({
  appName,
  buildDir,
  resourceDir,
}: macDeployQtOptions) {
  const macDeployQtBin = path.resolve(qtHome, "bin", "macdeployqt");
  try {
    fs.chmodSync(macDeployQtBin, "755");
  } catch (err) {
    console.warn(`Warning: Tried to fix permission for macdeployqt but failed`);
  }
  const distPath = path.resolve(resourceDir, "release");
  const allAddons = getAllNodeAddons(distPath);

  const options = [
    `${appName}.app`,
    "-verbose=3",
    `-libpath=${qode.qtHome}`,
    "-dmg",
    ...addonCmd(allAddons),
  ];

  const macDeployQt = spawn(macDeployQtBin, options, { cwd: buildDir });

  return new Promise((resolve, reject) => {
    macDeployQt.stdout.on("data", function (data) {
      console.log("stdout: " + data.toString());
    });

    macDeployQt.stderr.on("data", function (data) {
      console.log("stderr: " + data.toString());
    });

    macDeployQt.on("exit", function (code) {
      if (!code) {
        return resolve(true);
      }
      return reject("child process exited with code " + code);
    });
  });
}

export function fixupTemplateApp(
  config: { applicationName: string },
  templateAppPath: string
) {
  const infoPlistPath = path.resolve(templateAppPath, "Contents", "Info.plist");
  const infoPlist = fs.readFileSync(infoPlistPath, { encoding: "utf-8" });
  const infoPlistParsed: any = plist.parse(infoPlist);
  infoPlistParsed.CFBundleName = config.applicationName;
  fs.writeFileSync(infoPlistPath, plist.build(infoPlistParsed));
}
