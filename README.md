# SAT Study Plan Generator

A personalized, research-backed SAT study plan generator that creates comprehensive prep plans based on student data and tutoring schedules.

---

## 🎯 Overview

This tool generates customized SAT study plans by analyzing:
- **Test Date** - When the student is taking the SAT
- **Current Score** - Baseline score (400-1600)
- **Target Score** - Goal score (400-1600)
- **Tutoring Frequency** - Sessions per week with assigned SAT tutor (1x, 2x, 3x, or 4x)

The algorithm is based on research-backed learning science principles from the Varsity Tutors SAT prep documentation, including:
- Spaced repetition
- Interleaved practice
- Adaptive plan updates
- Phase-based progression

---

## 🚀 Quick Start

```bash
cd sat-plan-generator
npm install
npm run dev
```

Open **http://localhost:3001** in your browser.

---

## 📊 What Gets Generated

### Plan Summary
- **Duration** - Total weeks until test
- **Plan Type** - Cram (2-4 wks), Short (5-8), Standard (9-16), Extended (17-32), or Long-term (33-52)
- **Projected Score** - Expected score if plan is followed
- **Feasibility Assessment** - Confidence level that goal is achievable

### Weekly Commitment
| Component | Description |
|-----------|-------------|
| Self-Study Hours | Recommended async study time per week |
| Tutoring Sessions | 1-4x per week with SAT tutor (60 min each) |
| Total Time | Combined weekly commitment |

### Tutoring Impact
- **Progress Boost** based on session frequency:
  - 1x/week = +20% improvement rate
  - 2x/week = +30% improvement rate
  - 3x/week = +35% improvement rate
  - 4x/week = +40% improvement rate
- **Total Sessions** across the entire plan
- **Session Topics** tailored to each phase

### Study Phases
Each plan includes 4-6 phases with specific objectives:

| Phase | Focus | Content Distribution |
|-------|-------|---------------------|
| Assessment/Foundation | Diagnostic + core content | Heavy learning, moderate practice |
| Skill Building | Content breadth | Balanced learning/practice |
| Intermediate Mastery | Content depth | More practice, regular testing |
| Advanced Content | Complete coverage | Strategy + application |
| Intensive Application | Heavy practice | Error remediation, full tests |
| Peak Performance | Final prep | Testing focus, light review |

### Weekly Plans
Each week includes:
- **Tutoring Sessions** with suggested topics
- **Self-Study Activities** (lessons, practice, tests, review)
- **Target Hours** and **Target Problems**
- **Phase-specific focus areas**

---

## 📋 Example Output

**Scenario:** Student at 1080 → 1350, test in 19 weeks, 2x tutoring/week

### Plan Summary

| Metric | Value |
|--------|-------|
| Test Date | May 31, 2026 |
| Duration | 19 weeks |
| Plan Type | Extended |
| Current → Projected | 1080 → 1410 ✅ |
| Target | 1350 |
| Feasibility | Achievable (67% confidence) |

### Weekly Commitment

| Component | Hours/Week |
|-----------|------------|
| 📚 Self-Study | 6.5 hrs |
| 👨‍🏫 Tutoring (2x) | 2 hrs |
| ⏱️ **Total** | **8.5 hrs** |

### Tutoring Impact

| Metric | Value |
|--------|-------|
| Total Sessions | 38 sessions |
| Progress Boost | +30% |

### Sample Week (Week 4 - Core Skill Building)

**👨‍🏫 Tutoring Sessions:**

| Session | Duration | Topics |
|---------|----------|--------|
| Session 1 | 60 min | Advanced algebra, Geometry problem solving |
| Session 2 | 60 min | Evidence-based reading, Rhetorical analysis |

**📚 Self-Study Activities:**

| Activity | Duration |
|----------|----------|
| Video Lessons & Content | 3.5 hrs |
| Practice Problems | 4 hrs |
| Practice Test / Section Tests | 1.5 hrs |
| Review & Flashcards | 1 hr |
| **Total with Tutoring** | **12 hrs** |

---

## 🔬 Algorithm Details

### Feasibility Calculation

The algorithm determines if a goal is achievable based on:

```
Weekly Improvement Rate × Tutoring Multiplier × Weeks Available
```

**Base Weekly Improvement Rates:**
| Intensity | Hours/Week | Points/Week |
|-----------|------------|-------------|
| Light | 2-4 hrs | 8 pts |
| Moderate | 5-8 hrs | 15 pts |
| Intensive | 9-12 hrs | 22 pts |
| Very Intensive | 13-20 hrs | 30 pts |

**Tutoring Multipliers:**
| Sessions/Week | Multiplier |
|---------------|------------|
| 1x | 1.20 (+20%) |
| 2x | 1.30 (+30%) |
| 3x | 1.35 (+35%) |
| 4x | 1.40 (+40%) |

### Plan Type Selection

| Weeks Available | Plan Type |
|-----------------|-----------|
| 2-4 weeks | Cram |
| 5-8 weeks | Short |
| 9-16 weeks | Standard |
| 17-32 weeks | Extended |
| 33-52 weeks | Long-term |

### Recommendations

When goals are challenging, the system provides prioritized recommendations:
1. 🔴 **HIGH** - Increase study intensity
2. 🔴 **HIGH** - Increase tutoring frequency (if < 4x/week)
3. 🟡 **MEDIUM** - Extend timeline (later test date)
4. ⚪ **LOW** - Adjust target score

---

## 📁 Project Structure

```
sat-plan-generator/
├── src/
│   ├── app/
│   │   ├── page.tsx        # Main UI with form and results
│   │   ├── layout.tsx      # App layout
│   │   └── globals.css     # Styling
│   └── lib/
│       ├── types.ts        # TypeScript interfaces
│       └── planGenerator.ts # Core algorithm
├── package.json
└── README.md
```

---

## 🔧 Core Types

### UserInput
```typescript
interface UserInput {
  testDate: Date;
  currentScore: number;           // 400-1600
  targetScore: number;            // 400-1600
  tutoringSessionsPerWeek: 1 | 2 | 3 | 4;
}
```

### StudyPlan (Output)
```typescript
interface StudyPlan {
  // Timeline
  startDate: Date;
  testDate: Date;
  totalWeeks: number;
  
  // Scores
  startingScore: number;
  targetScore: number;
  projectedScore: number;
  scoreGap: ScoreGap;
  
  // Plan Structure
  planType: 'cram' | 'short' | 'standard' | 'extended' | 'long_term';
  phases: Phase[];
  weeklyPlans: WeeklyPlan[];
  
  // Assessment
  feasibility: FeasibilityAssessment;
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
```

### WeeklyPlan
```typescript
interface WeeklyPlan {
  weekNumber: number;
  phase: string;
  focus: string[];
  activities: Activity[];
  tutoringSessions: TutoringSession[];
  targetHours: number;
  targetProblems: number;
  totalHoursWithTutoring: number;
}
```

### TutoringSession
```typescript
interface TutoringSession {
  sessionNumber: number;
  duration: number;              // 60 minutes
  focus: string[];               // Phase-appropriate focus areas
  suggestedTopics: string[];     // Specific topics to cover
}
```

---

## 🎨 Features

- ✅ Personalized plan based on timeline and score gap
- ✅ Tutoring sessions integrated into weekly plans
- ✅ Phase-based progression (Assessment → Foundation → Development → Strategy → Peak)
- ✅ Feasibility assessment with confidence percentage
- ✅ Actionable recommendations when goals are challenging
- ✅ Content distribution by phase (learning vs practice vs testing)
- ✅ Weekly activity breakdown with time estimates
- ✅ Score projection based on tutoring + self-study
- ✅ Beautiful, modern dark-themed UI

---

## 📚 Research Foundation

This algorithm is based on learning science research including:
- **Spaced Repetition** (Ebbinghaus, SM-2 algorithm)
- **Retrieval Practice** (Roediger & Karpicke)
- **Interleaved Practice** (Bjork, Rohrer & Taylor)
- **Desirable Difficulties** (Bjork)
- **Weekly Adaptive Plans** (vs static or daily adaptation)

---

## 🛠️ Future Enhancements

Potential additions:
- [ ] Math vs Reading/Writing section breakdown
- [ ] Skill-level mastery tracking
- [ ] Practice test score integration
- [ ] Calendar/scheduling integration
- [ ] Progress tracking dashboard
- [ ] PDF export of study plan
- [ ] Email reminders for sessions

---

## 📄 License

Internal use - Varsity Tutors

---

*Generated from Varsity Tutors SAT Prep Algorithm Documentation*
