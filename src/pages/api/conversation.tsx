////
// Import necessary modules
import { eq } from 'drizzle-orm';
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';
import { messages } from '~/server/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { conversationId } = req.body;

  if (typeof conversationId !== 'number' || conversationId <= 0) {
    res.status(400).json({ error: 'Invalid or missing conversationId' });
    return;
  }

  try {
    // Fetch messages for the given conversationId
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .all();

    // Map the results to match the frontend format
    const formattedMessages = conversationMessages.map((msg) => ({
      type: msg.type,  // 'user' or 'ai'
      text: msg.text,
    }));

    res.status(200).json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ message: 'An error occurred while fetching conversation history.' });
  }
}
