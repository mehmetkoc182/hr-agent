// This file contains the code that interacts with the OpenAI API and the tools that are used in the chatbot.

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { evaluate } from "mathjs";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";

type jobCriteria = {
    tag: string;
    jobType: string;
    location: string;
    geo: string;
    industry: string;
    remote: boolean;
};

const chatModel = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0,
  });

const calculatorTool = new DynamicTool({
  name: "calculator",
  description: "Returns the result of a math calculation.",
  func: performCalculation,
});

// TODO: Fix this tool
// The existing prompt doesn't seem to pick up the linkify tool.

// const linkifyTool = new DynamicTool({
//     name: "createLinks",
//     // description: "Call this when the response includes website urls. Send the web links into the function and replace them with what the function returns in the initial response.",
//     description: "Call this when the response includes website urls.",
//     func: linkify,
//   });

const jobSearchTool = new DynamicTool({
  name: "jobSearch",
  description:
    "Finds jobs that match the user's jobCriteria input that is a stringified json object that should be in this format: {tag: string, location: string, geo: string, industry: string, remote: boolean}",
  func: searchJobs,
});

function performCalculation(expression: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const result = evaluate(expression);
      resolve(`The result of ${expression} is ${result}`);
    } catch (error) {
      console.error("Error performing calculation:", error);
      reject("Sorry, I could not perform the calculation.");
    }
  });
}

// function linkify(link: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       try {
//         resolve(`<a href="${link}" target="_blank">${link}</a>`);
//       } catch (error) {
//         console.error("Error creating links:", error);
//         reject("Sorry, I could not perform the link creation.");
//       }
//     });
//   }

function searchJobs(input: string): Promise<string> {
  const criteria: jobCriteria = JSON.parse(input);
  return new Promise((resolve, reject) => {
    try {
      const { tag, location, industry, remote } = criteria;
      let jobUrl = "";
      if (remote) {
        jobUrl = `https://jobicy.com/api/v2/remote-jobs?&tag=${tag}&count=3`;
      } else {
        jobUrl = `https://jobicy.com/api/v2/jobs?location=${location}&tag=${tag}&count=3`;
      }

      fetch(jobUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => resolve(JSON.stringify(data)))
        .catch((error) => {
          console.error("Error fetching jobs:", error);
          reject("Sorry, I could not find a job.");
        });
    } catch (error) {
      console.error("Error finding jobs:", error);
      reject("Sorry, I could not find a job.");
    }
  });
}

async function getAiResponse(
    message: string,
    messageHistory: any,
  ): Promise<string> {
    const tools = [
      new TavilySearchResults({ maxResults: 1 }), // This is the tool that is used to search for information
      calculatorTool, // This is the tool that is used to perform calculations
      jobSearchTool, // This is the tool that is used to search for jobs
    //   linkifyTool, // This is the tool that is used to create links
    ];
  
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a world class recruiter and a HR professional. You are chatting with a job seeker who is looking for a job. You are trying to help them find a job."],
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

    const chatHistory = messageHistory.map((mes: any) => {
      if (mes.type === "user") {
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

export { getAiResponse };
