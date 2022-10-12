require("dotenv").config();

const cohere = require("cohere-ai");
const { Client, GatewayIntentBits } = require("discord.js");

const COHERE_API_KEY = process.env.COHERE_API_KEY
const COHERE_FEEDBACK_MODEL_ID = process.env.COHERE_FEEDBACK_MODEL_ID;
const FEEDBACK_SCORE_THRESHOLD = 0.8;

const DISCORD_API_KEY = process.env.DISCORD_API_KEY
const DISCORD_GENERAL_CHANNEL_ID = process.env.DISCORD_GENERAL_CHANNEL_ID;
const DISCORD_FEEDBACK_CHANNEL_ID = process.env.DISCORD_FEEDBACK_CHANNEL_ID;

// Initialize API clients
cohere.init(COHERE_API_KEY, "2021-11-08");
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Classify each message and return label and highest prediction confidence of
// best label
async function classifyMessage(message) {
    const response = await cohere.classify({
        model: COHERE_FEEDBACK_MODEL_ID,
        inputs: [message]
    });

    if (!!response.body.classifications && !!response.body.classifications[0]) {
        let [prediction, best] = ["", 0];
        for (const { option, confidence } of response.body.classifications[0].confidences) {
            if (confidence > best) {
                prediction = option
                best = confidence
            }
        }

        return [prediction, best]
    }
};

// Listen for new messages in the specified channel. If a message exceeds the threshold for
// feedback, route it to the correct product owner.
discordClient.on("messageCreate", async msg => {
    const { author, channelId, content } = msg;

    if (channelId === DISCORD_GENERAL_CHANNEL_ID) {
        try {
            const [prediction, confidence] = await classifyMessage(content);

            if (confidence > FEEDBACK_SCORE_THRESHOLD) {
                const message = `${author.username} just gave some product feedback for ${prediction} on Discord:\n\n${content}`;
                discordClient.channels.cache.get(DISCORD_FEEDBACK_CHANNEL_ID).send( message );
                console.log(`message had label ${prediction} with score ${confidence}:\n"${content}"`);
            }
            else {
                console.log(`message had label ${prediction} with score ${confidence} so it was ignored:\n"${content}"`);
            }
        }
        catch (err) {
            console.error(err);
        }
    }
});

discordClient.once("ready", () => {
    console.log("~~~ ready to bring the specifications from the customers to the software engineers ~~~\n")
});

discordClient.login(DISCORD_API_KEY);
