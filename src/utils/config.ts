import { resolve } from "path";
import process from "process";

export function loadConfig() {
  const cwd = process.cwd();
  const outputDir = resolve(cwd, "release");
  const configFile = resolve(outputDir, "config.json");

  return {
    outputDir,
    configFile,
  };
}
