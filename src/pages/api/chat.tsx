// pages/api/chat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { db } from '~/server/db';
import { conversations, messages } from '~/server/db/schema';
import { parseCookies, setCookie } from 'nookies';
import { evaluate } from 'mathjs';

import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";

import { DynamicTool } from "@langchain/core/tools";

type jobCriteria = {
    tag: string,
    jobType: string,
    location: string,
    geo: string,
    industry: string,
    remote: boolean,
};

const calculatorTool = new DynamicTool({
    name: "calculator",
    description: "Returns the result of a math calculation.",
    func: performCalculation,
});

const jobSearchTool = new DynamicTool({
    name: "jobSearch",
    description: "Finds jobs that match the user's jobCriteria input that is a stringified json object that should be in this format: {tag: string, location: string, geo: string, industry: string, remote: boolean}",
    // description: "Finds jobs that match the user's jobCriteria input that is a stringified json object that should be in this format: {tag: string, jobType: string, location: string, geo: string, industry: string, remote: boolean}",
    func: searchJobs,
});

// Initialize ChatOpenAI with the API key
const chatModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
//   model: 'gpt-3.5-turbo',
  temperature: 0,
});

async function startNewConversation(): Promise<number> {
  const result = await db.insert(conversations).values({});
  const insertId = Number(result.lastInsertRowid);
  if (isNaN(insertId) || insertId <= 0) {
    throw new Error('Failed to obtain a valid insertId from database');
  }
  return insertId;
}

async function saveMessage(conversationId: number, messageType: 'user' | 'ai', text: string): Promise<void> {
  await db.insert(messages).values({
    conversationId,
    type: messageType,
    text,
  });
}

async function getAiResponse(message: string, messageHistory: string): Promise<string> {

    const tools = [new TavilySearchResults({ maxResults: 1 }), calculatorTool, jobSearchTool];

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a world class a recruiter and a HR professional."],
    ["user", "{input}"],
    new MessagesPlaceholder("chat_history"),
    new MessagesPlaceholder("agent_scratchpad"),
  ]);
  
  const outputParser = new StringOutputParser();

  const agent = await createOpenAIToolsAgent({
    llm: chatModel,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  const chatHistory = JSON.parse(messageHistory).map((mes: any) => {
    if (mes.type === 'user') {
      return new HumanMessage(mes.text);
    } else {
      return new AIMessage(mes.text);
    }
  });
  
  const result = await agentExecutor.invoke({
    input: message,
    chat_history: chatHistory,
  });
    return result.output;
}

function performCalculation(expression: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const result = evaluate(expression);
      resolve(`The result of ${expression} is ${result}`);
    } catch (error) {
      console.error('Error performing calculation:', error);
      reject('Sorry, I could not perform the calculation.');
    }
  });
}

function searchJobs(input: string): Promise<string> {
  const criteria: jobCriteria = JSON.parse(input);
    return new Promise((resolve, reject) => {
      try {
        // Search jobs using the criteria, and the public api from https://jobicy.com/jobs-rss-feed
        const { tag, location, industry, remote } = criteria;
        let jobUrl = '';
        if (remote) {
            jobUrl = `https://jobicy.com/api/v2/remote-jobs?&tag=${tag}&count=3`;
        } else {
            jobUrl = `https://jobicy.com/api/v2/jobs?location=${location}&tag=${tag}&count=3`;
        }

        // console.log(jobUrl);

        // Fetch job data from the constructed URL
      fetch(jobUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => resolve(JSON.stringify(data)))
        .catch(error => {
            console.error('Error fetching jobs:', error);
            reject('Sorry, I could not find a job.');
        });

        
      } catch (error) {
        console.error('Error finding jobs:', error);
        reject('Sorry, I could not find a job.');
      }
    });
  }

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
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
        throw new Error('Invalid conversationId in cookies');
      }
    } else {
      conversationId = await startNewConversation();
      setCookie({ res }, 'conversationId', conversationId.toString(), {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }

    // Save the user's message
    await saveMessage(conversationId, 'user', message);

    // Get AI response using LangChain
    const aiMessage = await getAiResponse(message, cookies.messages || '');

    await saveMessage(conversationId, 'ai', aiMessage);

    res.status(200).json({ message: aiMessage });
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
}
