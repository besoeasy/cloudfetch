const axios = require('axios');

const { version } = require('../package.json');

let needUpdate = false;

const getUpdateVer = async () => {
	return axios.get(`https://unpkg.com/cloudfetch/package.json`).then((response) => {
		const npmVersion = response.data.version || 0;

		if (npmVersion > version) {
			console.log('\n\n');

			console.log('You are on lower version please update to latest version to get new features and bug fixes.');
			console.log('\n');

			console.table({
				'LOCAL Version': version,
				'NPMJS Version': npmVersion,
			});

			console.log('\n');
			console.log('npm install -g cloudfetch');
			console.log('\n\n');

			needUpdate = true;
		}

		return needUpdate;
	});
};

module.exports = {
	getUpdateVer,
	version,
};
