const { Configuration, OpenAIApi } = require("openai-edge");
const { OpenAIStream, StreamingTextResponse } = require("ai");
const { appSetting } = require('app/config');

const API_KEY = appSetting('config', 'api_keys', 'open_ai');

const config = new Configuration({
    apiKey: API_KEY,
});
const openai = new OpenAIApi(config);

exports.runtime = "edge";

exports.POST = async function (req) {
    // Check if the OPENAI_API_KEY is set, if not return 400
    if (!API_KEY) {
        return new Response(
            "Missing open_ai – make sure to add it to your config file",
            {
                //status: 400,
            },
        );
    }

    let { prompt } = await req.json();

    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content:
                    "You are an AI writing assistant that continues existing text based on context from prior text. " +
                    "Give more weight/priority to the later characters than the beginning ones. " +
                    "Limit your response to no more than 200 characters, but make sure to construct complete sentences.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true,
        n: 1,
    });

    // If the response is unauthorized, return a 401 error
    if (response.status === 401) {
        return new Response("Error: You are unauthorized to perform this action", {
        });
    }

    if (response.status === 429) {
        return new Response("You exceeded your current quota, please check your plan and billing details.", {
        });
    }
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
}