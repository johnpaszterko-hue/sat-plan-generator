// Core types for SAT Plan Generation

export interface UserInput {
  testDate: Date;
  currentScore: number;
  targetScore: number;
  tutoringSessionsPerWeek: 1 | 2 | 3 | 4; // All students have tutoring included
}

export interface Timeline {
  startDate: Date;
  testDate: Date;
  totalDays: number;
  totalWeeks: number;
  effectiveWeeks: number; // Minus final rest week
}

export interface ScoreGap {
  totalGap: number;
  isAchievable: boolean;
  difficulty: 'small' | 'moderate' | 'significant' | 'large' | 'very_large';
}

export interface FeasibilityAssessment {
  isFeasible: boolean;
  confidence: number; // 0-100
  projectedImprovement: number;
  shortfall?: number;
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'increase_intensity' | 'add_tutoring' | 'extend_timeline' | 'adjust_target';
  priority: 'high' | 'medium' | 'low';
  impact: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface Phase {
  name: string;
  startWeek: number;
  endWeek: number;
  focus: string;
  objectives: string[];
  weeklyHours: number;
  contentDistribution: {
    learning: number;
    practice: number;
    testing: number;
    review: number;
  };
}

export interface WeeklyPlan {
  weekNumber: number;
  phase: string;
  focus: string[];
  activities: Activity[];
  tutoringSessions: TutoringSession[];
  targetHours: number;
  targetProblems: number;
  totalHoursWithTutoring: number;
}

export interface Activity {
  type: 'diagnostic' | 'lesson' | 'practice' | 'review' | 'test' | 'rest' | 'tutoring';
  name: string;
  duration: number; // minutes
  description: string;
}

export interface TutoringSession {
  sessionNumber: number;
  duration: number; // minutes (typically 60)
  focus: string[];
  suggestedTopics: string[];
}

export interface StudyPlan {
  userId?: string;
  createdAt: Date;
  
  // Timeline
  startDate: Date;
  testDate: Date;
  totalWeeks: number;
  
  // Goals
  startingScore: number;
  targetScore: number;
  projectedScore: number;
  scoreGap: ScoreGap;
  
  // Plan structure
  planType: 'cram' | 'short' | 'standard' | 'extended' | 'long_term';
  phases: Phase[];
  weeklyPlans: WeeklyPlan[];
  
  // Assessment
  feasibility: FeasibilityAssessment;
  
  // Recommendations
  studyIntensity: 'light' | 'moderate' | 'intensive' | 'very_intensive';
  weeklyHoursRecommended: number;
  
  // Tutoring
  tutoring: {
    sessionsPerWeek: 1 | 2 | 3 | 4;
    totalSessions: number;
    hoursPerWeek: number;
    multiplierApplied: number;
  };
}

export type PlanType = 'cram' | 'short' | 'standard' | 'extended' | 'long_term';
