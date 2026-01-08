import {
  UserInput,
  Timeline,
  ScoreGap,
  FeasibilityAssessment,
  Recommendation,
  Phase,
  WeeklyPlan,
  StudyPlan,
  PlanType,
  Activity,
  TutoringSession,
} from './types';

// ============================================
// CONSTANTS (from algorithm documentation)
// ============================================

const WEEKLY_IMPROVEMENT_RATES: Record<string, number> = {
  light: 8,           // 2-4 hrs/week
  moderate: 15,       // 5-8 hrs/week
  intensive: 22,      // 9-12 hrs/week
  very_intensive: 30, // 13-20 hrs/week
};

const MAX_IMPROVEMENTS: Record<string, number> = {
  light: 150,
  moderate: 250,
  intensive: 350,
  very_intensive: 450,
};

const WEEKLY_HOURS: Record<string, number> = {
  light: 3,
  moderate: 6.5,
  intensive: 10.5,
  very_intensive: 16.5,
};

// Tutoring multipliers based on sessions per week
// Based on research showing 40% improvement boost with tutoring
const TUTORING_MULTIPLIERS: Record<number, number> = {
  1: 1.20,  // 20% boost
  2: 1.30,  // 30% boost
  3: 1.35,  // 35% boost
  4: 1.40,  // 40% boost (max)
};

const TUTORING_SESSION_DURATION = 60; // minutes per session

// ============================================
// TIMELINE CALCULATION
// ============================================

export function calculateTimeline(testDate: Date): Timeline {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  const testDateNormalized = new Date(testDate);
  testDateNormalized.setHours(0, 0, 0, 0);
  
  const totalDays = Math.ceil(
    (testDateNormalized.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const totalWeeks = Math.floor(totalDays / 7);
  const effectiveWeeks = Math.max(1, totalWeeks - 1); // Reserve final week for rest
  
  return {
    startDate,
    testDate: testDateNormalized,
    totalDays,
    totalWeeks,
    effectiveWeeks,
  };
}

// ============================================
// SCORE GAP CALCULATION
// ============================================

export function calculateScoreGap(currentScore: number, targetScore: number): ScoreGap {
  const totalGap = Math.max(0, targetScore - currentScore);
  
  let difficulty: ScoreGap['difficulty'];
  if (totalGap <= 100) {
    difficulty = 'small';
  } else if (totalGap <= 150) {
    difficulty = 'moderate';
  } else if (totalGap <= 250) {
    difficulty = 'significant';
  } else if (totalGap <= 350) {
    difficulty = 'large';
  } else {
    difficulty = 'very_large';
  }
  
  return {
    totalGap,
    isAchievable: totalGap <= 500,
    difficulty,
  };
}

// ============================================
// RECOMMENDED WEEKS BY SCORE GAP
// ============================================

export function getRecommendedWeeks(scoreGap: number): number {
  if (scoreGap <= 50) return 4;
  if (scoreGap <= 100) return 6;
  if (scoreGap <= 150) return 8;
  if (scoreGap <= 200) return 12;
  if (scoreGap <= 300) return 16;
  if (scoreGap <= 400) return 24;
  return 36;
}

// ============================================
// FEASIBILITY ASSESSMENT
// ============================================

export function assessFeasibility(
  timeline: Timeline,
  scoreGap: ScoreGap,
  intensity: string = 'moderate',
  tutoringSessionsPerWeek: 1 | 2 | 3 | 4 = 2
): FeasibilityAssessment {
  const weeks = timeline.effectiveWeeks;
  const gap = scoreGap.totalGap;
  
  const baseWeeklyRate = WEEKLY_IMPROVEMENT_RATES[intensity];
  const baseMaxImprovement = MAX_IMPROVEMENTS[intensity];
  
  // Apply tutoring multiplier (tutoring is always included)
  const tutoringMultiplier = TUTORING_MULTIPLIERS[tutoringSessionsPerWeek];
  const weeklyRate = baseWeeklyRate * tutoringMultiplier;
  const maxImprovement = baseMaxImprovement * tutoringMultiplier;
  
  const rawProjection = weeks * weeklyRate;
  const projectedImprovement = Math.min(rawProjection, maxImprovement);
  
  const recommendations: Recommendation[] = [];
  
  if (projectedImprovement >= gap) {
    const buffer = projectedImprovement - gap;
    const confidence = gap > 0 ? Math.min(95, 60 + (buffer / gap) * 35) : 95;
    
    return {
      isFeasible: true,
      confidence: Math.round(confidence),
      projectedImprovement,
      recommendations: [],
    };
  }
  
  // Goal may not be achievable - generate recommendations
  const shortfall = gap - projectedImprovement;
  const confidence = Math.max(20, 60 - (shortfall / 10));
  
  // Recommendation: Increase intensity
  const intensityLevels = ['light', 'moderate', 'intensive', 'very_intensive'];
  const currentIdx = intensityLevels.indexOf(intensity);
  
  for (let i = currentIdx + 1; i < intensityLevels.length; i++) {
    const newIntensity = intensityLevels[i];
    const newWeekly = WEEKLY_IMPROVEMENT_RATES[newIntensity] * tutoringMultiplier;
    const newMax = MAX_IMPROVEMENTS[newIntensity] * tutoringMultiplier;
    const newProjection = Math.min(weeks * newWeekly, newMax);
    
    if (newProjection >= gap) {
      const hoursDesc: Record<string, string> = {
        moderate: '5-8 hours/week',
        intensive: '9-12 hours/week',
        very_intensive: '13-20 hours/week',
      };
      
      recommendations.push({
        type: 'increase_intensity',
        priority: 'high',
        impact: newProjection - projectedImprovement,
        message: `Increase async study time to ${hoursDesc[newIntensity]}`,
        details: { newIntensity, projectedImprovement: newProjection },
      });
      break;
    }
  }
  
  // Recommendation: Add more tutoring sessions (if not already at max)
  if (tutoringSessionsPerWeek < 4) {
    const higherTutoring = Math.min(4, tutoringSessionsPerWeek + 1) as 1 | 2 | 3 | 4;
    const higherMultiplier = TUTORING_MULTIPLIERS[higherTutoring];
    const withMoreTutoring = Math.min(weeks * baseWeeklyRate * higherMultiplier, baseMaxImprovement * higherMultiplier);
    
    if (withMoreTutoring >= gap) {
      recommendations.push({
        type: 'add_tutoring',
        priority: 'high',
        impact: withMoreTutoring - projectedImprovement,
        message: `Increase tutoring to ${higherTutoring}x per week`,
        details: { 
          currentSessions: tutoringSessionsPerWeek,
          recommendedSessions: higherTutoring,
          projectedWithMoreTutoring: withMoreTutoring 
        },
      });
    }
  }
  
  // Recommendation: Extend timeline
  const additionalWeeksNeeded = Math.ceil(shortfall / weeklyRate);
  recommendations.push({
    type: 'extend_timeline',
    priority: 'medium',
    impact: shortfall,
    message: `Consider a test date ${additionalWeeksNeeded} weeks later`,
    details: { additionalWeeks: additionalWeeksNeeded },
  });
  
  // Recommendation: Adjust target
  const currentScore = 1000; // placeholder, will be passed in actual use
  const achievableScore = Math.round((projectedImprovement + currentScore) / 10) * 10;
  recommendations.push({
    type: 'adjust_target',
    priority: 'low',
    impact: shortfall,
    message: `Based on timeline, a target of ${achievableScore} is more achievable`,
    details: { achievableScore },
  });
  
  return {
    isFeasible: false,
    confidence: Math.round(confidence),
    projectedImprovement,
    shortfall,
    recommendations,
  };
}

// ============================================
// PLAN TYPE SELECTION
// ============================================

export function selectPlanType(weeks: number): PlanType {
  if (weeks <= 4) return 'cram';
  if (weeks <= 8) return 'short';
  if (weeks <= 16) return 'standard';
  if (weeks <= 32) return 'extended';
  return 'long_term';
}

// ============================================
// PHASE GENERATION
// ============================================

export function generatePhases(planType: PlanType, totalWeeks: number, scoreGap: ScoreGap): Phase[] {
  const phases: Phase[] = [];
  
  switch (planType) {
    case 'cram':
      return generateCramPhases(totalWeeks);
    case 'short':
      return generateShortPhases(totalWeeks);
    case 'standard':
      return generateStandardPhases(totalWeeks);
    case 'extended':
      return generateExtendedPhases(totalWeeks);
    case 'long_term':
      return generateLongTermPhases(totalWeeks);
    default:
      return generateStandardPhases(totalWeeks);
  }
}

function generateCramPhases(weeks: number): Phase[] {
  if (weeks <= 2) {
    return [
      {
        name: 'Diagnostic + High-Impact Strategies',
        startWeek: 1,
        endWeek: 1,
        focus: 'Identify weaknesses and learn key strategies',
        objectives: [
          'Complete full diagnostic test',
          'Learn top 5 math rules',
          'Learn top 5 R&W rules',
          'Master elimination technique',
        ],
        weeklyHours: 15,
        contentDistribution: { learning: 40, practice: 30, testing: 20, review: 10 },
      },
      {
        name: 'Intensive Practice + Final Prep',
        startWeek: 2,
        endWeek: weeks,
        focus: 'Targeted practice and test simulation',
        objectives: [
          'Complete 1 full practice test',
          'Focus on top 3 weak areas',
          'Pacing drills',
          'Light review before test day',
        ],
        weeklyHours: 12,
        contentDistribution: { learning: 20, practice: 40, testing: 30, review: 10 },
      },
    ];
  }
  
  return [
    {
      name: 'Assessment + Foundation',
      startWeek: 1,
      endWeek: Math.ceil(weeks / 2),
      focus: 'Diagnostic and core content mastery',
      objectives: [
        'Complete diagnostic test',
        'Master foundational math concepts',
        'Master grammar rules',
        'Learn SAT strategies',
      ],
      weeklyHours: 12,
      contentDistribution: { learning: 40, practice: 30, testing: 15, review: 15 },
    },
    {
      name: 'Polish + Peak',
      startWeek: Math.ceil(weeks / 2) + 1,
      endWeek: weeks,
      focus: 'Practice tests and final preparation',
      objectives: [
        'Complete 2 full practice tests',
        'Target weak areas',
        'Time management mastery',
        'Pre-test preparation',
      ],
      weeklyHours: 10,
      contentDistribution: { learning: 15, practice: 35, testing: 40, review: 10 },
    },
  ];
}

function generateShortPhases(weeks: number): Phase[] {
  const phase1End = Math.floor(weeks * 0.3);
  const phase2End = Math.floor(weeks * 0.6);
  const phase3End = Math.floor(weeks * 0.85);
  
  return [
    {
      name: 'Foundation',
      startWeek: 1,
      endWeek: phase1End || 1,
      focus: 'Diagnosis and core content',
      objectives: [
        'Complete full diagnostic test',
        'Master algebra basics',
        'Master grammar fundamentals',
        'Build reading comprehension strategies',
      ],
      weeklyHours: 10,
      contentDistribution: { learning: 40, practice: 30, testing: 15, review: 15 },
    },
    {
      name: 'Building',
      startWeek: (phase1End || 1) + 1,
      endWeek: phase2End || 3,
      focus: 'Skill development',
      objectives: [
        'Intermediate math topics',
        'Advanced grammar',
        'Evidence-based reading',
        'Strategy application',
      ],
      weeklyHours: 12,
      contentDistribution: { learning: 30, practice: 40, testing: 15, review: 15 },
    },
    {
      name: 'Practice',
      startWeek: (phase2End || 3) + 1,
      endWeek: phase3End || weeks - 1,
      focus: 'Application and testing',
      objectives: [
        'Full practice tests',
        'Error analysis',
        'Pacing drills',
        'Weak area targeting',
      ],
      weeklyHours: 12,
      contentDistribution: { learning: 20, practice: 40, testing: 30, review: 10 },
    },
    {
      name: 'Peak',
      startWeek: (phase3End || weeks - 1) + 1,
      endWeek: weeks,
      focus: 'Final preparation',
      objectives: [
        'Light review',
        'Final practice test',
        'Confidence building',
        'Rest before test day',
      ],
      weeklyHours: 8,
      contentDistribution: { learning: 10, practice: 30, testing: 40, review: 20 },
    },
  ];
}

function generateStandardPhases(weeks: number): Phase[] {
  return [
    {
      name: 'Assessment',
      startWeek: 1,
      endWeek: 1,
      focus: 'Comprehensive diagnostic and planning',
      objectives: [
        'Full proctored diagnostic test',
        'Detailed score analysis',
        'Learning style assessment',
        'Goal setting',
      ],
      weeklyHours: 8,
      contentDistribution: { learning: 20, practice: 20, testing: 50, review: 10 },
    },
    {
      name: 'Foundation',
      startWeek: 2,
      endWeek: Math.ceil(weeks * 0.25),
      focus: 'Core content mastery',
      objectives: [
        'Algebra fundamentals',
        'Grammar rules review',
        'Reading comprehension basics',
        'Question type identification',
      ],
      weeklyHours: 10,
      contentDistribution: { learning: 40, practice: 35, testing: 10, review: 15 },
    },
    {
      name: 'Development',
      startWeek: Math.ceil(weeks * 0.25) + 1,
      endWeek: Math.ceil(weeks * 0.55),
      focus: 'Full content coverage',
      objectives: [
        'Advanced math topics',
        'Complex passages',
        'Rhetoric and synthesis',
        'Strategy development',
      ],
      weeklyHours: 12,
      contentDistribution: { learning: 35, practice: 40, testing: 15, review: 10 },
    },
    {
      name: 'Strategy',
      startWeek: Math.ceil(weeks * 0.55) + 1,
      endWeek: Math.ceil(weeks * 0.80),
      focus: 'Strategy and application',
      objectives: [
        'Test-taking strategies',
        'Time management',
        'Elimination techniques',
        'Calculator/Desmos mastery',
      ],
      weeklyHours: 12,
      contentDistribution: { learning: 25, practice: 40, testing: 25, review: 10 },
    },
    {
      name: 'Peak',
      startWeek: Math.ceil(weeks * 0.80) + 1,
      endWeek: weeks,
      focus: 'Testing and final prep',
      objectives: [
        'Multiple full practice tests',
        'Error pattern analysis',
        'Confidence building',
        'Pre-test routine',
      ],
      weeklyHours: 10,
      contentDistribution: { learning: 10, practice: 35, testing: 45, review: 10 },
    },
  ];
}

function generateExtendedPhases(weeks: number): Phase[] {
  return [
    {
      name: 'Assessment & Foundation',
      startWeek: 1,
      endWeek: Math.ceil(weeks * 0.15),
      focus: 'Comprehensive diagnosis and foundation building',
      objectives: [
        'Full diagnostic testing',
        'Learning style determination',
        'Core Math: Numbers, Algebra I',
        'Core R&W: Grammar, Basic Reading',
      ],
      weeklyHours: 8,
      contentDistribution: { learning: 45, practice: 30, testing: 15, review: 10 },
    },
    {
      name: 'Core Skill Building',
      startWeek: Math.ceil(weeks * 0.15) + 1,
      endWeek: Math.ceil(weeks * 0.35),
      focus: 'Content breadth',
      objectives: [
        'Math: Algebra II, Geometry Basics',
        'R&W: Evidence, Inference, Structure',
        'Strategy: Basic elimination',
        'Regular practice tests',
      ],
      weeklyHours: 10,
      contentDistribution: { learning: 35, practice: 40, testing: 15, review: 10 },
    },
    {
      name: 'Intermediate Mastery',
      startWeek: Math.ceil(weeks * 0.35) + 1,
      endWeek: Math.ceil(weeks * 0.55),
      focus: 'Content depth',
      objectives: [
        'Advanced Algebra, Geometry',
        'Rhetoric, Complex Passages',
        'Pacing, Bookmarking',
        'Full practice tests',
      ],
      weeklyHours: 12,
      contentDistribution: { learning: 30, practice: 40, testing: 20, review: 10 },
    },
    {
      name: 'Advanced Content',
      startWeek: Math.ceil(weeks * 0.55) + 1,
      endWeek: Math.ceil(weeks * 0.75),
      focus: 'Complete coverage',
      objectives: [
        'Trigonometry, Advanced Functions',
        'Synthesis, Complex Grammar',
        'Desmos mastery',
        'Regular testing',
      ],
      weeklyHours: 12,
      contentDistribution: { learning: 25, practice: 40, testing: 25, review: 10 },
    },
    {
      name: 'Intensive Application',
      startWeek: Math.ceil(weeks * 0.75) + 1,
      endWeek: Math.ceil(weeks * 0.90),
      focus: 'Application and practice',
      objectives: [
        'Mixed content review',
        'Heavy practice emphasis',
        'Error pattern remediation',
        'Multiple full tests',
      ],
      weeklyHours: 14,
      contentDistribution: { learning: 15, practice: 45, testing: 30, review: 10 },
    },
    {
      name: 'Peak Performance',
      startWeek: Math.ceil(weeks * 0.90) + 1,
      endWeek: weeks,
      focus: 'Peak readiness',
      objectives: [
        'Strategic review',
        'High-frequency content focus',
        'Final practice tests',
        'Pre-test preparation',
      ],
      weeklyHours: 10,
      contentDistribution: { learning: 10, practice: 30, testing: 45, review: 15 },
    },
  ];
}

function generateLongTermPhases(weeks: number): Phase[] {
  const quarterLength = Math.floor(weeks / 4);
  
  return [
    {
      name: 'Academic Foundation',
      startWeek: 1,
      endWeek: quarterLength,
      focus: 'Fill academic gaps and build learning habits',
      objectives: [
        'Pre-algebra review if needed',
        'Basic grammar intensive',
        'Reading fluency development',
        'Study skills training',
      ],
      weeklyHours: 6,
      contentDistribution: { learning: 50, practice: 30, testing: 10, review: 10 },
    },
    {
      name: 'Core SAT Content',
      startWeek: quarterLength + 1,
      endWeek: quarterLength * 2,
      focus: 'Complete SAT curriculum',
      objectives: [
        'All math domains',
        'All R&W domains',
        'Strategy introduction',
        'Regular practice tests',
      ],
      weeklyHours: 8,
      contentDistribution: { learning: 40, practice: 35, testing: 15, review: 10 },
    },
    {
      name: 'Advanced Mastery',
      startWeek: quarterLength * 2 + 1,
      endWeek: quarterLength * 3,
      focus: 'Deep skill development',
      objectives: [
        'Advanced problems',
        'Strategy mastery',
        'Speed building',
        'Frequent testing',
      ],
      weeklyHours: 12,
      contentDistribution: { learning: 25, practice: 40, testing: 25, review: 10 },
    },
    {
      name: 'Peak Performance',
      startWeek: quarterLength * 3 + 1,
      endWeek: weeks,
      focus: 'Test-day readiness',
      objectives: [
        'Intensive practice',
        'Simulated testing',
        'Final content review',
        'Pre-test preparation',
      ],
      weeklyHours: 14,
      contentDistribution: { learning: 10, practice: 35, testing: 45, review: 10 },
    },
  ];
}

// ============================================
// WEEKLY PLAN GENERATION
// ============================================

export function generateWeeklyPlans(
  phases: Phase[], 
  totalWeeks: number,
  tutoringSessionsPerWeek: 1 | 2 | 3 | 4
): WeeklyPlan[] {
  const weeklyPlans: WeeklyPlan[] = [];
  
  for (let week = 1; week <= totalWeeks; week++) {
    const phase = phases.find(p => week >= p.startWeek && week <= p.endWeek);
    if (!phase) continue;
    
    const weekInPhase = week - phase.startWeek + 1;
    const totalPhaseWeeks = phase.endWeek - phase.startWeek + 1;
    
    const activities = generateWeeklyActivities(phase, weekInPhase, week, totalWeeks);
    const tutoringSessions = generateTutoringSessions(
      tutoringSessionsPerWeek,
      phase,
      week,
      totalWeeks
    );
    
    const tutoringHours = (tutoringSessionsPerWeek * TUTORING_SESSION_DURATION) / 60;
    
    weeklyPlans.push({
      weekNumber: week,
      phase: phase.name,
      focus: generateWeeklyFocus(phase, weekInPhase, totalPhaseWeeks),
      activities,
      tutoringSessions,
      targetHours: phase.weeklyHours,
      targetProblems: Math.round(phase.weeklyHours * 8), // ~8 problems per hour
      totalHoursWithTutoring: phase.weeklyHours + tutoringHours,
    });
  }
  
  return weeklyPlans;
}

function generateTutoringSessions(
  sessionsPerWeek: 1 | 2 | 3 | 4,
  phase: Phase,
  weekNumber: number,
  totalWeeks: number
): TutoringSession[] {
  const sessions: TutoringSession[] = [];
  
  // Determine tutoring focus based on phase
  const phaseFocusAreas = getTutoringFocusForPhase(phase.name, weekNumber, totalWeeks);
  
  for (let i = 1; i <= sessionsPerWeek; i++) {
    sessions.push({
      sessionNumber: i,
      duration: TUTORING_SESSION_DURATION,
      focus: phaseFocusAreas.focus,
      suggestedTopics: phaseFocusAreas.topics.slice((i - 1) * 2, i * 2),
    });
  }
  
  return sessions;
}

function getTutoringFocusForPhase(
  phaseName: string,
  weekNumber: number,
  totalWeeks: number
): { focus: string[]; topics: string[] } {
  // Final week - focus on confidence and test-day strategies
  if (weekNumber === totalWeeks) {
    return {
      focus: ['Test-day preparation', 'Confidence building'],
      topics: [
        'Review commonly missed problems',
        'Test-day strategies and timing',
        'Stress management techniques',
        'Final Q&A',
      ],
    };
  }
  
  // Week 1 - diagnostic review
  if (weekNumber === 1) {
    return {
      focus: ['Diagnostic review', 'Goal setting'],
      topics: [
        'Review diagnostic results',
        'Identify priority skill gaps',
        'Set weekly goals',
        'Establish study routine',
      ],
    };
  }
  
  // Phase-specific focus areas
  if (phaseName.includes('Foundation') || phaseName.includes('Assessment')) {
    return {
      focus: ['Core concepts', 'Foundation building'],
      topics: [
        'Algebra fundamentals',
        'Grammar rules mastery',
        'Reading comprehension strategies',
        'Question type identification',
      ],
    };
  }
  
  if (phaseName.includes('Skill Building') || phaseName.includes('Development')) {
    return {
      focus: ['Skill development', 'Strategy introduction'],
      topics: [
        'Advanced algebra techniques',
        'Geometry problem solving',
        'Evidence-based reading',
        'Rhetorical analysis',
      ],
    };
  }
  
  if (phaseName.includes('Mastery') || phaseName.includes('Advanced')) {
    return {
      focus: ['Advanced content', 'Weak area targeting'],
      topics: [
        'Complex problem types',
        'Error pattern analysis',
        'Pacing strategies',
        'Desmos calculator usage',
      ],
    };
  }
  
  if (phaseName.includes('Application') || phaseName.includes('Strategy')) {
    return {
      focus: ['Test strategies', 'Practice test review'],
      topics: [
        'Practice test analysis',
        'Time management refinement',
        'Elimination techniques',
        'High-yield content review',
      ],
    };
  }
  
  // Peak/Final phase
  return {
    focus: ['Final review', 'Peak performance'],
    topics: [
      'High-frequency topics review',
      'Quick wins identification',
      'Mental preparation',
      'Test-day logistics',
    ],
  };
}

function generateWeeklyFocus(phase: Phase, weekInPhase: number, totalPhaseWeeks: number): string[] {
  const focus: string[] = [];
  
  // Add phase-specific focus areas based on week position
  if (weekInPhase === 1) {
    focus.push(`Begin ${phase.name} phase`);
  }
  
  // Distribute objectives across weeks in phase
  const objectivesPerWeek = Math.ceil(phase.objectives.length / totalPhaseWeeks);
  const startIdx = (weekInPhase - 1) * objectivesPerWeek;
  const endIdx = Math.min(startIdx + objectivesPerWeek, phase.objectives.length);
  
  for (let i = startIdx; i < endIdx; i++) {
    focus.push(phase.objectives[i]);
  }
  
  return focus;
}

function generateWeeklyActivities(
  phase: Phase,
  weekInPhase: number,
  absoluteWeek: number,
  totalWeeks: number
): Activity[] {
  const activities: Activity[] = [];
  const totalMinutes = phase.weeklyHours * 60;
  
  const { learning, practice, testing, review } = phase.contentDistribution;
  
  // Learning activities
  if (learning > 0) {
    activities.push({
      type: 'lesson',
      name: 'Video Lessons & Content',
      duration: Math.round(totalMinutes * learning / 100),
      description: 'Watch instructional videos and study content materials',
    });
  }
  
  // Practice activities
  if (practice > 0) {
    activities.push({
      type: 'practice',
      name: 'Practice Problems',
      duration: Math.round(totalMinutes * practice / 100),
      description: 'Work through targeted practice problems',
    });
  }
  
  // Testing activities
  if (testing > 0) {
    if (absoluteWeek === 1) {
      activities.push({
        type: 'diagnostic',
        name: 'Diagnostic Test',
        duration: Math.round(totalMinutes * testing / 100),
        description: 'Complete full diagnostic test to identify strengths and weaknesses',
      });
    } else if (absoluteWeek === totalWeeks) {
      activities.push({
        type: 'rest',
        name: 'Final Preparation',
        duration: Math.round(totalMinutes * testing / 100),
        description: 'Light review and rest before test day',
      });
    } else {
      activities.push({
        type: 'test',
        name: 'Practice Test / Section Tests',
        duration: Math.round(totalMinutes * testing / 100),
        description: 'Timed practice tests to build endurance and identify gaps',
      });
    }
  }
  
  // Review activities
  if (review > 0) {
    activities.push({
      type: 'review',
      name: 'Review & Flashcards',
      duration: Math.round(totalMinutes * review / 100),
      description: 'Review mistakes and use flashcards for retention',
    });
  }
  
  return activities;
}

// ============================================
// INTENSITY RECOMMENDATION
// ============================================

function recommendIntensity(
  weeks: number,
  scoreGap: number,
  tutoringSessionsPerWeek: 1 | 2 | 3 | 4
): { intensity: string; weeklyHours: number } {
  // Account for tutoring boost when calculating required intensity
  const tutoringMultiplier = TUTORING_MULTIPLIERS[tutoringSessionsPerWeek];
  const requiredWeeklyGain = scoreGap / weeks;
  
  // Effective weekly gain needed from async study (tutoring handles part of it)
  const effectiveGainNeeded = requiredWeeklyGain / tutoringMultiplier;
  
  if (effectiveGainNeeded <= 8) {
    return { intensity: 'light', weeklyHours: WEEKLY_HOURS.light };
  } else if (effectiveGainNeeded <= 15) {
    return { intensity: 'moderate', weeklyHours: WEEKLY_HOURS.moderate };
  } else if (effectiveGainNeeded <= 22) {
    return { intensity: 'intensive', weeklyHours: WEEKLY_HOURS.intensive };
  } else {
    return { intensity: 'very_intensive', weeklyHours: WEEKLY_HOURS.very_intensive };
  }
}

// ============================================
// MAIN PLAN GENERATION
// ============================================

export function generateStudyPlan(input: UserInput): StudyPlan {
  // Step 1: Calculate timeline
  const timeline = calculateTimeline(input.testDate);
  
  // Step 2: Calculate score gap
  const scoreGap = calculateScoreGap(input.currentScore, input.targetScore);
  
  // Step 3: Recommend intensity (accounts for tutoring)
  const { intensity, weeklyHours } = recommendIntensity(
    timeline.effectiveWeeks,
    scoreGap.totalGap,
    input.tutoringSessionsPerWeek
  );
  
  // Step 4: Assess feasibility (includes tutoring multiplier)
  const feasibility = assessFeasibility(
    timeline, 
    scoreGap, 
    intensity,
    input.tutoringSessionsPerWeek
  );
  
  // Step 5: Select plan type
  const planType = selectPlanType(timeline.effectiveWeeks);
  
  // Step 6: Generate phases
  const phases = generatePhases(planType, timeline.effectiveWeeks, scoreGap);
  
  // Step 7: Generate weekly plans (includes tutoring sessions)
  const weeklyPlans = generateWeeklyPlans(
    phases, 
    timeline.effectiveWeeks,
    input.tutoringSessionsPerWeek
  );
  
  // Step 8: Calculate projected score
  const projectedScore = Math.min(
    1600,
    Math.round((input.currentScore + feasibility.projectedImprovement) / 10) * 10
  );
  
  // Step 9: Calculate tutoring totals
  const tutoringMultiplier = TUTORING_MULTIPLIERS[input.tutoringSessionsPerWeek];
  const tutoringHoursPerWeek = (input.tutoringSessionsPerWeek * TUTORING_SESSION_DURATION) / 60;
  const totalTutoringSessions = input.tutoringSessionsPerWeek * timeline.effectiveWeeks;
  
  return {
    createdAt: new Date(),
    startDate: timeline.startDate,
    testDate: timeline.testDate,
    totalWeeks: timeline.effectiveWeeks,
    startingScore: input.currentScore,
    targetScore: input.targetScore,
    projectedScore,
    scoreGap,
    planType,
    phases,
    weeklyPlans,
    feasibility,
    studyIntensity: intensity as StudyPlan['studyIntensity'],
    weeklyHoursRecommended: weeklyHours,
    tutoring: {
      sessionsPerWeek: input.tutoringSessionsPerWeek,
      totalSessions: totalTutoringSessions,
      hoursPerWeek: tutoringHoursPerWeek,
      multiplierApplied: tutoringMultiplier,
    },
  };
}
