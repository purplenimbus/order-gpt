import { useCallback, useEffect, useState } from "react";
import WebSpeechPromptInput from "../WebSpeechPromptInput/WebSpeechPromptInput";

type OrderGptSlidesProps = {};

type SlideCard = {
  image: string;
  voiceOverText?: string;
  nextPageTrigger?: string | RegExp;
  canTouch?: boolean;
};

const deck: SlideCard[] = [
  {
    image: "slides/idle_Screen_1.png",
    nextPageTrigger: "I'm hungry",
    canTouch: true,
  },
  {
    image: "slides/starters_6.png",
    voiceOverText: "Welcome to Wahlburgers! Please begin by telling me what you'd like to order.",
    nextPageTrigger: /bacon burger/,
    canTouch: true,
  },
  {
    image: "slides/Menu_order_3.png",
    nextPageTrigger: /the lettuce/,
    voiceOverText: "Would you like your BBQ bacon burger with cheese, lettuce, tomato, and our signature sauce?",
  },
  {
    image: "slides/no_lettuce_4.png",
    voiceOverText: "Of course, no lettuce. This item has been added to your order!",
  },
  {
    image: "slides/burger_added_5.png",
    voiceOverText: "Do you want to add any starters?",
    nextPageTrigger: /yes/,
  },
  {
    image: "slides/menu_2items_8.png",
    voiceOverText: "Would you like to add sides to that?",
    nextPageTrigger: /truffle fries/,
  },
  {
    image: "slides/truffle_7.png",
    voiceOverText: "This has been added to your order. Do you want a drink with that? I'd recommend our freshly squeezed lemonade with this burger. It's a favorite among our regulars. Would you like to try it?",
    nextPageTrigger: /yes/,
  },
  {
    image: "slides/lemonade_9.png",
    voiceOverText: "This item has been added. Is there anything else you want?",
    nextPageTrigger: /no/,
  },
  {
    image: "slides/finish_andpay_11.png",
    voiceOverText: "Please click “finish and pay” to complete your order. Thanks for ordering!",
  },
];

const OrderGptSlides = (props: OrderGptSlidesProps) => {
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
    <div className="flex flex-col gap-3 max-w-2xl">
      <div id="slide">
        <img src={`/${currentSlide.image}`} />
      </div>
      <WebSpeechPromptInput
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

export default OrderGptSlides;
