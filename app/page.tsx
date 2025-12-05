'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, Timer, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

// --- BAGIAN 1: KONEKSI DATABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- BAGIAN 2: TIPE DATA ---
interface Question {
  id: number;
  category: string;
  question_text: string;
  options: any;
  correct_answer: string;
  discussion: string;
}

// --- BAGIAN 3: APLIKASI ---
export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60); 
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .limit(100);

        if (error) throw error;
        if (data) setQuestions(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionKey: string) => {
    if (isFinished) return;
    const currentQ = questions[currentIndex];
    setAnswers({ ...answers, [currentQ.id]: optionKey });
  };

  const finishExam = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });
    setScore(correctCount * 5);
    setIsFinished(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-[#1e3a8a]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2" />
          <p className="font-semibold">Menyiapkan Soal...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <div>
          <h2 className="text-xl font-bold text-red-600">Data Masih Kosong</h2>
          <p>Cek tabel Supabase Anda (pastikan RLS sudah mati).</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  let optionsObj: Record<string, string> = {};
  if (typeof currentQ.options === 'string') {
     try { optionsObj = JSON.parse(currentQ.options); } catch(e) {}
  } else {
     optionsObj = currentQ.options || {};
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-50 bg-[#1e3a8a] text-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="font-bold text-lg text-[#fbbf24]">COPS PRAJA</div>
          <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded-full border border-blue-700">
            <Timer className="w-4 h-4 text-[#fbbf24]" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="w-full bg-blue-900 h-1.5">
          <div 
            className="bg-[#fbbf24] h-1.5 transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24">
        <div className="flex justify-between items-center mb-4 text-sm text-slate-500 font-medium">
          <span>Soal {currentIndex + 1} / {questions.length}</span>
          <span className="uppercase bg-slate-200 px-2 py-0.5 rounded text-xs">{currentQ.category}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <p className="text-lg font-medium text-slate-800">{currentQ.question_text}</p>
        </div>

        <div className="space-y-3">
          {Object.entries(optionsObj).map(([key, value]) => {
            const isSelected = answers[currentQ.id] === key;
            return (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                disabled={isFinished}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3
                  ${isSelected 
                    ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]' 
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'}
                `}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5
                  ${isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-500'}
                `}>{key}</div>
                <span className="text-base">{value}</span>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-md mx-auto flex justify-between gap-4">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 border border-transparent hover:bg-slate-50 flex justify-center items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Prev
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={finishExam}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-[#fbbf24] text-[#1e3a8a] shadow-lg flex justify-center items-center gap-2"
            >
              Selesai <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-[#1e3a8a] text-white shadow-lg flex justify-center items-center gap-2"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>

      {isFinished && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ujian Selesai!</h2>
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <span className="block text-sm font-medium text-slate-400 uppercase mb-1">Total Skor</span>
              <span className="text-5xl font-black text-[#1e3a8a]">{score}</span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-xl font-bold bg-[#1e3a8a] text-white shadow-xl hover:bg-blue-900"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}