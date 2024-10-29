export type Platform = "darwin" | "win32" | "linux";

export async function getBundler(platform: Platform) {
  switch (platform) {
    case "darwin":
      return await import("./darwin");
    case "win32":
      return await import("./win32");
    case "linux":
      return await import("./linux");
    default: {
      throw new Error(`Unsupported platform (${platform})`);
    }
  }
}
