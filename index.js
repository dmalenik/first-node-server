// import internal Node.js modules
// fs enables interacting with the file system
import * as fs from 'node:fs';
// http supports HTTP protocol features
import * as http from 'node:http';
// path provides utilities to work with a file and a directory paths
import * as path from 'node:path';

// specifies a place the server will be listen to HTTP requests
const PORT = 8000;

// Multipurpose Internet Mail Extensions aka MIME
// identifies a file format of contents passed through the Internet
// consists of a type and a subtype divided by a slash
const MIME_TYPES = {
    default: 'application/octet-stream',
    html: 'text/html; charset=UTF-8',
    js: 'application/javascript',
    css: 'text/css',
    png: 'image/png',
    jpg: 'image/jpg',
    gif: 'image/gif',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
    pdf: 'application/pdf'
};

// joins all given path segments together using platform-specific delimiter as a separator
// /foo, bar, baz/asfd returns /foo/bar/baz/asfd
// the process object provides information about, and control over, the current Node.js process
// process.cwd returns a current working directory of the Node.js process
// returns the current node.js process directory path with a work static in the end
const STATIC_PATH = path.join(process.cwd(), './static');
console.log(STATIC_PATH);

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
    // get all the path fragments available
    const paths = [STATIC_PATH, url];

    // add a file if the url param ends with /
    if (url.endsWith('/')) {
        paths.push('index.html');
    }

    // consilidate path fragments into a united file path
    const filePath = path.join(...paths);
    // to prevent a path traversal attack
    const pathTraversal = !filePath.startsWith(STATIC_PATH); // false
    // tests user's permissions to access to the file or a directory specified by the path and returns a Promise resolved either with no value or an Error object
    const exists = await fs.promises.access(filePath).then(...toBool);
    // whether a file exists or not
    const found = !pathTraversal && exists; // true and true
    const streamPath = found ? filePath : STATIC_PATH + '/404.html';
    // path.extname() returns the extension of the path from the last occurence of the .
    // path.extname('index.html') return .html
    const ext = path.extname(streamPath).substring(1).toLowerCase();
    // send a file from the server to a client as a read-only
    const stream = fs.createReadStream(streamPath);

    return {found, ext, stream};
};

// http.createServer returns a new instance of http.Server
// the requestListener is a function which is added automatically to the request event
// server.listen() starts the HTTP server listening for connections
http.createServer(async (req, res) => {
    // returns a file data based on the url request
    const file = await prepareFile(req.url);
    // checks whether the file is found or not
    const statusCode = file.found ? 200 : 404;
    // find a MIME type for the file
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;

    // returns http.serverResponse
    // sends a response header to the request
    res.writeHead(statusCode, {'Content-Type': mimeType});

    // sends a response back
    file.stream.pipe(res);

    console.log(`${req.method} ${req.url} ${statusCode}`);
}).listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}`);
