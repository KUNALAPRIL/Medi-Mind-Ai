import React, { useState } from 'react';
import api from '../utils/api';
import { Activity, ShieldAlert, Heart, User, Clipboard, ArrowRight, Loader2, RefreshCw, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TriageCondition {
  name: string;
  likelihood: string;
  explanation: string;
}

interface TriageResult {
  conditions: TriageCondition[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  specialist: string;
  tests: string[];
  lifestyleAdvice: string[];
  disclaimer: string;
}

export const SymptomChecker: React.FC = () => {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error("Speech Recognition Error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone permission denied. Please click the lock/settings icon in your browser address bar and allow microphone access.");
      } else if (event.error === 'no-speech') {
        alert("No voice detected. Please speak clearly into your microphone.");
      } else {
        alert(`Microphone error: ${event.error}. Please check your hardware or use a supported browser like Google Chrome.`);
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms((prev) => prev ? prev + ' ' + transcript : transcript);
    };

    recognition.start();
  };

  const handleNextStep = () => {
    if (step === 1 && age) {
      setStep(2);
    }
  };

  const handleSubmitTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await api.post('/api/v1/clinical/symptom-check', {
        age: Number(age),
        gender,
        medicalHistory,
        symptoms,
      });
      setResult(response.data.data);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Triage query failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAge('');
    setGender('Male');
    setMedicalHistory('');
    setSymptoms('');
    setResult(null);
    setStep(1);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'LOW':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300';
      case 'HIGH':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
      case 'EMERGENCY':
        return 'bg-rose-600 text-white animate-pulse border-rose-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            AI Symptom Checker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Structured clinical triaging to assess possible conditions and urgency.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {errorMsg && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
            <ShieldAlert size={18} />
            {errorMsg}
          </div>
        )}

        {/* Step 1: Patient Demographics */}
        {step === 1 && (
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="text-blue-500" size={18} />
              Step 1: Patient Demographics
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Patient Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full mt-1.5 px-3 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Biological Sex</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full mt-1.5 px-3 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Existing Medical History</label>
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="List chronic conditions, e.g. Hypertension, Asthma, Penicillin allergy..."
                className="w-full mt-1.5 px-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all h-24"
              />
            </div>

            <button
              onClick={handleNextStep}
              disabled={!age}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              Continue Triage
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Symptom Input */}
        {step === 2 && (
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clipboard className="text-cyan-500" size={18} />
              Step 2: Describe Symptoms
            </h3>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">What symptoms are you experiencing?</label>
              <div className="relative">
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Be descriptive: state duration, severity, and any aggravating elements..."
                  className="w-full px-4 py-3 pr-12 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all h-32 resize-none"
                />
                <button
                  type="button"
                  onClick={startListening}
                  className={`absolute bottom-3 right-3 p-2.5 rounded-xl transition-all active:scale-95 ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-white/40 dark:bg-slate-800/40 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-white/20 dark:border-white/5'
                  }`}
                  title="Speak to type / बोलें"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>

              <div className="flex gap-2 text-xs text-slate-400">
                <span className="font-bold">Examples:</span>
                <span className="cursor-pointer hover:underline text-blue-500" onClick={() => setSymptoms('Persistent wheezing and tight chest for 3 days.')}>Asthma wheezing</span>
                <span>•</span>
                <span className="cursor-pointer hover:underline text-blue-500" onClick={() => setSymptoms('Sudden crushing chest pain radiating to left arm.')}>Chest emergency</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold text-sm transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                onClick={handleSubmitTriage}
                disabled={isLoading || !symptoms.trim()}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Submit Triage'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Triage Analysis Panel */}
        {step === 3 && result && (
          <div className="space-y-6">
            
            {/* Urgency Card */}
            <div className={`p-6 rounded-3xl border flex items-center gap-4 ${getUrgencyColor(result.urgency)}`}>
              <ShieldAlert size={28} />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest block opacity-80">Triage Priority</span>
                <h2 className="text-xl font-black tracking-tight">{result.urgency}</h2>
              </div>
            </div>

            {/* Main results */}
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              
              {/* Considerations list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Possible Considerations</h4>
                <div className="space-y-3">
                  {result.conditions.map((cond, index) => (
                    <div key={index} className="p-4 rounded-2xl border border-white/20 dark:border-white/5 bg-white/30 dark:bg-slate-800/30">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{cond.name}</span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{cond.likelihood}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{cond.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Treatment parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Activity size={12} className="text-blue-500" />
                    Suggested Screening
                  </h4>
                  <ul className="space-y-1.5">
                    {result.tests.map((test, index) => (
                      <li key={index} className="text-xs text-slate-600 dark:text-slate-300 font-semibold">• {test}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Heart size={12} className="text-rose-500" />
                    Recommended Specialist
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold">{result.specialist}</p>
                </div>
              </div>

              {/* Lifestyle advice */}
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Self-Care & Wellness Guidelines</h4>
                <ul className="space-y-1.5">
                  {result.lifestyleAdvice.map((tip, index) => (
                    <li key={index} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">• {tip}</li>
                  ))}
                </ul>
              </div>

              {/* Medical Warning */}
              <div className="p-4 rounded-2xl bg-slate-100/40 dark:bg-slate-800/40 border border-white/10 text-[10px] text-slate-400 leading-relaxed">
                <span className="font-bold block uppercase tracking-wider mb-1">Medical Disclaimer</span>
                {result.disclaimer}
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                Run Another Check
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SymptomChecker;
