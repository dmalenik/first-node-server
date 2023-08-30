import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';

// specify a place the server will be listen to HTTP requests
const PORT = 8000;

// Multipurpose Internet Mail Extensions
// consists of a type and a subtype divided by a slash
// identify a file format of contents passed through the Internet
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

// join all given path segments together using platform-specific delimiter as a separator
// /foo, bar, baz/asfd --> /foo/bar/baz/asfd

// the process object provides information about, and control over, the current Node.js process
// process.cwd returns a current working directory of the Node.js process
const STATIC_PATH = path.join(process.cwd(), './static');

const toBool = [() => true, () => false];

// creates a path to a file
// checks whether the path is exists 
// sets a stream for the file to reading if the path is accessible
const prepareFile = async (url) => {
    // set a path to files
    const paths = [STATIC_PATH, url];

    // add a file name to the url based on the request
    if (url.endsWith('/')) {
        paths.push('index.html');
    }

    // get a full ultimate path to specific file
    const filePath = path.join(...paths);
    // prevent the disclosure of the full path to static file
    const pathTraversal = !filePath.startsWith(STATIC_PATH);
    // check if the file is exists under the given file path
    // check for the accessibility of the file only if the file will not be used directly
    const exists = await fs.promises.access(filePath).then(...toBool);
    // check whether a file exists or not
    const found = !pathTraversal && exists;
    const streamPath = found ? filePath : STATIC_PATH + '/404.html';
    // returns the extension of the path from the last occurence of the . // .html
    const ext = path.extname(streamPath).substring(1).toLowerCase();
    // allow a client to read a file based on a path provided
    const stream = fs.createReadStream(streamPath);

    return {found, ext, stream};
};

// http.createServer returns a new instance of http.Server
// the requestListener is a function which is added automatically to the request event
// server.listen() starts the HTTP server listening for connections

// sets HTTP heading
// sends the response back in the created stream
http.createServer(async (req, res) => {
    const file = await prepareFile(req.url);
    // define the status of the file
    const statusCode = file.found ? 200 : 404;
    // define the MIME type of the file
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;

    // define HTTP header on response to the request
    res.writeHead(statusCode, {'Content-Type': mimeType});

    // limit the data buffering and adjust the transfering speed for devices with different speed limits
    file.stream.pipe(res);

    console.log(`${req.method} ${req.url} ${statusCode}`);
}).listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}`);

// prepare a file to be streamed
// establish HTTP connection and push a stream to the client
