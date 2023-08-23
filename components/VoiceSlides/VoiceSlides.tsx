import { useCallback, useEffect, useState } from "react";
import WebSpeechPromptInput from "../WebSpeechPromptInput/WebSpeechPromptInput";

type VoiceSlidesProps = {};

type SlideCard = {
  image: string;
  voiceOverText?: string;
  nextPageTrigger?: string | RegExp;
  canTouch?: boolean;
};

const deck: SlideCard[] = [
  {
    image: "/Idle_Screen_1.png",
    nextPageTrigger: "I'm hungry",
    canTouch: true,
  },
  {
    image: "/starters_6.png",
    voiceOverText:
      "Welcome to Wahlburgers! Please begin by telling me what you'd like to order.",
    nextPageTrigger: /bacon burger/,
    canTouch: true,
  },
  {
    image: "/Menu_order_3.png",
    nextPageTrigger: /hold the lettuce/,
    voiceOverText:
      "Would you like your BBQ bacon burger with cheese, lettuce, tomato, and our signature sauce?",
  },
  {
    image: "/no_lettuce_4.png",
    voiceOverText:
      "Of course, no lettuce. This item has been added to your order! Would you like to add sides to that?",
    nextPageTrigger: /yes/,
  },
  {
    image: "/starters_6.png",
    voiceOverText: "What sides would you like?",
    nextPageTrigger: /truffle fries/,
  },
  {
    image: "/menu_3items_10.png",
    voiceOverText:
      "This has been added to your order. Do you want a drink with that? I'd recommend our freshly squeezed lemonade with this burger. It's a favorite among our regulars. Would you like to try it?",
    nextPageTrigger: /yes/,
  },
  {
    image: "/lemonade_9.png",
    voiceOverText: "This item has been added. Is there anything else you want?",
    nextPageTrigger: /no/,
  },
  {
    image: "/finish_andpay_11.png",
    voiceOverText:
      "Please click “finish and pay” to complete your order. Thanks for ordering!",
  },
];

const VoiceSlides = (props: VoiceSlidesProps) => {
  const [prompt, setPrompt] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const currentSlide = deck[slideIndex];

  const speak = useCallback(
    (text: string) => {
      const synth = window.speechSynthesis;
      setIsSpeaking(true);
      synth.cancel();

      setTimeout(() => {
        synth.speak(new SpeechSynthesisUtterance(text));
        console.log(`speaking ${text}`);
        const checkSpeaking = () => {
          console.log(`is it still speaking? ${synth.speaking}`);
          if (!synth.speaking) {
            setIsSpeaking(false);
          } else {
            setTimeout(checkSpeaking, 200);
          }
        };
        setTimeout(checkSpeaking, 2000);
      }, 1000);
    },
    [setIsSpeaking]
  );

  useEffect(() => {
    if (currentSlide.voiceOverText) {
      speak(currentSlide.voiceOverText);
    }
    setTimeout(() => setIsTransitioning(false), 5000);
  }, [slideIndex, currentSlide, speak]);

  const onSubmit = useCallback(() => {
    console.log(
      `voice input: ${prompt} looking for: ${currentSlide.nextPageTrigger}`
    );
    const triggered =
      currentSlide.nextPageTrigger !== undefined &&
      (currentSlide.nextPageTrigger instanceof RegExp
        ? prompt.match(currentSlide.nextPageTrigger)
        : prompt.includes(currentSlide.nextPageTrigger));

    if (triggered) {
      console.log("trigger word match");
    }
    if (
      (triggered || prompt.includes("next page")) &&
      slideIndex < deck.length - 1
    ) {
      console.log(`progressing to page ${slideIndex + 1}`);
      setSlideIndex(slideIndex + 1);
      setIsTransitioning(true);
    } else if (prompt.includes("previous page") && slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
      setIsTransitioning(true);
    }
    setPrompt("");
  }, [currentSlide, slideIndex, prompt]);

  return (
    <div
      className="flex flex-col gap-3 w-full h-screen items-center justify-end p-6"
      style={{
        backgroundImage: `url(${currentSlide.image})`,
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        backgroundPositionY: "top",
        backgroundPositionX: "center",
        backgroundSize: "contain",
      }}
    >
      <WebSpeechPromptInput
        className="max-w-xl opacity-75"
        prompt={prompt}
        onSubmit={onSubmit}
        key="prompt-input"
        updatePrompt={(prompt) => {
          console.log(`updatePrompt:${prompt}`);
          setPrompt(prompt);
        }}
        speaking={isTransitioning || isSpeaking}
      />
    </div>
  );
};

export default VoiceSlides;
