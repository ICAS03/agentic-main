import { z } from "zod";
import axios from "axios";
import { ActionProvider, Action } from '@coinbase/agentkit';
import dotenv from 'dotenv';
dotenv.config();

const PERPLEXITY_KEY = process.env.PERPLEXITY_KEY;

// Define schema for user query
const PerplexityResearchSchema = z.object({
  query: z.string().describe("Question to research"),
});

// Helper function to parse sources from text
const extractSources = (text: string) => {
  const sourceRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const sources = [];
  let match;
  
  while ((match = sourceRegex.exec(text)) !== null) {
    sources.push({
      name: match[1],
      url: match[2]
    });
  }
  
  return sources;
};

// Helper function to parse content sections
const parseContent = (content: string) => {
  const sections = content.split('###').filter(Boolean);
  let overview = [];
  let strategies = [];
  
  sections.forEach(section => {
    const lines = section.trim().split('\n').filter(Boolean);
    const title = lines[0].trim();
    
    if (title.toLowerCase().includes('overview')) {
      overview = lines.slice(1)
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().replace(/^-\s*/, '')
        .replace(/\*\*/g, ''));
    } else if (title.toLowerCase().includes('strategies')) {
      strategies = lines.slice(1)
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.trim()
        .replace(/^\d+\.\s*/, '')
        .replace(/\*\*/g, ''));
    }
  });
  
  return { overview, strategies };
};

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
                { 
                  role: "system", 
                  content: `You are a helpful AI market trading assistant. 
                  
Format your response exactly as follows:

### Overview
- Key point 1
- Key point 2
- Key point 3
- Key point 4

### Trading Strategies
1. Strategy 1 description
2. Strategy 2 description
3. Strategy 3 description
4. Strategy 4 description
5. Strategy 5 description

Include 3-5 relevant sources in markdown link format: [Source Name](URL)
` 
                },
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

            const content = response.data.choices[0].message.content;
            
            // Parse the content into structured data
            const { overview, strategies } = parseContent(content);
            const sources = extractSources(content);

            // Return structured data that will be passed to the ResearchDisplay component
            return {
              type: 'research',
              data: {
                title: `Research: ${args.query}`,
                overview,
                strategies,
                sources
              }
            };

          } catch (error) {
            console.error('Perplexity API Error:', error);
            return {
              type: 'error',
              message: `Error from Perplexity AI: ${error.message}`
            };
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