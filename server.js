// Zero-dependency static server, so repro.html is served over http://
// (Playwright's recorder hits a separate "file: URLs are unique origins"
// error on file:// pages, which masks the actual bug.)
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
http
  .createServer((req, res) => {
    const file = req.url === '/' ? 'repro.html' : req.url.slice(1);
    fs.readFile(path.join(__dirname, file), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`repro served at http://localhost:${port}`));
