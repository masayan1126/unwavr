import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { checkAndIncrementAIUsage } from "@/lib/aiUsage";
import { PLAN_LIMITS } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { GeminiModel } from "@/lib/stores/sliceTypes";

// Gemini API呼び出しの種類
type GeminiRequestType =
  | "task_request"      // タスク操作リクエスト
  | "bgm_request"       // BGM検索リクエスト
  | "parse_task"        // タスク入力パース
  | "breakdown_task"    // タスク分割
  | "daily_briefing"    // デイリーブリーフィング
  | "generate_text";    // 汎用テキスト生成

type GeminiRequest = {
  type: GeminiRequestType;
  // 各タイプに応じたパラメータ
  message?: string;
  history?: { role: "user" | "model"; parts: { text: string }[] }[];
  tasks?: { id: string; title: string; type: string; completed: boolean; scheduled?: unknown; plannedDates?: unknown }[];
  // parse_task用
  input?: string;
  language?: "ja" | "en";
  // breakdown_task用
  taskTitle?: string;
  taskDescription?: string;
  // daily_briefing用
  weather?: string;
  date?: string;
  // generate_text用
  prompt?: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 400 });
  }

  // 認証チェック
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // AI使用量チェック（上限に達していたら拒否）
  const usageCheck = await checkAndIncrementAIUsage(userId);
  if (!usageCheck.allowed) {
    const planInfo = PLAN_LIMITS[usageCheck.plan];
    return NextResponse.json({
      error: "limit_exceeded",
      message: `月間上限（${usageCheck.limit}回）に達しました。プランをアップグレードしてください。`,
      current: usageCheck.current,
      limit: usageCheck.limit,
      plan: usageCheck.plan,
      planLabel: planInfo.label,
    }, { status: 429 });
  }

  let body: GeminiRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // ユーザーのモデル設定を取得
  let selectedModel: GeminiModel = "gemini-2.5-flash-preview-05-20";
  if (supabaseAdmin) {
    const { data: prefs } = await supabaseAdmin
      .from("user_preferences")
      .select("custom_settings")
      .eq("user_id", userId)
      .single();

    const customSettings = prefs?.custom_settings as { ai_model?: string } | null;
    if (customSettings?.ai_model) {
      selectedModel = customSettings.ai_model as GeminiModel;
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: selectedModel });

  try {
    switch (body.type) {
      case "task_request":
        return await handleTaskRequest(model, body);
      case "bgm_request":
        return await handleBgmRequest(model, body);
      case "parse_task":
        return await handleParseTask(model, body);
      case "breakdown_task":
        return await handleBreakdownTask(model, body);
      case "daily_briefing":
        return await handleDailyBriefing(model, body);
      case "generate_text":
        return await handleGenerateText(model, body);
      default:
        return NextResponse.json({ error: "invalid_request_type" }, { status: 400 });
    }
  } catch (e) {
    console.error("Gemini API error:", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// タスクリクエスト処理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTaskRequest(model: any, body: GeminiRequest) {
  const { message, history = [], tasks = [] } = body;

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const taskContext = tasks.map(t =>
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
  5. chat: General conversation or if the user's request is unclear or if no tool is needed.
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
    const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || responseText.match(/{[\s\S]*}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[0].replace(/```json|```/g, "");
      const parsed = JSON.parse(jsonStr);

      switch (parsed.tool) {
        case "create_task":
          return NextResponse.json({ type: "create_task", task: parsed.parameters, message: parsed.reply });
        case "update_task":
          return NextResponse.json({ type: "update_task", taskId: parsed.parameters.taskId, updates: parsed.parameters.updates, message: parsed.reply });
        case "delete_task":
          return NextResponse.json({ type: "delete_task", taskId: parsed.parameters.taskId, message: parsed.reply });
        case "complete_task":
          return NextResponse.json({ type: "complete_task", taskId: parsed.parameters.taskId, message: parsed.reply });
        default:
          return NextResponse.json({ type: "chat", message: parsed.reply || responseText });
      }
    } else {
      return NextResponse.json({ type: "chat", message: responseText });
    }
  } catch {
    return NextResponse.json({ type: "chat", message: responseText });
  }
}

// BGMリクエスト処理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBgmRequest(model: any, body: GeminiRequest) {
  const { message } = body;

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

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
  - "reply" should be a friendly, natural Japanese message
  - Generate high-quality search queries that will return good music results
  `;

  const result = await model.generateContent([systemPrompt, message]);
  const responseText = await result.response.text();

  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || responseText.match(/{[\s\S]*}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[0].replace(/```json|```/g, "");
      const parsed = JSON.parse(jsonStr);

      switch (parsed.tool) {
        case "search_bgm":
          return NextResponse.json({
            type: "search_bgm",
            query: parsed.parameters.query,
            mood: parsed.parameters.mood,
            message: parsed.reply
          });
        case "play_existing":
          return NextResponse.json({
            type: "play_existing",
            groupName: parsed.parameters.groupName,
            message: parsed.reply
          });
        default:
          return NextResponse.json({ type: "bgm_chat", message: parsed.reply || responseText });
      }
    } else {
      return NextResponse.json({ type: "bgm_chat", message: responseText });
    }
  } catch {
    return NextResponse.json({ type: "bgm_chat", message: responseText });
  }
}

// タスク入力パース
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleParseTask(model: any, body: GeminiRequest) {
  const { input, language = "ja" } = body;

  if (!input) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

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
      const parsed = JSON.parse(jsonMatch[0].replace(/```json|```/g, ""));
      return NextResponse.json({ task: parsed });
    }
  } catch {
    // fallback
  }
  return NextResponse.json({ task: { title: input } });
}

// タスク分割
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBreakdownTask(model: any, body: GeminiRequest) {
  const { taskTitle, taskDescription = "", language = "ja" } = body;

  if (!taskTitle) {
    return NextResponse.json({ error: "taskTitle is required" }, { status: 400 });
  }

  const prompt = `
  Break down the following task into 3-7 actionable subtasks.
  Task Title: "${taskTitle}"
  Task Description: "${taskDescription}"
  Language: ${language}

  Output Format:
  Return ONLY a JSON array of strings in ${language === "en" ? "English" : "Japanese"}.
  Example: ["Subtask 1", "Subtask 2", "Subtask 3"]
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const subtasks = JSON.parse(jsonMatch[0].replace(/```json|```/g, ""));
      return NextResponse.json({ subtasks });
    }
  } catch {
    // fallback
  }
  return NextResponse.json({ subtasks: [] });
}

// デイリーブリーフィング
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDailyBriefing(model: any, body: GeminiRequest) {
  const { tasks = [], weather, date, language = "ja" } = body;

  const taskSummary = tasks.map(t =>
    `- [${t.completed ? "x" : " "}] ${t.title} (${t.type})`
  ).join("\n");

  const currentDate = date ? new Date(date) : new Date();

  const prompt = `
  You are a helpful personal assistant. Provide a daily briefing for the user.

  Current Date: ${currentDate.toLocaleString()}
  Weather: ${weather || "Unknown"}
  Language: ${language === "en" ? "English" : "Japanese"}

  Today's Tasks:
  ${taskSummary}

  Instructions:
  1. Greet the user enthusiastically.
  2. Summarize the weather (if known).
  3. Highlight key tasks for today (especially uncompleted ones).
  4. Offer a motivational quote or tip for productivity.
  5. Keep it concise (under 200 words).
  6. Use Markdown formatting.
  7. OUTPUT MUST BE IN ${language === "en" ? "ENGLISH" : "JAPANESE"}.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return NextResponse.json({ briefing: response.text() });
}

// 汎用テキスト生成
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleGenerateText(model: any, body: GeminiRequest) {
  const { prompt } = body;

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return NextResponse.json({ text: response.text() });
}
