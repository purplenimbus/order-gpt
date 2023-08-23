import { useState } from "react";
import OrderGpt from "../components/OrderGpt/OrderGpt";
import OrderGptSlides from "../components/OrderGpt/OrderGptSlides";

export default function Home() {
  const [showSlides, setShowSlides] = useState(true);

  return (
    <main className="flex h-full min-h-screen flex-col items-center justify-between">
      {!showSlides && <OrderGpt />}
      {showSlides && <OrderGptSlides />}
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={showSlides} onChange={() => setShowSlides(!showSlides)} />
        <p>Use Slides</p>
      </div>
    </main>
  )
}
