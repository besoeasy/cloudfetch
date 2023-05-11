#!/usr/bin/env node

'use strict';

require('dotenv').config();

const { getGlobalStats, downloadAria, getDownloadStatus, cancelDownload } = require('./modules/aria2.js');

const { deleteFileIfExists, getFiles, str2hex, hex2str, bytesToSize, deleteEmptyFolders, suggestRelatedCommands } = require('./modules/utils.js');

const { getIpAddress, getSys, saveDirectory, port } = require('./modules/os.js');

const { httpServer, ftpServer, rootpassword } = require('./modules/serve.js');

const { getUpdateVer, version } = require('./modules/updater.js');

const { spawn } = require('child_process');

const { Telegraf } = require('telegraf');

const BOT = new Telegraf(process.env.TELEGRAMBOT);

let needUpdate = false;

BOT.on('message', async (ctx) => {
	try {
		const { message_id, from, chat, date, text } = ctx.message;

		console.log('@' + (from.username || 'X') + ' - ' + chat.id + ' - ' + text);

		if (text.startsWith('/')) {
			const [command, ...args] = text.split(' ');

			let commandRecognized = true;

			if (command === '/start') {
				ctx.reply(`Your user id is: ${chat.id}, Ver : ${version}`);

				if (needUpdate) {
					ctx.reply(`You are on lower version please update to latest version to get new features and bug fixes.`);
				}
			} else if (command === '/help') {
				ctx.reply(`
				/content: This command will show you the content data URL. Use it to access your downloaded files directly.

				/download: This command will start a download. Use it like this: /download https://example.com/file.zip

				/stats: This command will show you the server statistics.

				/files: This command will show you the downloaded files.

				/help: This command will show you the help menu.
								
				`);
			} else if (command === '/content') {
				var ipAddress = await getIpAddress();

				ctx.reply(`HTTP : http://${ipAddress}:${port} \n\n\nFTP : ftp://${ipAddress}:${port + 1}\n User : root\n Password : ${rootpassword}`);
			} else if (command === '/tunnel') {
				ctx.reply(`You can also start the web tunnel with the following command:\n\nssh -R 80:localhost:${port} -R 80:localhost:${port + 1} serveo.net\n\nOR\n\nngrok http ${port}`);
			} else if (command === '/stats') {
				const ddta = await getGlobalStats();
				const stats = ddta.result;
				const sys = await getSys();

				const msgtosend =
					`Server Memory: ${bytesToSize(sys.totalMemory)}\n` +
					`Free Memory: ${bytesToSize(sys.freeMemory)}\n` +
					`Server Memory Used: ${sys.usedMemoryPercentage}%\n` +
					`Download speed: ${bytesToSize(stats.downloadSpeed)}\n` +
					`Upload speed: ${bytesToSize(stats.uploadSpeed)}\n` +
					`Active downloads: ${stats.numActive}\n` +
					`Waiting downloads: ${stats.numWaiting}\n` +
					`Stopped downloads: ${stats.numStopped}`;

				ctx.reply(msgtosend);
			} else if (command === '/files') {
				var files = await getFiles(saveDirectory + chat.id);

				if (files.length < 1) {
					ctx.reply(`No files found !`);
				}

				for (const file of files) {
					var sendFile = file.substring(1);
					var hash = str2hex(sendFile);

					ctx.reply(`${sendFile} \n\n/delete_${hash}`);
				}
			} else if (command === '/download') {
				if (args.length > 0) {
					const [url] = args;

					var ddta = await downloadAria(chat.id, url);
					var downloadId = ddta.result;

					ctx.reply(`Download started with id: ${downloadId} \n\n/status_${downloadId}\n\n/cancel_${downloadId}`);
				}
			} else if (command.startsWith('/status_')) {
				var downloadId = command.split('_')[1];

				var ddta = await getDownloadStatus(downloadId);

				var downloadSize_c = (ddta.result.completedLength / 1024 / 1024 || 0).toFixed(2);

				var downloadSize_t = (ddta.result.totalLength / 1024 / 1024 || 0).toFixed(2);

				ctx.reply(`Download status: ${ddta.result.status} \n\nDownload size: ${downloadSize_c} MB / ${downloadSize_t} MB`);
			} else if (command.startsWith('/cancel_')) {
				var downloadId = command.split('_')[1];

				var ddta = await cancelDownload(downloadId);

				ctx.reply(`Download canceled with id: ${downloadId}`);
			} else if (command.startsWith('/delete_')) {
				var hash = command.split('_')[1];

				var file = hex2str(hash);

				await deleteFileIfExists(saveDirectory + chat.id + '/' + file);

				ctx.reply(`${file} deleted !`);
			} else {
				commandRecognized = false;
			}

			if (!commandRecognized) {
				const suggestions = suggestRelatedCommands(command);
				if (suggestions.length > 0) {
					ctx.reply(`Command not found.\n\nDid you mean: ${suggestions} ?`);
				} else {
					ctx.reply('Command not found.\n\nType /help for a list of available commands.');
				}
			}
		}
	} catch (error) {
		console.log(error);
	}
});

try {
	if (!process.env.TELEGRAMBOT) {
		console.log('Telegram bot token not set ! \n');

		console.log('Set TELEGRAMBOT environment variable to your telegram bot token. \n\n');
	} else {
		needUpdate = getUpdateVer();

		deleteEmptyFolders(saveDirectory);

		const aria2c = spawn('aria2c', [
			'--seed-time=60',
			'--enable-rpc',
			'--rpc-listen-all',
			'--rpc-allow-origin-all',
			'--rpc-listen-port=6800',
			'--enable-dht=true',
			'--dht-listen-port=6881-6999',
			'--dht-entry-point=router.bittorrent.com:6881',
			'--dht-entry-point6=router.bittorrent.com:6881',
			'--dht-entry-point6=router.utorrent.com:6881',
			'--dht-entry-point6=dht.transmissionbt.com:6881',
			'--dht-entry-point6=dht.aelitis.com:6881',
		]);

		aria2c.on('error', async (err) => {
			console.log('\n');

			console.log('Please install aria2c and try again.');

			console.log('\n');
		});

		BOT.launch();

		httpServer.listen(port);

		ftpServer.listen();

		console.log('\n');

		console.table({
			'Version': version,
			'aria2c PID': aria2c.pid,
			'HTTP Port': `http://localhost:${port}`,
			'FTP port': `ftp://localhost:${port + 1}`,
		});

		console.log('\n');
	}
} catch (error) {
	console.log(error);
}
