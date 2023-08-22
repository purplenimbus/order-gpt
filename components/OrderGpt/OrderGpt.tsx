import {useState, useEffect} from 'react';
import WebSpeechPromptInput from "../WebSpeechPromptInput/WebSpeechPromptInput";
import {ResponseInterface} from "../PromptResponseList/response-interface";
import PromptResponseList from "../PromptResponseList/PromptResponseList";
import ApiClient from '../../api';

type ModelValueType = 'gpt' | 'codex' | 'image';

type ConversationType = {
  role: string;
  content: string;
}

const OrderGpt = () => {
  const [conversation, setConversation] = useState<ConversationType>();
  const [initialized, setInitialized] = useState<boolean>(false);
  const [responseList, setResponseList] = useState<ResponseInterface[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [promptToRetry, setPromptToRetry] = useState<string | null>(null);
  const [uniqueIdToRetry, setUniqueIdToRetry] = useState<string | null>(null);
  const [modelValue, setModelValue] = useState<ModelValueType>('gpt');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  let loadInterval: number | undefined;

  console.log("App");

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
  }

  useEffect(() => {
    if (!initialized) {
      // Send a POST request to the API with the prompt in the request body
      ApiClient.post('/conversation', {}).then((response) => {
        console.log('start conversation', response);
        setConversation(response.data);
        setInitialized (true);
      });
    }
  }, [initialized]);

  const htmlToText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent;
  }

  const delay = (ms: number) => {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  const addLoader = (uid: string) => {
    const element = document.getElementById(uid) as HTMLElement;
    element.textContent = ''

    // @ts-ignore
    loadInterval = setInterval(() => {
      // Update the text content of the loading indicator
      element.textContent += '.';

      // If the loading indicator has reached three dots, reset it
      if (element.textContent === '....') {
        element.textContent = '';
      }
    }, 300);
  }


  const addResponse = (selfFlag: boolean, response?: string) => {
    const uid = generateUniqueId()
    setResponseList(prevResponses => [
      ...prevResponses,
      {
        id: uid,
        response,
        selfFlag
      },
    ]);
    return uid;
  }

  const updateResponse = (uid: string, updatedObject: Record<string, unknown>) => {
    setResponseList(prevResponses => {
      const updatedList = [...prevResponses]
      const index = prevResponses.findIndex((response) => response.id === uid);
      if (index > -1) {
        updatedList[index] = {
          ...updatedList[index],
          ...updatedObject
        }
      }
      return updatedList;
    });
  }

  const regenerateResponse = async () => {
    await getGPTResult(promptToRetry, uniqueIdToRetry);
  }

  const getGPTResult = async (_promptToRetry?: string | null, _uniqueIdToRetry?: string | null) => {
    // Get the prompt input
    const _prompt = _promptToRetry ?? htmlToText(prompt);
    console.log(`getGPTResult isloading:${isLoading} _prompt:${_prompt} prompt:${prompt} `);

    // If a response is already being generated or the prompt is empty, return
    if (isLoading || !_prompt) {
      return;
    }

    setIsLoading(true);

    // Clear the prompt input
    setPrompt('');

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
      const response = await ApiClient.post('/prompt', {
        conversation,
        prompt: _prompt,
        model: modelValue
      });
      if (modelValue === 'image') {
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
        error: true
      });
    } finally {
      // Clear the loader interval
      clearInterval(loadInterval);
      setIsLoading(false);
    }
  }

  return (
    <div className="App">
      <div id="response-list">
        <PromptResponseList responseList={responseList} onSpeaking={(speaking: boolean) => setIsSpeaking(speaking)} key="response-list"/>
      </div>
      { uniqueIdToRetry &&
        (<div id="regenerate-button-container">
          <button id="regenerate-response-button" className={isLoading ? 'loading' : ''} onClick={() => regenerateResponse()}>
            Regenerate Response
          </button>
        </div>
        )
      }
      <div id="model-select-container">
        <label htmlFor="model-select">Select model:</label>
        <select id="model-select" value={modelValue} onChange={(event) => setModelValue(event.target.value as ModelValueType)}>
          <option value="gpt">GPT-3 (Understand and generate natural language )</option>
          <option value="codex">Codex (Understand and generate code, including translating natural language to code)
          </option>
          <option value="image">Create Image (Create AI image using DALL·E models)</option>
        </select>
      </div>
      <div id="input-container">
        <WebSpeechPromptInput
          prompt={prompt}
          onSubmit={() => getGPTResult()}
          key="prompt-input"
          updatePrompt={(prompt) => { console.log(`updatePrompt:${prompt}`); setPrompt(prompt); }}
          speaking={isSpeaking}
        />
        <button id="submit-button" className={isLoading ? 'loading' : ''} onClick={() => getGPTResult()}></button>
      </div>
    </div>
  );
}

export default OrderGpt;
