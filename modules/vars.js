
require('dotenv').config();

const { Telegraf } = require('telegraf');

const saveDirectory = process.env.CLOUDFETCHDIR || process.cwd() + '/downloads/';

const bot = new Telegraf(process.env.TELEGRAMBOT);

const port = process.env.PORT || Math.floor(Math.random() * (2890 - 2280 + 1)) + 2280;

const { version } = require('../package.json');

module.exports = { version, saveDirectory, bot, port };