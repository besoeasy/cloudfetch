#!/usr/bin/env node

'use strict';

const { getGlobalStats, downloadAria, getDownloadStatus, cancelDownload } = require('./modules/aria2.js');

const { deleteFileIfExists, getFiles, bytesToSize, deleteEmptyFolders, suggestRelatedCommands, fs, getFileMd5 } = require('./modules/utils.js');

const { getIpAddress, getSys, httpServer } = require('./modules/os.js');

const { saveDirectory, bot, port, version } = require('./modules/vars.js');

const { spawn } = require('child_process');

bot.on('message', async (ctx) => {
	try {
		const { message_id, from, chat, date, text } = ctx.message;

		console.log('@' + (from.username || 'X') + ' - ' + chat.id + ' - ' + text);

		if (text.startsWith('/')) {
			const [command, ...args] = text.split(' ');

			let commandRecognized = true;

			if (command === '/start') {
				ctx.reply(`Your user id is: ${chat.id}, Ver : ${version}`);
			} else if (command === '/help') {
				ctx.reply(`https://github.com/besoeasy/cloudfetch`);
			} else if (command === '/content') {
				var ipAddress = await getIpAddress();

				ctx.reply(`HTTP : http://${ipAddress}:${port}`);
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

					var md5h = await getFileMd5(saveDirectory + chat.id + '/' + sendFile);

					ctx.reply(`${sendFile}\n\n/delete_${md5h}`);
				}
			} else if (command === '/download') {
				if (args.length > 0) {
					const [url] = args;

					var ddta = await downloadAria(chat.id, url.trim());
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
				ctx.reply(`Deleting file...`);

				var hash = command.split('_')[1];

				var files = await getFiles(saveDirectory + chat.id);

				if (files.length < 1) {
					ctx.reply(`No files found !`);
				}

				for (const file of files) {
					var sendFile = file.substring(1);

					var md5h = await getFileMd5(saveDirectory + chat.id + '/' + sendFile);

					if (md5h === hash) {
						deleteFileIfExists(saveDirectory + chat.id + '/' + sendFile);
						ctx.reply(`File deleted: ${sendFile}`);
					}
				}
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
		console.log('Telegram bot token not set ! \nSet TELEGRAMBOT environment variable to your telegram bot token. \n\n');
	} else {
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
			console.log('\n\nPlease install aria2c and try again.\n\naria2c website: https://aria2.github.io/ \n\n');
		});

		bot.launch();

		httpServer.listen(port);
	}
} catch (error) {
	console.log(error);
}
