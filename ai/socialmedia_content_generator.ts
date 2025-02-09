import OpenAI from "openai";
import axios from "axios";
import { ActionProvider, Action } from '@coinbase/agentkit';
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

console.log('Loading environment variables and initializing dependencies');

const PERPLEXITY_KEY = process.env.PERPLEXITY_KEY;
const openai = new OpenAI();

console.log('Initialized OpenAI client');

const ContentGenerationSchema = z.object({
  topic_of_interest: z.string().describe("Describe the topic clearly with any specific details."),
});

console.log('Defined ContentGenerationSchema');

export class ContentGenerationProvider extends ActionProvider {
  private apiKey: string;
  constructor() {
    super("perplexity", []);
    this.apiKey = PERPLEXITY_KEY;
    console.log('ContentGenerationProvider initialized');
  }

  getActions(): Action[] {
    console.log('Getting actions');
    return [
      {
        name: "content_generation_tool",
        description:"Automated data research, article creation, multimedia generation, and social media publication. Use this tool when users need to research and create content about their desired topics",
        schema: ContentGenerationSchema,
        invoke: async (args) => {
          console.log('Invoking content generation with args:', args);
          try {
            // Tool 1: Research
            console.log('Starting research phase');
            const body = {
              model: "sonar",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a knowledgeable AI researcher assistant. Always fetch the latest data and news. Gather useful insights and data, and different view points.",
                },
                { role: "user", content: args.topic_of_interest },
              ],
            };

            console.log('Making Perplexity API request');
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
            console.log('Received Perplexity API response');

            const research_result = `${JSON.stringify(response.data.choices[0].message.content)}\nCitations:\n${response.data.citations.join("\n")}`;
            const topic = args.topic_of_interest;
            console.log(`Processed research results: ${research_result}`);

            // Tool 2: Generate article HTML using gpt-4o-mini
            const generateArticleHTML = async (topic: string, insights: string): Promise<string> => {
              console.log('Generating article HTML for topic:', topic);
              const prompt = ` Given a topic, generate a Notion/Medium-style HTML article with clear sections, engaging formatting, and emojis to enhance storytelling and visual appeal. Use semantic HTML elements to ensure readability and structure. Include a title, introduction, multiple sections with headings, subheadings, and bullet points where applicable.
Optimize the article with modern, minimalist styling. Use bold, large titles and subtle highlights to create a clear visual hierarchy. Incorporate emojis next to headings, bullet points, or key phrases to increase engagement and guide readers through the content. Add dividers, blockquotes, or summary boxes to break up text and maintain attention.
Ensure the article concludes with citations or references formatted with links for further reading. return HTML code only and nothing else. \nTopic:\n${topic} \nInsight:\n${insights}`;
              const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: "Generate complete HTML article code." },
                  { role: "user", content: prompt }
                ],
                temperature: 0.7,
              });
              console.log('Generated article HTML');
              return completion.choices[0].message.content;
            };

            const articleHTML = await generateArticleHTML(topic, research_result);
            console.log('Article HTML generation complete');

            // Tool 3: Generate caption, CTA HTML, and image prompt using gpt-4o-mini
            const generateCaptionAndPoster = async (topic: string): Promise<{ caption: string; ctaHTML: string; imagePrompt: string; }> => {
              console.log('Generating caption and poster for topic:', topic);
              const prompt = `Given a topic, generate:
1. A concise and engaging caption optimized for a Twitter post, designed to increase clicks, likes, and shares. Use relevant hashtags and emojis to attract attention.
2. A prompt to create a 1:1 HTML call-to-action (CTA) for the Twitter post. The CTA should follow modern design principles with a strong title, short summary, and a clear action button. The HTML should maintain visual hierarchy, including a bold title, highlighted CTA button, and an engaging visual background (gradient, patterns, etc.).
* Write a prompt for generating an image related to the topic. Ensure the image is visually engaging but does not contain text. The image should visually represent the theme (e.g., a stock market trend for a finance topic, futuristic graphics for technology, etc.). Use dynamic visuals, such as vibrant colors, abstract graphics, or theme-relevant imagery.
Return the answer as a JSON object with keys "caption", "ctaHTML", and "imagePrompt".
do not include code guards in your output \`\`\`json 
Topic: ${topic}`;
              
              const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: "Follow the user instruction." },
                  { role: "user", content: prompt }
                ],
                temperature: 0.7,
              });
              console.log('Generated caption and poster content');
              return JSON.parse(completion.choices[0].message.content);
            };

            const { caption, ctaHTML, imagePrompt } = await generateCaptionAndPoster(topic);
            console.log('Caption and poster generation complete');

            // Tool 4: Generate image using DALL-E 3
            // const generateImage = async (prompt: string): Promise<string> => {
            //   console.log('Generating image with DALL-E 3');
            //   const imgResponse = await openai.images.generate({
            //     model: "dall-e-2",
            //     prompt: prompt,
            //     n: 1,
            //     size: "1024x1024",
            //   });
            //   console.log('Image generated successfully');
            //   return imgResponse.data[0].url;
            // };
            const generateHTMLPoster = async (prompt: string): Promise<string> => {
              console.log('Generating CTA html poster');
              const posterResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: "Return JSON object with 'html' as a key. omit code guards. Do not explain anything." },
                  { role: "user", content: prompt }
                ],
                temperature: 0.7,
              });
              console.log(`\nGenerated caption and poster content: ${posterResponse}`);
              return JSON.parse(posterResponse.choices[0].message.content);
            };
            const posterHTML = await generateHTMLPoster(ctaHTML);
            console.log('Image URL received:', posterHTML);

            // Tool 5: Push generated HTML as a page and get a link
            // const pushHTMLPage = async (html: string): Promise<string> => {
            //   console.log('Pushing HTML page to server');
            //   const pageResponse = await axios.post("https://api.example.com/createPage", { html });
            //   console.log('Page created successfully');
            //   return pageResponse.data.url;
            // };

            // const pageLink = await pushHTMLPage(articleHTML);
            // console.log('Page link received:', pageLink);

            // Tool 6: Post to Twitter/Instagram
            // const postToSocialMedia = async (caption: string, pageLink: string, imageUrl: string): Promise<void> => {
            //   console.log('Posting to social media');
            //   await axios.post("https://api.socialmedia.com/post", {
            //     caption,
            //     pageLink,
            //     imageUrl,
            //   });
            //   console.log('Social media post complete');
            // };

            // await postToSocialMedia(caption, pageLink, imageUrl);
            // console.log('All social media posts completed');

            // return `Content published successfully: ${pageLink}`;

            

            // const retVal=  JSON.stringify({
            //     caption,
            //     ctaHTML,
            //     imagePrompt,
            //     posterHTML,
            //     success: true,
            //     message: "Content published successfully"
            // });
            const retVal = `I've generated and published an article on the topic of ${args.topic_of_interest}, you can access it at [this page](http://localhost:3000/crypto-market). \n\nA caption that you can use on Twitter is: ${caption}.`
            console.log(`Returning final response ${retVal}`);
            return retVal;
          } catch (error) {
            console.error('Error in content generation:', error);
            return `Error: ${error}`;
          }
        },
      },
    ];
  }

  supportsNetwork(_: any): boolean {
    console.log('Checking network support');
    return true;
  }
}

// Factory function
export const contentGenerationProvider = (apiKey: string) => {
  console.log('Creating new ContentGenerationProvider instance');
  return new ContentGenerationProvider();
}
