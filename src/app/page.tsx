'use client';

import { useState } from 'react';
import { generateStudyPlan } from '@/lib/planGenerator';
import { StudyPlan } from '@/lib/types';

export default function Home() {
  const [testDate, setTestDate] = useState('');
  const [currentScore, setCurrentScore] = useState<number | ''>('');
  const [targetScore, setTargetScore] = useState<number | ''>('');
  const [tutoringPerWeek, setTutoringPerWeek] = useState<1 | 2 | 3 | 4>(2);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState('');

  const handleGeneratePlan = () => {
    setError('');
    
    // Validation
    if (!testDate) {
      setError('Please select your SAT test date');
      return;
    }
    
    const testDateObj = new Date(testDate);
    if (testDateObj <= new Date()) {
      setError('Test date must be in the future');
      return;
    }
    
    if (!currentScore || currentScore < 400 || currentScore > 1600) {
      setError('Current score must be between 400 and 1600');
      return;
    }
    
    if (!targetScore || targetScore < 400 || targetScore > 1600) {
      setError('Target score must be between 400 and 1600');
      return;
    }
    
    if (targetScore <= currentScore) {
      setError('Target score should be higher than your current score');
      return;
    }
    
    const generatedPlan = generateStudyPlan({
      testDate: testDateObj,
      currentScore,
      targetScore,
      tutoringSessionsPerWeek: tutoringPerWeek,
    });
    
    setPlan(generatedPlan);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'small': return 'text-green-400';
      case 'moderate': return 'text-emerald-400';
      case 'significant': return 'text-yellow-400';
      case 'large': return 'text-orange-400';
      case 'very_large': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPlanTypeBadge = (planType: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      cram: { label: 'Cram Plan', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      short: { label: 'Short Plan', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      standard: { label: 'Standard Plan', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      extended: { label: 'Extended Plan', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      long_term: { label: 'Long-Term Plan', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    };
    return badges[planType] || badges.standard;
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">SAT Study Plan Generator</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Create a personalized, research-backed study plan based on your timeline, 
            current score, and target score.
          </p>
        </div>

        {/* Input Form */}
        <div className="card p-8 mb-12 glow-primary animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              📝
            </span>
            Your Information
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Test Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                When are you taking the SAT?
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Current Score */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Score (400-1600)
              </label>
              <input
                type="number"
                value={currentScore}
                onChange={(e) => setCurrentScore(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="e.g., 1100"
                min={400}
                max={1600}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">From practice test or official score</p>
            </div>
            
            {/* Target Score */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Score (400-1600)
              </label>
              <input
                type="number"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="e.g., 1400"
                min={400}
                max={1600}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Your goal score</p>
            </div>
            
            {/* Tutoring Sessions */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tutoring Sessions / Week
              </label>
              <select
                value={tutoringPerWeek}
                onChange={(e) => setTutoringPerWeek(parseInt(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full bg-[#141419] border border-[#2a2a35] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1x per week</option>
                <option value={2}>2x per week</option>
                <option value={3}>3x per week</option>
                <option value={4}>4x per week</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">With your SAT tutor</p>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGeneratePlan}
            className="mt-6 w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all transform hover:scale-105 focus:ring-4 focus:ring-indigo-500/30"
          >
            Generate My Study Plan →
          </button>
        </div>

        {/* Generated Plan */}
        {plan && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Plan Overview */}
            <div className="card p-8 glow-secondary">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Your Personalized Plan</h2>
                  <p className="text-gray-400">
                    Created on {formatDate(plan.createdAt)}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getPlanTypeBadge(plan.planType).color}`}>
                  {getPlanTypeBadge(plan.planType).label}
                </span>
              </div>
              
              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">Duration</p>
                  <p className="text-2xl font-bold text-white">{plan.totalWeeks} <span className="text-sm text-gray-400">weeks</span></p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">Score Gap</p>
                  <p className="text-2xl font-bold">
                    <span className={getDifficultyColor(plan.scoreGap.difficulty)}>
                      +{plan.scoreGap.totalGap}
                    </span>
                  </p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">Projected</p>
                  <p className="text-2xl font-bold text-green-400">{plan.projectedScore}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">Self-Study</p>
                  <p className="text-2xl font-bold text-purple-400">{plan.weeklyHoursRecommended}<span className="text-sm text-gray-400"> hrs/wk</span></p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-indigo-500/30 bg-indigo-500/5">
                  <p className="text-sm text-indigo-300 mb-1">Tutoring</p>
                  <p className="text-2xl font-bold text-indigo-400">{plan.tutoring.sessionsPerWeek}x<span className="text-sm text-gray-400"> /week</span></p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">Total Time</p>
                  <p className="text-2xl font-bold text-white">{(plan.weeklyHoursRecommended + plan.tutoring.hoursPerWeek).toFixed(1)}<span className="text-sm text-gray-400"> hrs/wk</span></p>
                </div>
              </div>
              
              {/* Tutoring Summary */}
              <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">👨‍🏫</span>
                  <h3 className="text-lg font-medium text-white">Your Tutoring Plan</h3>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Sessions per Week</p>
                    <p className="text-xl font-semibold text-indigo-300">{plan.tutoring.sessionsPerWeek}x / week</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Sessions</p>
                    <p className="text-xl font-semibold text-white">{plan.tutoring.totalSessions} sessions</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Hours with Tutor</p>
                    <p className="text-xl font-semibold text-white">{plan.tutoring.hoursPerWeek} hrs/week</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Progress Boost</p>
                    <p className="text-xl font-semibold text-green-400">+{Math.round((plan.tutoring.multiplierApplied - 1) * 100)}%</p>
                  </div>
                </div>
              </div>
              
              {/* Score Journey */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Your Score Journey</h3>
                <div className="relative h-4 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, ((plan.projectedScore - plan.startingScore) / (plan.targetScore - plan.startingScore)) * 100)}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-400">Current: <span className="text-white font-medium">{plan.startingScore}</span></span>
                  <span className="text-purple-400">Projected: <span className="font-medium">{plan.projectedScore}</span></span>
                  <span className="text-gray-400">Target: <span className="text-green-400 font-medium">{plan.targetScore}</span></span>
                </div>
              </div>
              
              {/* Feasibility */}
              <div className={`p-4 rounded-xl border ${plan.feasibility.isFeasible ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{plan.feasibility.isFeasible ? '✅' : '⚠️'}</span>
                  <div>
                    <p className={`font-medium ${plan.feasibility.isFeasible ? 'text-green-400' : 'text-amber-400'}`}>
                      {plan.feasibility.isFeasible 
                        ? `Goal is achievable! (${plan.feasibility.confidence}% confidence)`
                        : `Goal is challenging with current timeline`}
                    </p>
                    <p className="text-sm text-gray-400">
                      Expected improvement: +{Math.round(plan.feasibility.projectedImprovement)} points
                      {plan.feasibility.shortfall && ` (${plan.feasibility.shortfall} points short of target)`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Recommendations */}
              {plan.feasibility.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">💡 Recommendations</h3>
                  <div className="space-y-2">
                    {plan.feasibility.recommendations.map((rec, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5"
                      >
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="text-gray-300">{rec.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Phases */}
            <div className="card p-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                  📅
                </span>
                Study Phases
              </h2>
              
              <div className="space-y-6">
                {plan.phases.map((phase, idx) => (
                  <div key={idx} className="phase-line relative pl-10">
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="bg-black/30 rounded-xl p-5 border border-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-white">{phase.name}</h3>
                        <span className="text-sm text-gray-400">
                          Weeks {phase.startWeek}–{phase.endWeek} • {phase.weeklyHours} hrs/week
                        </span>
                      </div>
                      <p className="text-gray-400 mb-4">{phase.focus}</p>
                      <div className="flex flex-wrap gap-2">
                        {phase.objectives.map((obj, objIdx) => (
                          <span 
                            key={objIdx}
                            className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-300"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                      
                      {/* Content Distribution Bar */}
                      <div className="mt-4">
                        <div className="flex h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500" 
                            style={{ width: `${phase.contentDistribution.learning}%` }}
                            title="Learning"
                          />
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${phase.contentDistribution.practice}%` }}
                            title="Practice"
                          />
                          <div 
                            className="bg-purple-500" 
                            style={{ width: `${phase.contentDistribution.testing}%` }}
                            title="Testing"
                          />
                          <div 
                            className="bg-amber-500" 
                            style={{ width: `${phase.contentDistribution.review}%` }}
                            title="Review"
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>📚 Learning {phase.contentDistribution.learning}%</span>
                          <span>✏️ Practice {phase.contentDistribution.practice}%</span>
                          <span>📝 Testing {phase.contentDistribution.testing}%</span>
                          <span>🔄 Review {phase.contentDistribution.review}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Breakdown */}
            <div className="card p-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                  📋
                </span>
                Weekly Breakdown
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plan.weeklyPlans.map((week) => (
                  <div 
                    key={week.weekNumber}
                    className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Week {week.weekNumber}</h4>
                      <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded">
                        {week.phase}
                      </span>
                    </div>
                    
                    {/* Tutoring Sessions */}
                    <div className="mb-3 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <p className="text-xs font-medium text-indigo-300 mb-1">
                        👨‍🏫 {week.tutoringSessions.length} Tutoring Session{week.tutoringSessions.length > 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {week.tutoringSessions[0]?.suggestedTopics.slice(0, 2).map((topic, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-200 rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {week.focus.slice(0, 2).map((f, idx) => (
                        <p key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          {f}
                        </p>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/5">
                      <span>📚 {week.targetHours} hrs self-study</span>
                      <span>⏱️ {week.totalHoursWithTutoring.toFixed(1)} hrs total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Day Reminder */}
            <div className="card p-8 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/30">
              <div className="text-center">
                <p className="text-gray-400 mb-2">Your SAT Test Day</p>
                <p className="text-3xl font-bold gradient-text">{formatDate(plan.testDate)}</p>
                <p className="text-gray-400 mt-4">
                  You've got this! Follow your plan consistently and you'll be well-prepared. 🎯
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
