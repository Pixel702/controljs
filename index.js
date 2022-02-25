#!/usr/bin/env node

// Modules
import chalk from 'chalk';
import inquirer from 'inquirer';
import gradient from 'gradient-string';
import chalkAnimation from 'chalk-animation';
import figlet from 'figlet';
import Discord from 'discord.js';

import { createSpinner } from 'nanospinner';

// Client
const client = new Discord.Client({ intents: [
	1 << 0,
	1 << 1,
	1 << 8
]});

// Variables
let token;
let chosenServer;

// Functions
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function load() {
	const rainbowTitle = chalkAnimation.rainbow(
		'Welcome to control.js'
	);

	await sleep()
	rainbowTitle.stop();

	console.log(`
		${chalk.bgBlue('HOW TO USE')}
		This application only logs in to the bot using the token provided.
		${chalk.bgRed("ONLY YOU KNOW THE TOKEN")}.
		When it's logged in you will see the servers that the bot is in.
		A list of channels will appear.
	`);
};

async function tokenProvider() {
	const answers = await inquirer.prompt({
		name: 'token',
		type: 'input',
		message: 'What is the bot token?',
	});

	token = answers.token;

	const spinner = createSpinner("Logging in...").start();

	await sleep();

	await client.login(token)
		.then(() => {
			spinner.success({ text: 'Logged in!' });
		})
		.catch(err => {
			spinner.error({ text: 'TOKEN PROVIDED WAS NOT VALID' });
			console.log(err);
			process.exit(1);
		});
};

async function serverList() {
	console.log("");

	const servers = [];

	client.guilds.cache.forEach(guild => {
		servers.push(`${guild.id}`);
	});

	const answers = await inquirer.prompt({
		name: 'servers',
		type: 'list',
		message: 'Choose a server',
		choices: servers,
	});

	const answer = answers.servers;

	const spinner = createSpinner(`Choosing [${answer}]...`).start();

	await sleep();

	spinner.success(`Chose [${answer}]!`);

	chosenServer = answer;
};

async function channelList() {
	console.log("");

	const channels = [];
	const displayChannels = [];

	await client.guilds.cache.get(chosenServer).channels.cache.forEach(channel => {
		if (channel.type == "GUILD_TEXT") {
			channels.push([channel, channel.name]);
			displayChannels.push(channel.name);
		};
	});

	const answers = await inquirer.prompt({
		name: 'channel',
		type: 'list',
		message: 'Choose a channel',
		choices: displayChannels,
	});

	const answer = answers.channel;

	console.log(`Chose: ${chalk.bgGreen(answer)}`);

	console.log("");

	for (let i = 0; i < channels.length; i++) {
		if (channels[i][1] != answer) continue;

		const channel = channels[i][0];

		let willSpeak = true;

		while (willSpeak) {
			const filter = msg => {
				if (msg.author.id == client.user.id) return;
			};

			const collector = await channel.createMessageCollector({ time: 255 * 1000, filter: filter });

			const answers = await inquirer.prompt({
				name: 'msgSpoken',
				type: 'input',
				message: `${channel.name}: `,
			});

			collector.on("collect", collected => {
				console.log(collected);
			});

			if (answers.msgSpoken == "") {
				willSpeak = false;

				return;
			};

			if (answers.msgSpoken == "/stop") {
				willSpeak = false;

				return;
			};

			channel.send(answers.msgSpoken);
		};
	};
};

// Main
await load();

await tokenProvider();

// Loop
while (true) {
	await serverList();
	await channelList();
};
