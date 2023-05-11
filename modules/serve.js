const handler = require('serve-handler');

const FtpSrv = require('ftp-srv');

const http = require('http');

const { generateRandString } = require('./utils.js');

const { port, host, saveDirectory } = require('./os.js');

const rootpassword = generateRandString().substring(0, 6);

const httpServer = http.createServer((request, response) => {
	return handler(request, response, {
		public: saveDirectory,
		rewrites: [{ source: '**', destination: '/index.html' }],
	});
});

const ftpServer = new FtpSrv({
	url: `ftp://${host}:${port + 1}`,
	pasv_url: host,
	anonymous: false,
	greeting: ['Welcome to the FTP server'],
});

ftpServer.on('login', ({ connection, username, password }, resolve, reject) => {
	if (username === 'root' && password === rootpassword) {
		resolve({ root: saveDirectory });
	} else {
		reject(new Error('Invalid username or password'));
	}
});

module.exports = { httpServer, ftpServer, rootpassword };
