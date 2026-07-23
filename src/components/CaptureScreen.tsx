import React, { useState, useRef } from "react";
import { Mic, MicOff, Sparkles, Send, Lightbulb, AlertCircle, Loader2 } from "lucide-react";
import { Task } from "../types";

interface CaptureScreenProps {
  onTasksParsed: (newTasks: Task[]) => void;
  onNavigateToInbox: () => void;
  onNavigateToToday?: () => void;
  onNavigateToWeek?: () => void;
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({
  onTasksParsed,
  onNavigateToInbox,
  onNavigateToToday,
  onNavigateToWeek,
}) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const initialTextRef = useRef<string>("");

  // Web Speech API Voice Recognition
  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Ваш браузер не підтримує розпізнавання голосу. Ви можете ввести текст клавіатурою.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "uk-UA";
      recognition.continuous = true;
      recognition.interimResults = true;

      initialTextRef.current = text.trim();

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        setStatusMessage("Слухаю вашу мову...");
      };

      recognition.onresult = (e: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < e.results.length; i++) {
          const transcriptChunk = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += transcriptChunk + " ";
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        const sessionText = (finalTranscript + interimTranscript).replace(/\s+/g, " ").trim();
        const base = initialTextRef.current;
        const fullText = base ? `${base} ${sessionText}` : sessionText;

        setText(fullText);
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        setStatusMessage(null);
        if (e.error === "not-allowed") {
          setErrorMessage("Немає доступу до мікрофона. Надайте дозвіл у налаштуваннях браузера.");
        } else if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Speech recognition notice:", e.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setStatusMessage(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech init error:", err);
      setIsListening(false);
    }
  };

  const handleProcessAI = async () => {
    if (!text.trim()) {
      setErrorMessage("Введіть думки або продиктуйте їх голосом перед обробкою!");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage("AI парсить та структурує ваші задачі...");

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Помилка при з’єднанні з AI сервером");
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        onTasksParsed(data.tasks);
        setText("");

        setStatusMessage(`✨ ${data.tasks.length} задач(-і) оброблено та збережено у 'Завдання'!`);
        setTimeout(() => {
          onNavigateToInbox();
        }, 800);
      } else {
        throw new Error("Не вдалося сформувати задачі з тексту.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Сталася помилка обробки AI. Перевірте мережу.");
    } finally {
      setIsProcessing(false);
    }
  };

  const samplePrompts = [
    "Завтра о 10 зустріч з командою, розібрати пошту, терміново оплатити рахунки та купити каву",
    "Підготувати презентацію для клієнта на 15:00, зателефонувати мамі, тренування ввечері о 19:30",
    "Купити молоко, хліб і фрукти, вивчити 20 нових слів з англійської, підготувати звіт до кінця дня"
  ];

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Потік справ</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
          Що вам треба зробити сьогодні чи в найближчі дні?
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Покажіть нам, що таке справжній потік думок! Диктуйте й пишіть все, що в голові, а AI зловить все важливе та організує ваш розклад.
        </p>
      </div>

      {/* Main Textarea & Voice Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm relative">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-base leading-relaxed resize-y"
            placeholder="Опишіть ваші плани голосом чи текстом (наприклад: 'Завтра о 11 зустріч з дизайнером, купити подарунок, терміново надіслати кошторис')..."
          />

          {isListening && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs px-3 py-1.5 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Запис голосу...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={toggleVoice}
            className={`sm:w-1/3 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border transition-all ${
              isListening
                ? "bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/30"
                : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 text-red-400" />
                <span>Зупинити голос</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-indigo-400" />
                <span>Надиктувати</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleProcessAI}
            disabled={isProcessing || !text.trim()}
            className="sm:w-2/3 py-3 px-5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Обробити через AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Обробити через AI &rarr;</span>
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        {statusMessage && (
          <div className="p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Example Prompt Chips */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Швидкі шаблони для випробування:</span>
        </div>
        <div className="space-y-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setText(prompt)}
              className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-300 flex items-start justify-between group"
            >
              <span>"{prompt}"</span>
              <Send className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 ml-2 mt-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
