const path = require("path");

process.chdir(path.resolve(path.dirname(process.execPath)));

require("./release/main.cjs");
