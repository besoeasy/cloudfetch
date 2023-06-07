const os = require('os');

const ifaces = os.networkInterfaces();

async function getIpAddress() {
	let ipAddress = 'localhost';

	Object.keys(ifaces).forEach((ifname) => {
		let alias = 0;

		ifaces[ifname].forEach((iface) => {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				return;
			}

			if (alias >= 1) {
				console.log(`${ifname}:${alias}`, iface.address);
			} else {
				console.log(ifname, iface.address);
			}

			alias += 1;
			ipAddress = iface.address;
		});
	});

	return ipAddress;
}

async function getSys() {
	const totalMemory = os.totalmem();

	const freeMemory = os.freemem();

	const usedMemoryPercentage = Math.round((1 - freeMemory / totalMemory) * 100);

	return {
		totalMemory: totalMemory,
		freeMemory: freeMemory,
		usedMemoryPercentage: usedMemoryPercentage,
	};
}

const saveDirectory = process.cwd() + '/downloads/';

const handler = require('serve-handler');

const http = require('http');

const httpServer = http.createServer((request, response) => {
	return handler(request, response, {
		public: saveDirectory,
		rewrites: [{ source: '**', destination: '/index.html' }],
	});
});

module.exports = { getIpAddress, getSys, saveDirectory, httpServer };
