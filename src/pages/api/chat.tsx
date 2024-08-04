// This is the API route for the chat feature. It handles the user's messages, saves them to the database, and gets the AI's response using LangChain.

import { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";
import { eq } from 'drizzle-orm';
import { getAiResponse } from "~/server/api/aiResponse";
import { conversations, messages } from "~/server/db/schema";
import { parseCookies, setCookie } from "nookies";

async function startNewConversation(): Promise<number> {
  const result = await db.insert(conversations).values({});
  const insertId = Number(result.lastInsertRowid);
  if (isNaN(insertId) || insertId <= 0) {
    throw new Error("Failed to obtain a valid insertId from database");
  }
  return insertId;
}

async function saveMessage(
  conversationId: number,
  messageType: "user" | "ai",
  text: string,
): Promise<void> {
  await db.insert(messages).values({
    conversationId,
    type: messageType,
    text,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { message } = req.body;
  const cookies = parseCookies({ req });

  try {
    let conversationId: number;

    if (cookies.conversationId) {
      conversationId = parseInt(cookies.conversationId, 10);
      if (isNaN(conversationId) || conversationId <= 0) {
        throw new Error("Invalid conversationId in cookies");
      }
    } else {
      conversationId = await startNewConversation();
      setCookie({ res }, "conversationId", conversationId.toString(), {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    // Fetch chat history for the conversation
    const chatHistory = await db
      .select({
        type: messages.type,
        text: messages.text,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .all();

    // Save user message to database
    await saveMessage(conversationId, "user", message);

    // Get AI response using LangChain
    const aiMessage = await getAiResponse(message, chatHistory);

    await saveMessage(conversationId, "ai", aiMessage);

    res.status(200).json({ message: aiMessage });
  } catch (error) {
    console.error("Error handling chat:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request." });
  }
}
