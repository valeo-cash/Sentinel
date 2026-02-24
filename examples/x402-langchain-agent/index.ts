import { SentinelX402Tool } from "@x402sentinel/langchain";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

async function main() {
  console.log("\u{1F52C} Research Agent Starting\n");
  console.log("This agent will research a topic by paying");
  console.log("for data from x402 endpoints.\n");
  console.log("All payments tracked by Sentinel.\n");
  console.log("\u2501".repeat(50) + "\n");

  // Sentinel x402 tool — all payments audited
  const x402Tool = new SentinelX402Tool({
    agentId: "research-agent",
    apiKey: process.env.SENTINEL_API_KEY,
  });

  // LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Prompt
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a research agent. Use the sentinel_x402_fetch 
tool to fetch paid data from x402 endpoints. You have a budget 
of $1.00 total. Be efficient with your calls.`,
    ],
    ["human", "{input}"],
  ]);

  // Create agent
  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools: [x402Tool],
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools: [x402Tool],
    verbose: true,
  });

  // Run research
  const result = await executor.invoke({
    input: "Research the latest weather data for Berlin and summarize it.",
  });

  console.log("\n" + "\u2501".repeat(50));
  console.log("\n\u{1F4CA} Research complete.");
  console.log("Result:", result.output);
  console.log("\n\u{1F6E1}\uFE0F  All payments tracked by Sentinel");
  console.log("   Dashboard: sentinel.valeocash.com");
  console.log("   Receipts:  sentinel.valeocash.com/dashboard/receipts\n");
}

main().catch(console.error);
