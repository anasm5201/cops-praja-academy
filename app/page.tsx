'use client';

import { useEffect, useState } from 'react';
import { Loader2, Timer, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface Question {
  id: number;
  category: string;
  question_text: string;
  options: any;
  correct_answer: string;
  discussion: string;
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60); 
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/questions?select=*&limit=100`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Gagal koneksi: ${response.status}`);
        }

        const data = await response.json();
        setQuestions(data);
      } catch (error: any) {
        console.error('Error:', error);
        setErrorMsg(error.message || 'Terjadi kesalahan jaringan');
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
          <p className="font-semibold">Menghubungkan ke Server...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-slate-600 mb-4">
            {errorMsg ? `Error: ${errorMsg}` : 'Belum ada soal di database Supabase.'}
          </p>
          <div className="bg-gray-100 p-3 rounded text-xs text-left mb-4">
            <p className="font-bold">Tips Perbaikan:</p>
            <ul className="list-disc pl-4">
              <li>Pastikan URL di .env.local berakhiran .supabase.co</li>
              <li>Pastikan Tabel questions sudah diisi data</li>
              <li>Pastikan RLS (Security) di Supabase sudah DISABLE</li>
            </ul>
          </div>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-900">
            Coba Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  let optionsObj: Record<string, string> = {};
  if (typeof currentQ.options === 'string') {
     try { optionsObj = JSON.parse(currentQ.options); } catch(e) { optionsObj = {}; }
  } else {
     optionsObj = currentQ.options || {};
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-50 bg-[#1e3a8a] text-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="font-bold text-lg text-[#fbbf24] tracking-wide">COPS PRAJA</div>
          <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded-full border border-blue-700">
            <Timer className="w-4 h-4 text-[#fbbf24]" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="w-full bg-blue-900 h-1.5">
          <div className="bg-[#fbbf24] h-1.5 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24">
        <div className="flex justify-between items-center mb-4 text-sm text-slate-500 font-medium">
          <span>Soal {currentIndex + 1} / {questions.length}</span>
          <span className="uppercase bg-slate-200 px-2 py-0.5 rounded text-xs text-slate-700 font-bold">{currentQ.category}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <p className="text-lg font-medium text-slate-800 leading-relaxed">{currentQ.question_text}</p>
        </div>

        <div className="space-y-3">
          {Object.entries(optionsObj).map(([key, value]) => {
            const isSelected = answers[currentQ.id] === key;
            return (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                disabled={isFinished}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 active:scale-95 duration-200 ${isSelected ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 ${isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-500'}`}>{key}</div>
                <span className="text-base">{value}</span>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-md mx-auto flex justify-between gap-4">
          <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 border border-transparent hover:bg-slate-50 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Prev
          </button>
          {currentIndex === questions.length - 1 ? (
            <button onClick={finishExam} className="flex-1 py-3 px-4 rounded-xl font-bold bg-[#fbbf24] text-[#1e3a8a] shadow-lg shadow-orange-100 active:scale-95 transition-transform flex justify-center items-center gap-2">
              Selesai <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} className="flex-1 py-3 px-4 rounded-xl font-bold bg-[#1e3a8a] text-white shadow-lg shadow-blue-100 active:scale-95 transition-transform flex justify-center items-center gap-2">
              Next <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>

      {isFinished && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ujian Selesai!</h2>
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <span className="block text-sm font-medium text-slate-400 uppercase mb-1 tracking-wider">Total Skor</span>
              <span className="text-5xl font-black text-[#1e3a8a]">{score}</span>
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-4 rounded-xl font-bold bg-[#1e3a8a] text-white shadow-xl shadow-blue-200 hover:bg-blue-900 transition-all active:scale-95">
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
