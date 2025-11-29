import { GoogleGenerativeAI } from "@google/generative-ai";

export async function chatWithGemini(apiKey: string, history: { role: "user" | "model"; parts: { text: string }[] }[], message: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
        history: history,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
}

export async function generateTaskFromText(apiKey: string, text: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    Analyze the following text and extract task information.
    Return ONLY a valid JSON object with the following structure:
    {
        "title": "Task title",
        "type": "daily" | "scheduled" | "backlog",
        "scheduled": {
            "daysOfWeek": [0-6] (0 is Sunday, optional),
            "dateRanges": [{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}] (optional)
        },
        "plannedDates": [timestamp] (optional, for backlog)
    }
    
    If the text implies a specific date (e.g. "tomorrow", "next monday"), calculate the timestamp or date range relative to now (${new Date().toISOString()}).
    If no specific type is implied, default to "backlog".
    
    Text: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    try {
        // Extract JSON from code block if present
        const jsonMatch = textResponse.match(/```json\n([\s\S]*)\n```/) || textResponse.match(/{[\s\S]*}/);
        const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, "") : textResponse;
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response", e);
        return null;
    }
}
