import { useEffect, useRef, useCallback, useState } from "react";
import ContentEditable from "react-contenteditable";
import Image from "next/image";
import classNames from "classnames";

interface WebSpeechPromptInputProps {
  className?: string;
  prompt: string;
  onSubmit: () => void;
  updatePrompt: (prompt: string) => void;
  pause?: boolean;
  onPaused?: () => void;
  onResumed?: () => void;
}

const IDLE_TIMEOUT = 2000;
const two_line = /\n\n/g;
const one_line = /\n/g;
const linebreak = (s: string): string => {
  return s.replace(two_line, "<p></p>").replace(one_line, "<br>");
};

const first_char = /\S/;
const capitalize = (s: string): string => {
  return s.replace(first_char, function (m) {
    return m.toUpperCase();
  });
};

const showInfo = (s: string) => {
  const messages = new Map([
    ["start", "Click on the microphone icon and begin speaking."],
    ["speak_now", "Speak now."],
    [
      "no_speech",
      'No speech was detected. You may need to adjust your <a href="//support.google.com/chrome/answer/2693767" target="_blank">microphone settings</a>.',
    ],
    [
      "no_microphone",
      'No microphone was found. Ensure that a microphone is installed and that <a href="//support.google.com/chrome/answer/2693767" target="_blank">microphone settings</a> are configured correctly.',
    ],
    ["allow", 'Click the "Allow" button above to enable your microphone.'],
    ["not-allowed", "Permission to use microphone was denied."],
    [
      "upgrade",
      'Web Speech API is not supported by this browser. It is only supported by <a href="//www.google.com/chrome">Chrome</a> version 25 or later on desktop and Android mobile.',
    ],
    ["stop", "Stop listening, click on the microphone icon to restart"],
    ["copy", "Content copy to clipboard successfully."],
    ["end_prompt", "Prompt end...submitting"],
  ]);

  if (s) {
    const message = messages.get(s);
    if (message) {
      console.log(message);
    } else {
      console.log(s);
    }
  }
};

const WebSpeechPromptInput: React.FC<WebSpeechPromptInputProps> = ({
  className,
  prompt,
  onSubmit,
  updatePrompt,
  pause,
  onPaused,
  onResumed,
}) => {
  const [talkButtonImage, setTalkButtonImage] = useState<string>("/mic.gif");
  const [recognition, setRecognition] = useState<any>();
  const [recognizing, setRecognizing] = useState<boolean>(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [transcript, setTranscript] = useState<{
    interim: string;
    finale: string;
  }>({ interim: "", finale: "" });
  const [, setIdleTimer] = useState<number>();
  const [idleTimedOut, setIdleTimedOut] = useState<boolean>(false);
  const [enableSpeech, setEnableSpeech] = useState<boolean>(false);

  useEffect(() => {
    if (!recognition) {
      return;
    }
    if (enableSpeech && !pause && !recognizing && !readyToSubmit) {
      console.log("starting recognition...");
      contentEditableRef?.current?.focus();
      recognition.lang = "en-US";
      recognition.start();
      setTalkButtonImage("/mic-slash.gif");
      showInfo("allow");
    } else if ((!enableSpeech || pause) && recognizing) {
      console.log("stopping recognition...");
      recognition.stop();
      return;
    }
  }, [pause, recognition, recognizing, enableSpeech, readyToSubmit]);

  const onMicClick = useCallback(
    (event: React.MouseEvent) => setEnableSpeech((value) => !value),
    [enableSpeech]
  );

  useEffect(() => {
    if (!readyToSubmit) {
      return;
    }
    if (prompt !== "") {
      console.log(`Submiting voice prompt: ${prompt}`);
      onSubmit();
    }
    setReadyToSubmit(false);
  }, [prompt, readyToSubmit, onSubmit]);

  const checkKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.ctrlKey || e.shiftKey) {
          document.execCommand("insertHTML", false, "<br/><br/>");
        } else {
          setReadyToSubmit(true);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [prompt]
  );

  const contentEditableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (idleTimedOut) {
      console.log(`on idle timeout ${recognition} ${recognizing}`);
      if (recognition && recognizing) {
        showInfo("end_prompt");
        recognition.stop();
      }
    }
    setIdleTimedOut(false);
  }, [idleTimedOut, recognition, recognizing]);

  useEffect(() => {
    console.log(`Initializing Speech Recognition: ${recognition}`);
    if (!("webkitSpeechRecognition" in window)) {
      showInfo("upgrade");
    } else if (!recognition) {
      setRecognition(() => {
        const r = new webkitSpeechRecognition();
        showInfo("start");
        r.continuous = true;
        r.interimResults = true;

        r.onstart = () => {
          showInfo("speak_now");
          setTalkButtonImage("/mic-animation.gif");
          setRecognizing(true);
          if (onResumed) {
            onResumed();
          }
        };
        r.onend = () => {
          setRecognizing(false);
          setTalkButtonImage("/mic.gif");
          showInfo("stop");
          setReadyToSubmit(true);
          if (onPaused) {
            onPaused();
          }
        };
        r.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === "no-speech") {
            setTalkButtonImage("/mic.gif");
            showInfo("no_speech");
            setReadyToSubmit(true);
          }
          if (event.error === "audio-capture") {
            setTalkButtonImage("/mic.gif");
            showInfo("no_microphone");
          }
          if (event.error === "not-allowed") {
            showInfo("not-allowed");
          }
        };
        r.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = { interim: "", finale: "" };

          for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcript.finale += event.results[i][0].transcript;
            } else {
              transcript.interim += event.results[i][0].transcript;
            }
          }

          if (transcript.finale !== "") {
            console.log(`voice transcript: ${transcript.finale}`);
            setTranscript(transcript);
            setIdleTimer((oldTimer: number | undefined): number => {
              if (oldTimer) {
                clearTimeout(oldTimer);
              }
              return window.setTimeout(
                () => setIdleTimedOut(true),
                IDLE_TIMEOUT
              );
            });
          }
        };
        return r;
      });
    }
  }, [recognition, onSubmit, updatePrompt]);

  useEffect(() => {
    window.addEventListener("keydown", checkKeyPress);
    return () => {
      window.removeEventListener("keydown", checkKeyPress);
    };
  }, [checkKeyPress]);

  useEffect(() => {
    // transcript changes
    if (transcript.finale !== "") {
      console.log(`transcript changes: ${transcript.finale}`);
      updatePrompt(transcript.finale);
    }
  }, [transcript]);

  return (
    <div
      className={classNames(
        className,
        "bg-neutral-800 rounded-xl h-12 w-full flex items-center justify-between"
      )}
    >
      <div className="flex flex-row w-full h-full">
        <ContentEditable
          innerRef={contentEditableRef}
          html={prompt}
          disabled={false}
          id="prompt-input"
          className="prompt-input h-full"
          onChange={(event) => updatePrompt(event.target.value)}
        />
        <button style={{ display: "inline-block" }} onClick={onMicClick}>
          <Image
            width={50}
            height={50}
            src={talkButtonImage}
            className="rounded"
            alt="Lets Talk"
          />
        </button>
      </div>
    </div>
  );
};

export default WebSpeechPromptInput;
