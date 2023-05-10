const { createServer: https } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");

const app = next({ dev: true });
const handle = app.getRequestHandler();

const ports = {
  https: process.env.PORT || 3443,
};

const httpsOptions = {
  key: fs.readFileSync("./mykey.key"),
  cert: fs.readFileSync("./mycert.pem"),
};

app.prepare().then(() => {
  https(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(ports.https, (err) => {
    if (err) throw err;
    console.log(`> HTTPS: Ready on https://localhost:${ports.https}`);
  });
});
