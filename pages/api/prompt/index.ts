import { HttpStatusCode } from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { BASE_CONVERSATION } from "../conversation";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  const { method } = req;

  switch (method) {
    case "POST":
      // Get the prompt from the request body
      const { prompt, conversation, model = "gpt" } = req.body;

      // Check if prompt is present in the request
      if (!prompt) {
        // Send a 400 status code and a message indicating that the prompt is missing
        return res
          .status(400)
          .send({ error: "Prompt is missing in the request" });
      }
      conversation.push({ role: 'user', content: prompt });

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: conversation as any,
        });
        console.log(completion.choices);

        // save response to conversation
        conversation.push(completion.choices[0].message as any);

        // Send the generated text as the response
        return res.send({ conversation, content: completion.choices[0].message.content });
      } catch (error) {
        handleError(error, res);
      }

      break;
    default:
      res.setHeader("Allow", ["POST"]);
      res
        .status(HttpStatusCode.MethodNotAllowed)
        .end(`Method ${method} Not Allowed`);
  }
};

const handleError = (error: any, res: NextApiResponse<any>) => {
  const errorMsg = error.response ? error.response.data.error : `${error}`;
  console.error(errorMsg);
  // Send a 500 status code and the error message as the response
  return res.status(500).send(errorMsg);
};

export default handler;
