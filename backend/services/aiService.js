
const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Generate a normal text response
const generateAIResponse = async (messages) => {
    try {
        const completion = await groq.chat.completions.create({
            messages,
            model: "openai/gpt-oss-120b",
            temperature: 0.7,
            max_tokens: 500
        });

        return completion.choices[0]?.message?.content || "";

    } catch (error) {
        console.error("Groq API Error:", error.message);
        throw new Error("Unable to generate AI response");
    }
};

// Generate a structured JSON response
const generateStructuredAIResponse = async (messages, schema) => {
    try {
        const completion = await groq.chat.completions.create({
            messages,
            model: "openai/gpt-oss-120b",
            temperature: 0.5,
            max_completion_tokens: 2000,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "task_breakdown",
                    strict: true,
                    schema
                }
            }
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error("The AI returned an empty response");
        }

        return JSON.parse(content);

    }  catch (error) {
        console.error("Groq Structured Output Error:", error);
        throw error;
    }
};

module.exports = {
    generateAIResponse,
    generateStructuredAIResponse
};
