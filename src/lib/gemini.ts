import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task } from "./types";
// 

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
    - Definition of "Today's Incomplete Tasks":
      1. Daily tasks (type: "daily") that are NOT completed.
      2. Scheduled tasks (type: "scheduled") where "daysOfWeek" includes today's day of week (0=Sun, 1=Mon, ..., 6=Sat) AND are NOT completed.
      3. Backlog tasks (type: "backlog") where "plannedDates" includes today's date (YYYY-MM-DD) AND are NOT completed.
         - STRICTLY EXCLUDE backlog tasks that do not have today's date in "plannedDates".
         - If "plannedDates" is empty or null, do NOT include it.
    - "reply" should be a friendly message confirming the action or answering the question.
    - When asked to summarize or list tasks, ALWAYS use a Markdown table for better visualization.
    - CRITICAL: Whenever you mention a task title in your response (whether in a table, list, or sentence), YOU MUST wrap it in a Markdown link to allow filtering: [Task Title](/tasks?taskId=TaskId).
      Example:
      ### 📅 今日のタスク
      | ステータス | タイトル | タイプ |
      | :--- | :--- | :--- |
      | ⬜️ 未完了 | [**タスクA**](/tasks?taskId=task-id-a) | 毎日 |
      | ✅ 完了 | [**タスクB**](/tasks?taskId=task-id-b) | 特定曜日 |
      
      "[タスクA](/tasks?taskId=task-id-a)を完了しました。"
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

export async function generateText(apiKey: string, prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

export async function parseTaskInput(apiKey: string, input: string, language: 'ja' | 'en' = 'ja'): Promise<Partial<Task>> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    Analyze the following task input and extract task details into a JSON object.
    Input: "${input}"
    Language Context: ${language}

    Current Date: ${new Date().toISOString()}

    Output Format (JSON):
    {
        "title": "Task Title",
        "type": "daily" | "scheduled" | "backlog",
        "scheduled": { "daysOfWeek": [0-6], "dateRanges": [] } (only if type is scheduled),
        "plannedDates": [timestamp] (only if type is backlog and specific date is mentioned),
        "estimatedPomodoros": number (if mentioned, e.g. "2 pomodoros", "1 hour" -> 2),
        "description": "Any extra details not in title"
    }

    Rules:
    - If specific day of week is mentioned (e.g. "every Monday", "毎週月曜"), set type to "scheduled" and daysOfWeek (0=Sun, 1=Mon...).
    - If specific date is mentioned (e.g. "tomorrow", "明日"), set type to "backlog" and plannedDates to the timestamp of that date (start of day).
    - If "daily" or "every day" or "毎日" is implied, set type to "daily".
    - Default type is "backlog".
    - Remove date/time/type keywords from the title.
    - Return ONLY valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
        const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/{[\s\S]*}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0].replace(/```json|```/g, ""));
        }
    } catch (e) {
        console.error("Failed to parse task input", e);
    }
    return { title: input };
}

export async function breakdownTask(apiKey: string, taskTitle: string, taskDescription: string, language: 'ja' | 'en' = 'ja'): Promise<string[]> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    Break down the following task into 3-7 actionable subtasks.
    Task Title: "${taskTitle}"
    Task Description: "${taskDescription}"
    Language: ${language}

    Output Format:
    Return ONLY a JSON array of strings in ${language === 'en' ? 'English' : 'Japanese'}.
    Example: ["Subtask 1", "Subtask 2", "Subtask 3"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
        const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0].replace(/```json|```/g, ""));
        }
    } catch (e) {
        console.error("Failed to parse breakdown", e);
    }
    return [];
}

export type BriefingContext = {
    tasks: Partial<Task>[];
    weather?: string;
    date: Date;
    language: 'ja' | 'en';
};

export async function generateDailyBriefing(apiKey: string, context: BriefingContext): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const taskSummary = context.tasks.map(t =>
        `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.type})`
    ).join("\n");

    const prompt = `
    You are a helpful personal assistant. Provide a daily briefing for the user.
    
    Current Date: ${context.date.toLocaleString()}
    Weather: ${context.weather || "Unknown"}
    Language: ${apiKey.startsWith("AI") ? "Detect from prompt" : "en"} (Instruction: Output in ${context.language === 'en' ? 'English' : 'Japanese'})
    
    Today's Tasks:
    ${taskSummary}

    Instructions:
    1. Greet the user enthusiastically.
    2. Summarize the weather (if known).
    3. Highlight key tasks for today (especially uncompleted ones).
    4. Offer a motivational quote or tip for productivity.
    5. Keep it concise (under 200 words).
    6. Use Markdown formatting.
    7. OUTPUT MUST BE IN ${context.language === 'en' ? 'ENGLISH' : 'JAPANESE'}.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
