import React, { useMemo, useState, useEffect } from "react";

// Cute Notes → Study Modes
// Single-file React component using TailwindCSS
// Modes: Flashcards, Multiple Choice (MCQ), Written Answers
// Features: localStorage autosave, question count control, shuffle, export, flip cards

export default function CuteStudyGenerator() {
  // ---------- Theme & UI State ----------
  const [mode, setMode] = useState("flashcards");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState(1);
  const [accent, setAccent] = useState("lilac"); // lilac | sky | mint | navy
  const [font, setFont] = useState("quicksand"); // quicksand | poppins | comic
  const [dense, setDense] = useState(false);

  // ---------- Fonts (Google) ----------
  const FontLinks = () => (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {font === "quicksand" && (
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
      )}
      {font === "poppins" && (
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      )}
      {font === "comic" && (
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap" rel="stylesheet" />
      )}
    </>
  );

  // ---------- Persistence ----------
  useEffect(() => {
    const saved = localStorage.getItem("cute-study-notes");
    const savedMode = localStorage.getItem("cute-study-mode");
    const savedAccent = localStorage.getItem("cute-study-accent");
    const savedFont = localStorage.getItem("cute-study-font");
    const savedCount = localStorage.getItem("cute-study-count");
    const savedDense = localStorage.getItem("cute-study-dense");
    if (saved) setNotes(saved);
    if (savedMode) setMode(savedMode);
    if (savedAccent) setAccent(savedAccent);
    if (savedFont) setFont(savedFont);
    if (savedCount) setCount(Number(savedCount));
    if (savedDense) setDense(savedDense === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("cute-study-notes", notes);
  }, [notes]);
  useEffect(() => {
    localStorage.setItem("cute-study-mode", mode);
  }, [mode]);
  useEffect(() => {
    localStorage.setItem("cute-study-accent", accent);
  }, [accent]);
  useEffect(() => {
    localStorage.setItem("cute-study-font", font);
  }, [font]);
  useEffect(() => {
    localStorage.setItem("cute-study-count", String(count));
  }, [count]);
  useEffect(() => {
    localStorage.setItem("cute-study-dense", String(dense));
  }, [dense]);

  // ---------- Utilities ----------
  const stopwords = new Set(
    "a an and are as at be by for from has he in is it its of on that the to was were will with we you your their our they them this those these which who whom whose than then so if or nor not into onto above below between because before after over under again further do does did doing up down out off just now only own same too very can cannot could should would may might must been being am i me my mine yourself himself herself itself ourselves yourselves themselves about against during without within each both few more most other some such no also via per vs versus etc e.g eg i.e ie let's let’s ‘s ‘re don't didn't won't can't isn't aren't wasn't weren't shouldn't couldn't wouldn't i've i'll i'd you're you'll you'd we're we'll we'd they're they'll they'd".split(/
|\s+/)
  );

  function randFrom<T>(arr: T[], prng: () => number) {
    if (!arr.length) return undefined as any;
    return arr[Math.floor(prng() * arr.length)];
  }

  function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function tokenize(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\-\s']/gi, " ")
      .split(/\s+/)
      .filter((w) => w && !stopwords.has(w) && w.length > 2);
  }

  function splitSentences(text: string) {
    return text
      .replace(/\n+/g, " ")
      .split(/(?<=[\.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function unique<T>(arr: T[]) {
    return Array.from(new Set(arr));
  }

  function extractKeywords(text: string, max = 50) {
    const words = tokenize(text);
    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const scored = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([term]) => term);
    return scored;
  }

  // ---------- Generation ----------
  type Flashcard = { id: string; front: string; back: string };
  type MCQ = { id: string; stem: string; correct: string; choices: string[] };
  type Written = { id: string; prompt: string; answer: string };

  const generator = useMemo(() => mulberry32(seed), [seed]);

  function makeFlashcards(text: string, n: number): Flashcard[] {
    const sentences = splitSentences(text);
    const kws = extractKeywords(text, 80);
    const cards: Flashcard[] = [];

    for (const s of sentences) {
      const candidates = kws.filter((k) => new RegExp(`\\b${k}\\b`, "i").test(s));
      const term = candidates[0] || randFrom(kws, generator);
      if (!term) continue;
      const front = term
        .split(" ")
        .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
        .join(" ");
      const back = s;
      cards.push({ id: crypto.randomUUID(), front, back });
    }

    // If not enough sentences, synthesize from keywords
    while (cards.length < n && kws.length) {
      const term = kws[cards.length % kws.length];
      cards.push({
        id: crypto.randomUUID(),
        front: term,
        back: `Explain the concept of “${term}” in your own words based on your notes.`,
      });
    }

    // shuffle & trim
    return unique(cards).sort(() => generator() - 0.5).slice(0, n);
  }

  function makeCloze(text: string) {
    const sentences = splitSentences(text);
    for (const s of sentences.sort(() => generator() - 0.5)) {
      const words = tokenize(s);
      const pick = words.find((w) => w.length > 3);
      if (pick) {
        const re = new RegExp(`\\b${pick}\\b`, "i");
        const stem = s.replace(re, "_____");
        return { stem, answer: pick };
      }
    }
    return { stem: "(Add more detailed notes to generate cloze questions)", answer: "" };
  }

  function makeMCQ(text: string, n: number): MCQ[] {
    const kws = extractKeywords(text, 60);
    const sents = splitSentences(text);
    const out: MCQ[] = [];

    for (const s of sents) {
      const words = tokenize(s);
      const key = words.find((w) => kws.includes(w) && w.length > 3);
      if (!key) continue;
      const stem = s.replace(new RegExp(`\\b${key}\\b`, "i"), "_____");
      // distractors from other keywords
      const distractors = unique(
        kws.filter((k) => k !== key).sort(() => generator() - 0.5).slice(0, 3)
      );
      const choices = unique([key, ...distractors]).sort(() => generator() - 0.5);
      out.push({ id: crypto.randomUUID(), stem, correct: key, choices });
      if (out.length >= n) break;
    }

    // Fallback: fabricate from keywords
    while (out.length < n && kws.length >= 4) {
      const key = kws[out.length % kws.length];
      const others = unique(
        kws.filter((k) => k !== key).sort(() => generator() - 0.5).slice(0, 3)
      );
      out.push({
        id: crypto.randomUUID(),
        stem: `Which term best completes the idea related to “${key}”?`,
        correct: key,
        choices: unique([key, ...others]).sort(() => generator() - 0.5),
      });
    }

    return out;
  }

  function makeWritten(text: string, n: number): Written[] {
    const items: Written[] = [];
    const sents = splitSentences(text);
    for (const s of sents) {
      const { stem, answer } = makeCloze(s);
      if (!stem) continue;
      items.push({ id: crypto.randomUUID(), prompt: stem, answer });
      if (items.length >= n) break;
    }
    while (items.length < n) {
      const kw = extractKeywords(text, 100)[items.length] || `concept ${items.length + 1}`;
      items.push({
        id: crypto.randomUUID(),
        prompt: `Write a short explanation for: ${kw}`,
        answer: kw,
      });
    }
    return items;
  }

  const preview = useMemo(() => {
    const trimmed = notes.trim();
    if (!trimmed) return { flash: [], mcq: [], written: [] };
    return {
      flash: makeFlashcards(trimmed, count),
      mcq: makeMCQ(trimmed, count),
      written: makeWritten(trimmed, count),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, count, seed]);

  // ---------- Export ----------
  function exportJSON() {
    const data = {
      mode,
      notes,
      generatedAt: new Date().toISOString(),
      flashcards: preview.flash,
      mcq: preview.mcq,
      written: preview.written,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cute-study-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadSample() {
    const sample = `Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose. Chlorophyll in the chloroplasts absorbs light, primarily in the blue and red wavelengths. The light-dependent reactions generate ATP and NADPH. The Calvin cycle uses ATP and NADPH to fix carbon dioxide into glucose. Stomata regulate gas exchange. Factors affecting photosynthesis include light intensity, carbon dioxide concentration, and temperature.`;
    setNotes(sample);
    setSeed(Math.floor(Math.random() * 999999));
  }

  // ---------- Cute styling helpers ----------
  const accentMap: Record<string, string> = {
    lilac: "from-violet-300/70 to-fuchsia-200/70",
    sky: "from-sky-200/70 to-indigo-200/70",
    mint: "from-emerald-200/70 to-teal-200/70",
    navy: "from-slate-800/80 to-indigo-900/80",
  };

  const glowMap: Record<string, string> = {
    lilac: "shadow-[0_0_45px_rgba(168,85,247,0.35)]",
    sky: "shadow-[0_0_45px_rgba(14,165,233,0.35)]",
    mint: "shadow-[0_0_45px_rgba(16,185,129,0.35)]",
    navy: "shadow-[0_0_45px_rgba(30,41,59,0.45)]",
  };

  const fontClass = font === "quicksand" ? "font-[Quicksand]" : font === "poppins" ? "font-[Poppins]" : "font-[Fredoka]";

  // ---------- Components ----------
  const Header = () => (
    <div className={`relative isolate overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br ${accentMap[accent]} backdrop-blur-xl border border-white/40 ${glowMap[accent]}`}>
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
      <h1 className={`text-3xl sm:text-4xl lg:text-5xl ${fontClass} font-extrabold tracking-tight text-slate-900 drop-shadow`}>Cute Study Builder</h1>
      <p className="mt-2 text-slate-700/90">Paste your notes → generate Flashcards, MCQs, or Written prompts. Everything runs in your browser ✨</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["flashcards", "mcq", "written"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-2xl border text-sm backdrop-blur bg-white/60 hover:bg-white ${mode === m ? "border-slate-900/70" : "border-white/40"}`}
            aria-pressed={mode === m}
          >
            {m === "flashcards" && "Flashcards"}
            {m === "mcq" && "Multiple Choice"}
            {m === "written" && "Written"}
          </button>
        ))}
      </div>
    </div>
  );

  const Controls = () => (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="rounded-2xl p-4 bg-white/70 border border-white/60 backdrop-blur">
        <label className="block text-sm font-semibold text-slate-700">Your notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={"Paste or type your notes here…"}
          className={`mt-2 w-full ${dense ? "h-40" : "h-64"} rounded-xl border border-slate-300/60 p-3 focus:outline-none focus:ring-2 focus:ring-slate-800/20 bg-white/60`}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={loadSample} className="px-3 py-2 rounded-xl border bg-white/70 hover:bg-white">Load sample</button>
          <button onClick={() => setNotes("")} className="px-3 py-2 rounded-xl border bg-white/70 hover:bg-white">Clear</button>
          <button onClick={() => setSeed((s) => s + 1)} className="px-3 py-2 rounded-xl border bg-white/70 hover:bg-white">Reshuffle</button>
          <button onClick={exportJSON} className="px-3 py-2 rounded-xl border bg-white/70 hover:bg-white">Export JSON</button>
        </div>
      </div>

      <div className="rounded-2xl p-4 bg-white/70 border border-white/60 backdrop-blur grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Items</label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="mt-2 w-full rounded-xl border border-slate-300/60 p-2 bg-white/60"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300/60 p-2 bg-white/60">
              <option value="flashcards">Flashcards</option>
              <option value="mcq">Multiple Choice</option>
              <option value="written">Written</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Accent</label>
            <select value={accent} onChange={(e) => setAccent(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300/60 p-2 bg-white/60">
              <option value="lilac">Navy–Lilac Glass</option>
              <option value="sky">Sky Blue & Lilac</option>
              <option value="mint">Mint Green</option>
              <option value="navy">Deep Navy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Font</label>
            <select value={font} onChange={(e) => setFont(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300/60 p-2 bg-white/60">
              <option value="quicksand">Cute & Playful</option>
              <option value="poppins">Clean & Modern</option>
              <option value="comic">Round & Friendly</option>
            </select>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} />
          Compact editor height
        </label>
      </div>

      <Tips />
    </div>
  );

  function Tips() {
    return (
      <div className="rounded-2xl p-4 bg-white/70 border border-white/60 backdrop-blur">
        <div className="text-sm text-slate-700 grid gap-2">
          <p className="font-semibold">Better results tips 💡</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use complete sentences—each sentence can become a question.</li>
            <li>Bold key terms with <code>**double asterisks**</code> (optional).</li>
            <li>Keep sections separated by blank lines.</li>
            <li>Click <em>Reshuffle</em> to vary keywords and distractors.</li>
          </ul>
        </div>
      </div>
    );
  }

  const RenderArea = () => (
    <div className="rounded-3xl border border-white/50 bg-white/70 backdrop-blur p-4 sm:p-6">
      {mode === "flashcards" && <Flashcards items={preview.flash} accent={accent} fontClass={fontClass} />}
      {mode === "mcq" && <MCQList items={preview.mcq} accent={accent} />}
      {mode === "written" && <WrittenList items={preview.written} accent={accent} />}
    </div>
  );

  return (
    <div className={`min-h-screen ${fontClass} bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900`}> 
      <FontLinks />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Header />

        <div className="mt-6 grid gap-6">
          <Controls />
          <RenderArea />
        </div>

        <footer className="mt-10 text-center text-xs text-slate-600/80">
          <p>
            ✨ All processing is local. Export your set as JSON and import anywhere. Made with love.
          </p>
        </footer>
      </div>
    </div>
  );
}

// ---------- Flashcards ----------
function Flashcards({ items, accent, fontClass }: { items: { id: string; front: string; back: string }[]; accent: string; fontClass: string; }) {
  if (!items.length) return <EmptyState />;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Flashcards ({items.length})</h2>
        <p className="text-xs text-slate-600">Click a card to flip</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <FlipCard key={c.id} front={c.front} back={c.back} accent={accent} fontClass={fontClass} />)
        )}
      </div>
    </div>
  );
}

function FlipCard({ front, back, accent, fontClass }: { front: string; back: string; accent: string; fontClass: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button onClick={() => setFlipped((f) => !f)} className={`[perspective:1000px] w-full h-44 sm:h-48`}> 
      <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
        {[{txt: front, side: "front"}, {txt: back, side: "back"}].map(({txt, side}) => (
          <div key={side} className={`absolute inset-0 rounded-2xl border bg-gradient-to-br ${accent === "navy" ? "from-slate-800 to-indigo-900 text-white" : "from-white to-white/80 text-slate-900"} ${accent === "navy" ? "border-white/20" : "border-slate-200"} p-4 shadow hover:shadow-lg transition-shadow [backface-visibility:hidden] ${side === "back" ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className={`absolute inset-0 rounded-2xl opacity-60 blur-2xl pointer-events-none ${accent === "lilac" && "bg-gradient-to-br from-fuchsia-200/40 to-violet-200/40"} ${accent === "sky" && "bg-gradient-to-br from-sky-200/40 to-indigo-200/40"} ${accent === "mint" && "bg-gradient-to-br from-emerald-200/40 to-teal-200/40"} ${accent === "navy" && "bg-white/10"}`} />
            <div className="relative h-full flex items-center justify-center text-center">
              <p className={`${fontClass} text-base sm:text-lg font-semibold leading-snug`}>{txt}</p>
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}

// ---------- MCQ ----------
function MCQList({ items, accent }: { items: { id: string; stem: string; correct: string; choices: string[] }[]; accent: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (!items.length) return <EmptyState />;

  function select(id: string, choice: string) {
    setAnswers((a) => ({ ...a, [id]: choice }));
  }
  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Multiple Choice ({items.length})</h2>
        <p className="text-xs text-slate-600">Pick one per question</p>
      </div>
      {items.map((q, idx) => {
        const picked = answers[q.id];
        const correct = picked && picked === q.correct;
        return (
          <div key={q.id} className={`rounded-2xl border p-4 ${picked ? (correct ? "border-emerald-400 bg-emerald-50" : "border-rose-300 bg-rose-50") : "border-slate-200 bg-white/80"}`}>
            <p className="font-semibold">{idx + 1}. {q.stem}</p>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {q.choices.map((c) => (
                <button
                  key={c}
                  onClick={() => select(q.id, c)}
                  className={`text-left px-3 py-2 rounded-xl border bg-white hover:bg-white/90 ${picked === c ? "ring-2 ring-slate-800/20" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>
            {picked && (
              <p className={`mt-2 text-sm ${correct ? "text-emerald-700" : "text-rose-700"}`}>
                {correct ? "Nice!" : `Answer: ${q.correct}`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Written ----------
function WrittenList({ items }: { items: { id: string; prompt: string; answer: string }[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  if (!items.length) return <EmptyState />;
  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Written Practice ({items.length})</h2>
        <p className="text-xs text-slate-600">Type your answer and reveal</p>
      </div>
      {items.map((w, i) => (
        <div key={w.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="font-semibold">{i + 1}. {w.prompt}</p>
          <textarea
            value={responses[w.id] || ""}
            onChange={(e) => setResponses((r) => ({ ...r, [w.id]: e.target.value }))}
            placeholder="Write your answer…"
            className="mt-2 w-full rounded-xl border border-slate-300/60 p-2 bg-white/60 h-24"
          />
          <button onClick={() => setRevealed((r) => ({ ...r, [w.id]: !r[w.id] }))} className="mt-2 px-3 py-2 rounded-xl border bg-white hover:bg-white/90">{revealed[w.id] ? "Hide" : "Reveal"} answer</button>
          {revealed[w.id] && (
            <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Answer:</span> {w.answer || "(varies)"}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-slate-600">Paste notes on the left and set your mode to generate study material ✨</p>
    </div>
  );
}
