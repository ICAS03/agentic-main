import { z } from "zod";
import axios from "axios";
import { ActionProvider,Action } from '@coinbase/agentkit';
import dotenv from 'dotenv';
dotenv.config();

const PERPLEXITY_KEY = process.env.PERPLEXITY_KEY
// Define schema for user query
const PerplexityResearchSchema = z.object({
  query: z.string().describe("Accurately identify and describe the user's query and the core topic of research. Ensure clarity in understanding the user's intent, including any specific details, context, or areas of focus mentioned."),
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
          description: "Do not use for content generation. Strictly for research-only queries using Perplexity AI. Provide accurate, up-to-date information based on the user's query.",
          schema: PerplexityResearchSchema,
          invoke: async (args) => {
            try {
              // fetch history 
              // ai analyse
              // give suggestion
              const body = {
                model: "sonar",
                messages: [
                  { role: "system", content: `You are a knowledgeable AI market trading assistant. By default, always fetch and incorporate the latest 2025 data, news, and market developments into your responses unless the user specifies otherwise. Adapt your answers to thoroughly understand and address each user's request with tailored, insightful, and data-driven solutions. Provide clear, concise, and actionable advice, leveraging relevant market trends and expert analysis to effectively assist users.`},
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
  
              return `${JSON.stringify(response.data.choices[0].message.content)}\nCitations:\n${response.data.citations.join('\n')}`;
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
