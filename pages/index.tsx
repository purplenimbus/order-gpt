import { useState } from "react";
import VoiceSlides from "../components/VoiceSlides/VoiceSlides";

export default function Home() {

  return (
    <main className="flex h-full min-h-screen flex-col items-center justify-between bg-white">
      <VoiceSlides />
    </main>
  )
}
