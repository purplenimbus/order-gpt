import { useState, useEffect } from "react";
import JSONBox from "../../components/JSONBox/JSONBox";
import WebSpeechPromptInput from "../../components/WebSpeechPromptInput/WebSpeechPromptInput";
import { ResponseInterface } from "../../components/PromptResponseList/response-interface";
import PromptResponseList from "../../components/PromptResponseList/PromptResponseList";
import ApiClient from "../../api";

type ModelValueType = "gpt" | "codex" | "image";

type ConversationType = {
  role: string;
  content: string;
};

const OrderGpt = () => {
  const [conversation, setConversation] = useState<ConversationType>();
  const [initialized, setInitialized] = useState<boolean>(false);
  const [responseList, setResponseList] = useState<ResponseInterface[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [promptToRetry, setPromptToRetry] = useState<string | null>(null);
  const [uniqueIdToRetry, setUniqueIdToRetry] = useState<string | null>(null);
  const [modelValue, setModelValue] = useState<ModelValueType>("gpt");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mentionedItems, setMentionedItems] = useState<string>("");
  const [order, setOrder] = useState<string>("");
  const [ordered, setOrdered] = useState<boolean>();
  let loadInterval: number | undefined;

  console.log("App");

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
  };

  useEffect(() => {
    if (!initialized) {
      // Send a POST request to the API with the prompt in the request body
      ApiClient.post("/conversation", {}).then((response) => {
        console.log("start conversation", response);
        setConversation(response.data);
        setInitialized(true);
      });
    }
  }, [initialized]);

  const htmlToText = (html: string) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent;
  };

  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const addLoader = (uid: string) => {
    const element = document.getElementById(uid) as HTMLElement;
    element.textContent = "";

    // @ts-ignore
    loadInterval = setInterval(() => {
      // Update the text content of the loading indicator
      element.textContent += ".";

      // If the loading indicator has reached three dots, reset it
      if (element.textContent === "....") {
        element.textContent = "";
      }
    }, 300);
  };

  const addResponse = (selfFlag: boolean, response?: string) => {
    const uid = generateUniqueId();
    setResponseList((prevResponses) => [
      ...prevResponses,
      {
        id: uid,
        response,
        selfFlag,
      },
    ]);
    return uid;
  };

  const updateResponse = (
    uid: string,
    updatedObject: Record<string, unknown>
  ) => {
    setResponseList((prevResponses) => {
      const updatedList = [...prevResponses];
      const index = prevResponses.findIndex((response) => response.id === uid);
      if (index > -1) {
        updatedList[index] = {
          ...updatedList[index],
          ...updatedObject,
        };
      }
      return updatedList;
    });
  };

  const regenerateResponse = async () => {
    await getGPTResult(promptToRetry, uniqueIdToRetry);
  };

  const getGPTResult = async (
    _promptToRetry?: string | null,
    _uniqueIdToRetry?: string | null
  ) => {
    // Get the prompt input
    const _prompt = _promptToRetry ?? htmlToText(prompt);
    console.log(
      `getGPTResult isloading:${isLoading} _prompt:${_prompt} prompt:${prompt} `
    );

    // If a response is already being generated or the prompt is empty, return
    if (isLoading || !_prompt) {
      return;
    }

    setIsLoading(true);

    // Clear the prompt input
    setPrompt("");

    let uniqueId: string;
    if (_uniqueIdToRetry) {
      uniqueId = _uniqueIdToRetry;
    } else {
      // Add the self prompt to the response list
      addResponse(true, _prompt);
      uniqueId = addResponse(false);
      await delay(50);
      addLoader(uniqueId);
    }

    try {
      // Send a POST request to the API with the prompt in the request body
      const response = await ApiClient.post("/prompt", {
        conversation,
        prompt: _prompt,
        model: modelValue,
      });
      if (modelValue === "image") {
        // Show image for `Create image` model
        updateResponse(uniqueId, {
          image: response.data,
        });
      } else {
        setConversation(response.data.conversation);
        updateResponse(uniqueId, {
          response: response.data.content.trim(),
        });
      }

      setPromptToRetry(null);
      setUniqueIdToRetry(null);
    } catch (err) {
      setPromptToRetry(_prompt);
      setUniqueIdToRetry(uniqueId);
      updateResponse(uniqueId, {
        // @ts-ignore
        response: `Error: ${err.message}`,
        error: true,
      });
    } finally {
      // Clear the loader interval
      clearInterval(loadInterval);
      setIsLoading(false);
    }
  };

  const getSystemContext = async (prompt: string): Promise<string> => {
    console.log(`getSystemContext`);
    // Send a POST request to the API with the prompt in the request body
    try {
      const response = await ApiClient.post("/system", {
        conversation,
        prompt,
        model: modelValue,
      });
      console.log(`${prompt}: ${response.data.content}`);
      return response.data.content;
    } catch (err: any) {
      if (err instanceof Error) {
        console.error(`API Error: ${prompt} - ${err.message}`);
      }
      return "";
    }
  };

  useEffect(() => {
    setTimeout(async () => {
      setMentionedItems(
        await getSystemContext(
          "What are the menu item names mentioned in the last prompt, using names that exactly match the menu, in a flat json array of string?"
        )
      );
      setOrder(
        await getSystemContext(`
      What is the user\'s order only in this JSON format, using names that exactly match the menu, without any additional text?
        {
          "customer_name": ...,
          "menu_items": [ { "menu_item_name": ..., "quantity": ..., "toppings": [{ "name":..., "yes_or_no": ... }, ...], "bun": ... }, ... ]
          "sides": [ { "name": ..., "quantity": ... } ],
          "starters": [ { "name": ..., "quantity": ... } ],
          "salads": [ { "name": ..., "quantity": ..., "toppings": [{ "name":..., "yes_or_no"}], "dressing":... } ],
          "drinks": [ { "name": ..., "quantity": ... } ]
        }
      If the user did not order anything yet, then leave the array empty.
      `)
      );
      setOrdered(
        (await getSystemContext(
          "Do you know what the customer ordered, reply in TRUE or FALSE without any other text?"
        )) == "TRUE"
      );
      await getSystemContext(
        "Do you know name of the user, reply in TRUE or FALSE without any other text?"
      );
      await getSystemContext("What is the name of the user, in a string?");
    }, 0);
  }, [conversation]);

  return (
    <main className="flex h-full min-h-screen flex-col items-center justify-between">
      <div className="flex flex-col gap-3 grow w-full max-w-7xl overflow-x-auto px-8">
        <div className="overflow-x-scroll w-full flex flex-row">
          <JSONBox title="Mentioned Items" text={mentionedItems} />
          <JSONBox title="Order" text={order} />
          <JSONBox title="Ordered?" text={ordered ? "true" : "false"} />
        </div>
        <div id="response-list" className="overflow-y-auto">
          <PromptResponseList
            responseList={responseList}
            onSpeaking={(speaking: boolean) => setIsSpeaking(speaking)}
            key="response-list"
          />
        </div>
        {uniqueIdToRetry && (
          <div id="regenerate-button-container">
            <button
              id="regenerate-response-button"
              className={isLoading ? "loading" : ""}
              onClick={() => regenerateResponse()}
            >
              Regenerate Response
            </button>
          </div>
        )}
        <WebSpeechPromptInput
          prompt={prompt}
          onSubmit={getGPTResult}
          key="prompt-input"
          updatePrompt={setPrompt}
          pause={isSpeaking}
        />
      </div>
    </main>
  );
};

export default OrderGpt;
