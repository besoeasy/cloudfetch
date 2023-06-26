#!/usr/bin/env node

const { getGlobalStats, downloadAria, getDownloadStatus, cancelDownload } = require('./modules/aria2.js');

const { deleteFileIfExists, getFiles, bytesToSize, deleteEmptyFolders, suggestRelatedCommands, fs, getFileMd5 } = require('./modules/utils.js');

const { getIpAddress, getSys, getUptime, httpServer } = require('./modules/os.js');

const { saveDirectory, bot, port, version } = require('./modules/vars.js');

const { spawn } = require('child_process');

bot.on('message', async (ctx) => {
	try {
		const { message_id, from, chat, date, text } = ctx.message;

		const [command, ...args] = text.split(' ');

		const lowerCaseCommand = command.toLowerCase().trim();

		const trimmedArgs = args.map((arg) => arg.trim());

		if (Math.random() < 0.5) {
			console.clear();
		}

		console.log(`@${from.username || 'X'} - ${chat.id} - ${text}`);

		if (text.startsWith('/')) {
			let commandRecognized = true;

			if (lowerCaseCommand === '/start') {
				ctx.reply(`Your user id is: ${chat.id}, Ver : ${version}`);
			} else if (lowerCaseCommand === '/help') {
				ctx.reply(`https://github.com/besoeasy/cloudfetch`);
			} else if (lowerCaseCommand === '/content') {
				const ipAddress = await getIpAddress();

				ctx.reply(`HTTP : http://${ipAddress}:${port}`);
			} else if (lowerCaseCommand === '/stats') {
				const { result: stats } = await getGlobalStats();

				const { totalMemory, freeMemory, usedMemoryPercentage } = await getSys();

				const { uptimeHours, uptimeMinutes } = await getUptime();

				const msgToSend =
					`Server Uptime: ${uptimeHours} hours and ${uptimeMinutes} minutes\n` +
					`\n\n` +
					`Server Memory: ${bytesToSize(totalMemory)}\n` +
					`Free Memory: ${bytesToSize(freeMemory)}\n` +
					`Server Memory Used: ${usedMemoryPercentage}%\n` +
					`\n\n` +
					`Download speed: ${bytesToSize(stats.downloadSpeed)}\n` +
					`Upload speed: ${bytesToSize(stats.uploadSpeed)}\n` +
					`\n\n` +
					`Active downloads: ${stats.numActive}\n` +
					`Waiting downloads: ${stats.numWaiting}\n` +
					`Stopped downloads: ${stats.numStopped}`;

				ctx.reply(msgToSend);
			} else if (lowerCaseCommand === '/files') {
				const files = await getFiles(saveDirectory + chat.id);

				if (files.length < 1) {
					ctx.reply(`No files found !`);
				}

				for (const file of files) {
					const sendFile = file.substring(1);

					const md5h = await getFileMd5(saveDirectory + chat.id + '/' + sendFile);

					ctx.reply(`${sendFile}\n\n/delete_${md5h}`);
				}
			} else if (lowerCaseCommand === '/download' || lowerCaseCommand === '/dl') {
				if (trimmedArgs.length > 0) {
					const [url] = trimmedArgs;

					const { result: ddta } = await downloadAria(chat.id, url);
					const downloadId = ddta.result;

					ctx.reply(
						`Download started with id: ${downloadId} \n\n/status_${downloadId}\n\n/cancel_${downloadId}`
					);
				}
			} else if (lowerCaseCommand.startsWith('/status_')) {
				const downloadId = lowerCaseCommand.split('_')[1];

				const { result: ddta } = await getDownloadStatus(downloadId);

				const downloadSize_c = (ddta.result.completedLength / 1024 / 1024 || 0).toFixed(2);

				const downloadSize_t = (ddta.result.totalLength / 1024 / 1024 || 0).toFixed(2);

				ctx.reply(
					`Download status: ${ddta.result.status} \n\nDownload size: ${downloadSize_c} MB / ${downloadSize_t} MB`
				);
			} else if (lowerCaseCommand.startsWith('/cancel_')) {
				const downloadId = lowerCaseCommand.split('_')[1];

				const { result: ddta } = await cancelDownload(downloadId);

				ctx.reply(`Download canceled with id: ${downloadId}`);
			} else if (lowerCaseCommand.startsWith('/delete_')) {
				ctx.reply(`Deleting file...`);

				const hash = lowerCaseCommand.split('_')[1];

				const files = await getFiles(saveDirectory + chat.id);

				if (files.length < 1) {
					ctx.reply(`No files found !`);
				}

				for (const file of files) {
					const sendFile = file.substring(1);

					const md5h = await getFileMd5(saveDirectory + chat.id + '/' + sendFile);

					if (md5h === hash) {
						deleteFileIfExists(saveDirectory + chat.id + '/' + sendFile);
						ctx.reply(`File deleted: ${sendFile}`);
					}
				}
			} else {
				commandRecognized = false;
			}

			if (!commandRecognized) {
				const suggestions = suggestRelatedCommands(lowerCaseCommand);
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
			'--dht-listen-port=6881-7999',
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
