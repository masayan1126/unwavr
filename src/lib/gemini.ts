import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task } from "./types";

export type AIAction =
    | { type: "chat"; message: string }
    | { type: "create_task"; task: Partial<Task>; message: string }
    | { type: "update_task"; taskId: string; updates: Partial<Task>; message: string }
    | { type: "delete_task"; taskId: string; message: string }
    | { type: "complete_task"; taskId: string; message: string };

export async function processUserRequest(
    apiKey: string,
    history: { role: "user" | "model"; parts: { text: string }[] }[],
    message: string,
    currentTasks: Partial<Task>[]
): Promise<AIAction> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const taskContext = currentTasks.map(t =>
        `- ID: ${t.id}, Title: ${t.title}, Type: ${t.type}, Completed: ${t.completed}, Scheduled: ${JSON.stringify(t.scheduled)}, Planned: ${JSON.stringify(t.plannedDates)}`
    ).join("\n");

    const systemPrompt = `
    You are an intelligent task management assistant. You can manage tasks based on user requests.
    
    Current Tasks:
    ${taskContext}

    Available Tools (return as JSON):
    1. create_task: Create a new task.
       Format: { "tool": "create_task", "parameters": { "title": "...", "type": "daily"|"scheduled"|"backlog", ... }, "reply": "..." }
    2. update_task: Update an existing task. Find the Task ID from the Current Tasks list based on the user's description.
       Format: { "tool": "update_task", "parameters": { "taskId": "...", "updates": { ... } }, "reply": "..." }
    3. delete_task: Delete a task. Find the Task ID from the Current Tasks list.
       Format: { "tool": "delete_task", "parameters": { "taskId": "..." }, "reply": "..." }
    4. complete_task: Mark a task as completed. Find the Task ID from the Current Tasks list.
       Format: { "tool": "complete_task", "parameters": { "taskId": "..." }, "reply": "..." }
    5. chat: General conversation or if the user's request is unclear or if no tool is needed.
       Format: { "tool": "chat", "parameters": {}, "reply": "..." }

    Rules:
    - Return ONLY valid JSON.
    - If the user asks to update/delete/complete a task, you MUST find the matching ID from the "Current Tasks" list. If ambiguous, ask for clarification (tool: chat).
    - For "scheduled" tasks, "daysOfWeek" is 0-6 (Sunday-Saturday).
    - For dates, use timestamps (number) or "YYYY-MM-DD" strings where appropriate. Current time: ${new Date().toISOString()}.
    - "reply" should be a friendly message confirming the action or answering the question.
    `;

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood. I am ready to help you manage your tasks. Please provide your request." }] },
            ...history
        ],
    });

    const result = await chat.sendMessage(message);
    const responseText = await result.response.text();

    try {
        const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || responseText.match(/{[\s\S]*}/);

        if (jsonMatch) {
            const jsonStr = jsonMatch[0].replace(/```json|```/g, "");
            const parsed = JSON.parse(jsonStr);

            switch (parsed.tool) {
                case "create_task":
                    return { type: "create_task", task: parsed.parameters, message: parsed.reply };
                case "update_task":
                    return { type: "update_task", taskId: parsed.parameters.taskId, updates: parsed.parameters.updates, message: parsed.reply };
                case "delete_task":
                    return { type: "delete_task", taskId: parsed.parameters.taskId, message: parsed.reply };
                case "complete_task":
                    return { type: "complete_task", taskId: parsed.parameters.taskId, message: parsed.reply };
                default:
                    return { type: "chat", message: parsed.reply || responseText };
            }
        } else {
            // No JSON found, treat as normal chat
            return { type: "chat", message: responseText };
        }
    } catch (e) {
        console.error("Failed to parse Gemini response", e);
        return { type: "chat", message: responseText }; // Fallback to raw text if JSON parsing fails
    }
}
