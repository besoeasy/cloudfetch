const fs = require('fs');

const path = require('path');

replaceStringInArray = (array, stringToFind, stringToReplace) => {
	const newArray = array.map((item) => {
		if (item.includes(stringToFind)) {
			return item.replace(stringToFind, stringToReplace);
		}
		return item;
	});
	return newArray;
};

function getFiles(dir, filesList = []) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			getFiles(filePath, filesList);
		} else {
			filesList.push(filePath);
		}
	}

	return replaceStringInArray(filesList, dir, '');
}

function deleteFileIfExists(filePath) {
	fs.unlink(filePath, (err) => {
		if (err) {
			if (err.code === 'ENOENT') {
				console.log(`File ${filePath} does not exist`);
			} else {
				console.error(err);
			}
			return;
		}

		console.log(`File ${filePath} has been deleted`);
	});
}

function str2hex(str) {
	var arr = [];
	for (var i = 0, l = str.length; i < l; i++) {
		var hex = Number(str.charCodeAt(i)).toString(16);
		arr.push(hex);
	}
	return arr.join('');
}

function hex2str(hex) {
	var str = '';
	for (var i = 0; i < hex.length; i += 2) {
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}
	return str;
}

function bytesToSize(bytes) {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes == 0) return '0 Byte';
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function deleteEmptyFolders(dir) {
	if (fs.existsSync(dir)) {
		fs.readdirSync(dir).forEach((file) => {
			const curPath = path.join(dir, file);
			if (fs.lstatSync(curPath).isDirectory()) {
				// recurse
				deleteEmptyFolders(curPath);
			}
		});
		if (fs.readdirSync(dir).length === 0) {
			fs.rmdirSync(dir);
		}
	}
}

function suggestRelatedCommands(inputCommand) {
	const commands = ['/start', '/help', '/content', '/stats', '/files', '/download', '/status_', '/cancel_', '/delete_', '/fetch_'];
	const maxEditDistance = 3;
	const suggestions = [];

	for (const command of commands) {
		const editDistance = levenshteinDistance(inputCommand, command);
		if (editDistance <= maxEditDistance) {
			suggestions.push(command);
		}
	}

	return suggestions.join(', ');
}

function levenshteinDistance(a, b) {
	const matrix = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	for (let i = 0; i <= a.length; i++) {
		matrix[0][i] = i;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
			}
		}
	}

	return matrix[b.length][a.length];
}

module.exports = { suggestRelatedCommands, levenshteinDistance, bytesToSize, str2hex, hex2str, getFiles, deleteFileIfExists, deleteEmptyFolders, fs };
