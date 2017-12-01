const express = require('express');
const bodyParser = require('body-parser');
const HashMap = require('hashmap');
const WebClient = require('@slack/client').WebClient;

const util = require('./util');
const asciiArt = require('./asciiArt');

const STAGES = asciiArt.length;

const PORT = process.env.HANGMAN_PORT || 8030;
const TOKEN = process.env.HANGMAN_TOKEN;

if(typeof TOKEN === 'undefined') {
    console.error('No token supplied! Please set HANGMAN_TOKEN in your environment variables!');
    process.exit(1);
}

const slackClient = new WebClient(TOKEN);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const games = new HashMap();

app.post('/hangman', (request, response) => {
    const channelId = request.body.channel_id;
    const username = request.body.user_name;

    const text = request.body.text.trim();
    if(text.length === 0) {
        response.end('You have to provide options!');
    }

    const options = text.split(' ');

    switch(options[0]) {
        case 'start':
            if(options.length > 1) {
                if(games.has(channelId)) {
                    return response.end(`A game has already been started by ${games.get(channelId).author}! Finish it or ask them to stop it first.`);
                }

                const word = options.slice(1).join(' ').replace(/[^0-9a-z ]/gi, '');

                games.set(channelId, {
                    word,
                    'guessed': [],
                    'wrong': 0,
                    'author': username,
                });

                const wordEncrypted = util.showCurrentWord(word, []);

                response.end(`Okay, starting the game with the word \`${word}\`! It will be shown to the players like this: \`${wordEncrypted}\``);

                slackClient.chat.postMessage(
                    channelId,
                    `@${username} started a new game of hangman! Guess this: \`${wordEncrypted}\``,
                    {
                        'as_user': false,
                    }
                );
            } else {
                response.end('You have to provide a word!');
            }
            break;
        case 'stop': {
            const game = games.get(channelId);
            if (game.author === username) {
                response.end(`Okay, stopping the game!`);
                games.delete(channelId);
                slackClient.chat.postMessage(
                    channelId,
                    `@${username} stopped their game!`,
                    {
                        'as_user': false,
                    }
                )
            } else {
                response.end(`Sorry, but you are not @${game.author}! Ask them to stop the game!`);
            }
            break;
        }
        case 'solve': {
            if (!games.has(channelId)) {
                return response.end('No game has been started yet! Start one with `/hangman start [WORD]`.');
            }

            const game = games.get(channelId);

            if (options.length === 1 || options.length > 2 || options[1].trim().length > 1) {
                return response.end(`Please only provide one single character! You supplied: \`${options.slice(1).join(' ')}\``);
            }

            const character = options[1].trim().toLowerCase();

            if (game.guessed.includes(character)) {
                return response.end(`Character \`${character}\` was already used!`);
            }

            game.guessed.push(character);

            const wordEncrypted = util.showCurrentWord(game.word, game.guessed);

            if (game.word.toLowerCase().includes(character)) {
                if(!wordEncrypted.includes('_')) {
                    games.delete(channelId);

                    return response.json({
                        'response_type': 'in_channel',
                        'text': `Congrats, you guys solved the word! It was: \`${wordEncrypted}\``,
                    }).end();
                }

                return response.json({
                    'response_type': 'in_channel',
                    'text': `@${username} guessed \`${character}\` correctly! Here is the current word: \`${wordEncrypted}\``,
                }).end();
            } else {
                game.wrong++;

                if(game.wrong === STAGES) {
                    games.delete(channelId);

                    return response.json({
                        'response_type': 'in_channel',
                        'text': 'Sorry, you guys lost!',
                    });
                }

                return response.json({
                    'response_type': 'in_channel',
                    'text': `@${username} guessed \`${character}\` incorrectly! Here is the word: \`${wordEncrypted}\`\n\n\`\`\`${asciiArt[game.wrong - 1]}\`\`\``,
                }).end();
            }
        }
        default:
            response.end(`Unknown option '${options[0]}' :confused:`);
    }
});

app.listen(PORT, () => { console.log('App started!') });