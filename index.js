const { Client, Collection } = require('discord.js');
const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES', 'GUILD_MEMBERS'] });
const fs = require('fs');
const { botConfig } = require('./configs/config_privateInfos');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { guildsInfo } = require('./configs/config_geral');

const commandFolders = fs.readdirSync('./commands');
const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));


client.commands = new Collection();
client.cooldowns = new Collection();

for (const folder of commandFolders) {
    const commandFiles = fs
        .readdirSync(`./commands/${folder}`)
        .filter((file) => file.endsWith('.js') && file.startsWith('p_'));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);

        client.commands.set(command.name, command)

    }

}
for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once == 'once') {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

process.on('unhandledRejection', (err) => {
    if (
        !err.message.includes('Unknown Channel') &&
        !err.message.includes('Unknown Message') &&
        !err.message.includes('Cannot send messages to this user') &&
        !err.message.includes('Collector received no interactions before ending with reason: time')
    ) {
        console.error(err);
    }
});


const rest = new REST({ version: '9' }).setToken(botConfig.token);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(botConfig.applicationId, guildsInfo.main),
            { body: client.commands },
        ).then((m) => m.forEach(async element => {

            await rest.put(
                Routes.applicationCommandPermissions(botConfig.applicationId, guildsInfo.main, element.id),
                { body: { permissions: (client.commands.find(m => m.name == element.name).permissions) } },
            )
        }))

        console.log('COMANDOS (/) FUERON ACTUALIZADOS!');
    } catch (error) {
        console.error(error);
    }
})();

client.login(botConfig.token);
