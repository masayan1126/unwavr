import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task } from "./types";
// 

export type AIAction =
    | { type: "chat"; message: string }
    | { type: "create_task"; task: Partial<Task>; message: string }
    | { type: "update_task"; taskId: string; updates: Partial<Task>; message: string }
    | { type: "delete_task"; taskId: string; message: string }
    | { type: "complete_task"; taskId: string; message: string }
    | { type: "schedule_task"; taskId: string; date: string; startTime: string; endTime: string; message: string }
    | { type: "create_and_schedule"; task: Partial<Task>; date: string; startTime: string; endTime: string; message: string };

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

    IMPORTANT: You MUST always respond in Japanese (日本語). All "reply" fields MUST be in Japanese.

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
    5. schedule_task: Schedule an existing task to a specific time slot on the calendar.
       Format: { "tool": "schedule_task", "parameters": { "taskId": "...", "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM" }, "reply": "..." }
       Example: User says "明日の9時から10時に資料作成をスケジュール" → Find taskId for "資料作成" and schedule it.
    6. create_and_schedule: Create a new task AND schedule it immediately.
       Format: { "tool": "create_and_schedule", "parameters": { "title": "...", "type": "backlog", "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM" }, "reply": "..." }
       Example: User says "明日の14時から会議を追加して" → Create a new task "会議" and schedule it for tomorrow at 14:00.
    7. chat: General conversation or if the user's request is unclear or if no tool is needed.
       Format: { "tool": "chat", "parameters": {}, "reply": "..." }

    Rules:
    - Return ONLY valid JSON.
    - ALWAYS respond in Japanese (日本語). The "reply" field MUST be in Japanese.
    - If the user asks to update/delete/complete a task, you MUST find the matching ID from the "Current Tasks" list. If ambiguous, ask for clarification (tool: chat).
    - For "scheduled" tasks, "daysOfWeek" is 0-6 (Sunday-Saturday).
    - For dates, use timestamps (number) or "YYYY-MM-DD" strings where appropriate. Current time: ${new Date().toISOString()}.
    - Definition of "Today's Incomplete Tasks":
      1. Daily tasks (type: "daily") that are NOT completed.
      2. Scheduled tasks (type: "scheduled") where "daysOfWeek" includes today's day of week (0=Sun, 1=Mon, ..., 6=Sat) AND are NOT completed.
      3. Backlog tasks (type: "backlog") where "plannedDates" includes today's date (YYYY-MM-DD) AND are NOT completed.
         - STRICTLY EXCLUDE backlog tasks that do not have today's date in "plannedDates".
         - If "plannedDates" is empty or null, do NOT include it.
    - "reply" should be a friendly message in Japanese confirming the action or answering the question.
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
            { role: "model", parts: [{ text: "了解しました。タスク管理のお手伝いをします。何でもお申し付けください。" }] },
            ...history
        ],
    });

    const result = await chat.sendMessage(message);
    const responseText = await result.response.text();

    try {
        // Try to extract JSON from markdown code block first
        const codeBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        let jsonStr: string | null = null;

        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        } else {
            // Try to find a balanced JSON object
            const startIndex = responseText.indexOf('{');
            if (startIndex !== -1) {
                let depth = 0;
                let endIndex = -1;
                for (let i = startIndex; i < responseText.length; i++) {
                    if (responseText[i] === '{') depth++;
                    else if (responseText[i] === '}') {
                        depth--;
                        if (depth === 0) {
                            endIndex = i;
                            break;
                        }
                    }
                }
                if (endIndex !== -1) {
                    jsonStr = responseText.substring(startIndex, endIndex + 1);
                }
            }
        }

        if (jsonStr) {
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
                case "schedule_task":
                    return {
                        type: "schedule_task",
                        taskId: parsed.parameters.taskId,
                        date: parsed.parameters.date,
                        startTime: parsed.parameters.startTime,
                        endTime: parsed.parameters.endTime,
                        message: parsed.reply
                    };
                case "create_and_schedule":
                    return {
                        type: "create_and_schedule",
                        task: parsed.parameters,
                        date: parsed.parameters.date,
                        startTime: parsed.parameters.startTime,
                        endTime: parsed.parameters.endTime,
                        message: parsed.reply
                    };
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
        // Try to extract JSON from markdown code block first (non-greedy)
        const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        let jsonStr: string | null = null;

        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        } else {
            // Try to find a balanced JSON object
            const startIndex = text.indexOf('{');
            if (startIndex !== -1) {
                let depth = 0;
                let endIndex = -1;
                for (let i = startIndex; i < text.length; i++) {
                    if (text[i] === '{') depth++;
                    else if (text[i] === '}') {
                        depth--;
                        if (depth === 0) {
                            endIndex = i;
                            break;
                        }
                    }
                }
                if (endIndex !== -1) {
                    jsonStr = text.substring(startIndex, endIndex + 1);
                }
            }
        }

        if (jsonStr) {
            return JSON.parse(jsonStr);
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
        // Try to extract JSON from markdown code block first (non-greedy)
        const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        let jsonStr: string | null = null;

        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        } else {
            // Try to find a balanced JSON array
            const startIndex = text.indexOf('[');
            if (startIndex !== -1) {
                let depth = 0;
                let endIndex = -1;
                for (let i = startIndex; i < text.length; i++) {
                    if (text[i] === '[') depth++;
                    else if (text[i] === ']') {
                        depth--;
                        if (depth === 0) {
                            endIndex = i;
                            break;
                        }
                    }
                }
                if (endIndex !== -1) {
                    jsonStr = text.substring(startIndex, endIndex + 1);
                }
            }
        }

        if (jsonStr) {
            return JSON.parse(jsonStr);
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

// BGM AI Action Types
export type BGMAIAction =
    | { type: "search_bgm"; query: string; mood?: string; message: string }
    | { type: "play_existing"; groupName?: string; message: string }
    | { type: "bgm_chat"; message: string };

export async function processBgmRequest(
    apiKey: string,
    message: string
): Promise<BGMAIAction> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `
    You are a BGM (background music) assistant. Analyze the user's request and generate a YouTube search query.

    IMPORTANT: You MUST always respond in Japanese (日本語). All "reply" fields MUST be in Japanese.

    Available Tools (return as JSON):
    1. search_bgm: Search for music/videos on YouTube
       Format: { "tool": "search_bgm", "parameters": { "query": "optimized search query", "mood": "relaxing|energetic|focus|sleep|chill" }, "reply": "日本語で応答..." }
    2. play_existing: Play from existing playlist (if user mentions specific playlist)
       Format: { "tool": "play_existing", "parameters": { "groupName": "..." }, "reply": "日本語で応答..." }
    3. bgm_chat: General conversation about music
       Format: { "tool": "bgm_chat", "parameters": {}, "reply": "日本語で応答..." }

    Query Generation Rules:
    - Generate search queries optimized for YouTube music search
    - Add relevant keywords like "BGM", "music", "playlist", "1 hour", "mix" for better results
    - For Japanese requests, you can use Japanese or English keywords depending on what works best
    - Examples:
      - "気分が上がる曲" → "upbeat happy music BGM playlist"
      - "集中力を上げたい" → "focus concentration study music lo-fi BGM"
      - "作業用BGM" → "work study BGM playlist 1 hour"
      - "ASMR" → "ASMR relaxing sounds"
      - "リラックスしたい" → "relaxing calm music BGM chill"
      - "テンション上げたい" → "energetic upbeat music workout BGM"
      - "眠れる曲" → "sleep music relaxing BGM 1 hour"
      - "ジャズ" → "jazz music BGM playlist"
      - "カフェっぽい曲" → "cafe music jazz BGM"

    Rules:
    - Return ONLY valid JSON
    - ALWAYS respond in Japanese (日本語). The "reply" field MUST be in Japanese.
    - "reply" should be a friendly, natural Japanese message (例: 「集中できる曲を探しますね！」「作業用BGMをお探しします」)
    - Generate high-quality search queries that will return good music results
    `;

    const result = await model.generateContent([systemPrompt, message]);
    const responseText = await result.response.text();

    try {
        // Try to extract JSON from markdown code block first
        const codeBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        let jsonStr: string | null = null;

        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        } else {
            // Try to find a balanced JSON object
            const startIndex = responseText.indexOf('{');
            if (startIndex !== -1) {
                let depth = 0;
                let endIndex = -1;
                for (let i = startIndex; i < responseText.length; i++) {
                    if (responseText[i] === '{') depth++;
                    else if (responseText[i] === '}') {
                        depth--;
                        if (depth === 0) {
                            endIndex = i;
                            break;
                        }
                    }
                }
                if (endIndex !== -1) {
                    jsonStr = responseText.substring(startIndex, endIndex + 1);
                }
            }
        }

        if (jsonStr) {
            const parsed = JSON.parse(jsonStr);

            switch (parsed.tool) {
                case "search_bgm":
                    return {
                        type: "search_bgm",
                        query: parsed.parameters.query,
                        mood: parsed.parameters.mood,
                        message: parsed.reply
                    };
                case "play_existing":
                    return {
                        type: "play_existing",
                        groupName: parsed.parameters.groupName,
                        message: parsed.reply
                    };
                default:
                    return { type: "bgm_chat", message: parsed.reply || responseText };
            }
        } else {
            return { type: "bgm_chat", message: responseText };
        }
    } catch (e) {
        console.error("Failed to parse BGM Gemini response", e);
        return { type: "bgm_chat", message: responseText };
    }
}

// Check if a message is BGM-related
export function isBgmRelatedMessage(message: string): boolean {
    const bgmKeywords = [
        '曲', '音楽', 'BGM', 'bgm', '再生', 'かけて', 'ながして', '流して',
        'ASMR', 'asmr', 'ミュージック', 'music', 'プレイリスト', 'playlist',
        '聴きたい', '聞きたい', 'リラックス', '集中', '作業用', 'テンション',
        '眠', 'ジャズ', 'jazz', 'ロック', 'rock', 'ポップ', 'pop',
        'クラシック', 'classical', 'カフェ', 'cafe', 'チル', 'chill', 'lo-fi', 'lofi'
    ];
    return bgmKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
}
