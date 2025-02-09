import { z } from "zod";
import axios from "axios";
import { ActionProvider,Action } from '@coinbase/agentkit';
import dotenv from 'dotenv';
dotenv.config();

const PERPLEXITY_KEY = process.env.PERPLEXITY_KEY
// Define schema for user query
const PerplexityResearchSchema = z.object({
  query: z.string().describe("Question to research"),
});

export class PerplexityResearchProvider extends ActionProvider {
  private apiKey: string;

  constructor() {
    super("perplexity", []);
    this.apiKey = PERPLEXITY_KEY;
  }

  getActions(): Action[] {
      return [
        {
          name: "research_latest_news",
          description: "Calls Perplexity AI to answer user query with latest info",
          schema: PerplexityResearchSchema,
          invoke: async (args) => {
            try {
              const body = {
                model: "sonar",
                messages: [
                  { role: "system", content: `You are a helpful AI market trading assitant.

Rules:
1. Provide only the final answer. It is important that you do not include any explanation on the steps below.
2. Do not show the intermediate steps information.

Steps:
1. Decide if the answer should be a brief trading recommendation, a market insight, or a list of strategies/suggestions.
2. If it’s a list of strategies or suggestions, start with a succinct overview based on the query.
3. Follow with a list of strategies or suggestions, each separated by two newlines, reflecting the best practices and knowledge in the trading and market context.
`},
                  { role: "user", content: args.query },
                ],

              };
  
              const response = await axios.post(
                "https://api.perplexity.ai/chat/completions",
                body,
                {
                  headers: {
                    Authorization: `Bearer ${PERPLEXITY_KEY}`,
                    "Content-Type": "application/json",
                  },
                }
              );
  
              return `${JSON.stringify(response.data.choices[0].message.content)}`;
            } catch (error) {
              return `Error from Perplexity AI: ${error}`;
            }
          },
        },
      ];
    }
  supportsNetwork(_: Network): boolean {
    return true;
  }
}








// Factory function
export const perplexityResearchProvider = (apiKey: string) =>
  new PerplexityResearchProvider();
