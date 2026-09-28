import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { JournalForm } from "../components/JournalForm";
import { JournalList } from "../components/JournalList";
import type { Emotion } from "../domain";

export function Journal() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") ?? undefined;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [emotion, setEmotion] = useState<Emotion | "">("");

  return (
    <div
      className="min-h-full px-4 py-6 sm:px-8 sm:py-8"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Registro emocional</h1>
        <JournalForm initialDate={initialDate} />
        <JournalList
          from={from}
          to={to}
          emotion={emotion}
          onFromChange={setFrom}
          onToChange={setTo}
          onEmotionChange={setEmotion}
        />
      </div>
    </div>
  );
}
