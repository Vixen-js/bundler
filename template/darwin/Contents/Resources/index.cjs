const path = require("path");

process.chdir(path.resolve(path.dirname(process.execPath), "..", "Resources"));

require("./dist/main.cjs");
