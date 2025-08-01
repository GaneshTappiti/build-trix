# Complete Data Flow with RAG Enhancement

## 🔄 Stage-by-Stage Data Flow

### Stage 1: App Idea (Tool-Adaptive Engine)
**Input**: User form data
**Output**: 
```typescript
appIdea: {
  appName: string;
  platforms: string[];
  designStyle: string;
  ideaDescription: string;
  targetAudience: string;
}
```
**Data Persistence**: ✅ Auto-saved to localStorage + sessionStorage
**RAG Enhancement**: ❌ None

---

### Stage 2: Validation (Idea Interpreter) + Tool Selection
**Input**: `appIdea` from Stage 1
**Output**: 
```typescript
validationQuestions: {
  hasValidated: boolean;
  hasDiscussed: boolean;
  motivation: string;
  preferredAITool: 'lovable' | 'cursor' | 'v0' | 'bolt'; // 🔑 KEY ADDITION
  projectComplexity: 'simple' | 'medium' | 'complex';
  technicalExperience: 'beginner' | 'intermediate' | 'advanced';
}
```
**Data Persistence**: ✅ Auto-saved + tool selection preserved
**RAG Enhancement**: ⚡ Tool selection for future stages

---

### Stage 3: Blueprint (App Skeleton Generator) - HEAVY RAG
**Input**: `appIdea` + `validationQuestions` (including tool selection)
**Process**:
1. Generate base blueprint
2. **RAG Enhancement** using selected tool
3. Merge base + enhanced data

**Output**: 
```typescript
appBlueprint: {
  // Base blueprint data
  screens: Screen[];
  userRoles: UserRole[];
  dataModels: DataModel[];
  architecture: string;
  
  // 🚀 RAG Enhancement Data
  ragEnhanced: true;
  confidenceScore: 0.85;
  suggestions: string[];
  toolSpecificRecommendations: [
    "Use Supabase for backend and database",
    "Implement Row Level Security (RLS) policies"
  ];
  securityConsiderations: string[];
  scalabilityNotes: string[];
}
```
**Data Persistence**: ✅ All data including RAG enhancements saved
**RAG Enhancement**: 🚀 Heavy - Architecture patterns, tool optimizations

---

### Stage 4: Screen Prompts (UI Prompt Generator) - HEAVY RAG
**Input**: `appIdea` + `validationQuestions` + `appBlueprint` (with RAG data)
**Process**:
1. Generate base screen prompts for each screen
2. **RAG Enhancement** using selected tool + design style
3. Optimize each prompt with tool-specific patterns

**Output**: 
```typescript
screenPrompts: ScreenPrompt[] = [
  {
    screenId: string;
    title: string;
    layout: string;
    components: string;
    behavior: string;
    
    // 🚀 RAG Enhancement Data
    ragEnhanced: true;
    toolOptimizations: [
      "Use shadcn/ui components for consistent design",
      "Implement Tailwind CSS for styling"
    ];
    designGuidelines: string[];
    confidenceScore: 0.82;
  }
]
```
**Data Persistence**: ✅ All prompts with RAG enhancements saved
**RAG Enhancement**: 🚀 Heavy - UI patterns, component libraries, tool optimizations

---

### Stage 5: Flow Description
**Input**: All previous stage data (preserved)
**Output**: 
```typescript
appFlow: {
  navigationFlow: string;
  userJourney: string[];
}
```
**Data Persistence**: ✅ Auto-saved
**RAG Enhancement**: ❌ None

---

### Stage 6: Export Composer
**Input**: All previous stage data (including RAG enhancements)
**Process**: Uses tool selection from Stage 2 + RAG-enhanced data from Stages 3 & 4
**Output**: 
```typescript
exportPrompts: {
  targetTool: string; // From Stage 2
  unifiedPrompt: string; // Includes RAG enhancements
  screenSpecificPrompts: Record<string, string>; // RAG-enhanced prompts
}
```
**Data Persistence**: ✅ Final export with all enhancements
**RAG Enhancement**: ⚡ Uses tool selection + enhanced data

## 🔗 Data Connection Points

### Critical Connection 1: Tool Selection (Stage 2 → Stages 3 & 4)
```typescript
// Stage 2: User selects tool
validationQuestions.preferredAITool = 'lovable';

// Stage 3: Uses tool for RAG enhancement
const enhancement = await enhanceBlueprint(appIdea, validationQuestions, blueprint);

// Stage 4: Uses same tool for UI optimization
const uiEnhancement = await enhanceScreenPrompts(appIdea, validationQuestions, prompts);
```

### Critical Connection 2: Blueprint Data (Stage 3 → Stage 4)
```typescript
// Stage 3: Enhanced blueprint with RAG
appBlueprint = {
  screens: [...],
  ragEnhanced: true,
  toolSpecificRecommendations: [...]
};

// Stage 4: Uses blueprint screens for prompt generation
screenPrompts = appBlueprint.screens.map(screen => 
  generateEnhancedPrompt(screen, selectedTool)
);
```

### Critical Connection 3: RAG Data Preservation
```typescript
// Auto-save includes RAG data
const stateToSave = {
  appIdea,
  validationQuestions, // includes tool selection
  appBlueprint: {
    ...baseBlueprint,
    ragEnhanced: true,
    confidenceScore: 0.85,
    toolSpecificRecommendations: [...]
  },
  screenPrompts: prompts.map(p => ({
    ...p,
    ragEnhanced: true,
    toolOptimizations: [...]
  }))
};

localStorage.setItem('builder-project', JSON.stringify(stateToSave));
```

## 🛡️ Data Integrity Safeguards

### 1. Auto-Save with RAG Data
- **Frequency**: Every 2 seconds after changes
- **Scope**: All stage data + RAG enhancements
- **Storage**: localStorage (persistent) + sessionStorage (immediate)

### 2. State Recovery
- **Session Recovery**: Restores exact state including RAG data
- **Project Loading**: Preserves all RAG enhancements when loading saved projects
- **Fallback**: If RAG enhancement fails, base data is preserved

### 3. Data Validation
```typescript
// Ensure tool selection is preserved
if (!state.validationQuestions.preferredAITool && state.currentCard > 2) {
  // Prompt user to select tool before proceeding
}

// Ensure RAG data is maintained
if (state.appBlueprint?.ragEnhanced && !state.appBlueprint.confidenceScore) {
  // Re-run RAG enhancement or use fallback
}
```

## 📊 Data Flow Verification

### Check 1: Tool Selection Persistence
```typescript
// Stage 2 → Stage 3
✅ validationQuestions.preferredAITool → blueprint enhancement
✅ Tool selection saved in localStorage
✅ Tool selection available in sessionStorage

// Stage 3 → Stage 4  
✅ Same tool used for screen prompt enhancement
✅ Blueprint RAG data preserved
```

### Check 2: RAG Enhancement Preservation
```typescript
// Stage 3 Blueprint
✅ ragEnhanced: true
✅ confidenceScore: number
✅ toolSpecificRecommendations: string[]
✅ All data saved to localStorage

// Stage 4 Screen Prompts
✅ Each prompt has ragEnhanced: true
✅ toolOptimizations preserved
✅ designGuidelines maintained
```

### Check 3: Cross-Stage Data Access
```typescript
// Stage 4 can access Stage 3 data
✅ appBlueprint.screens → used for prompt generation
✅ appBlueprint.toolSpecificRecommendations → applied to prompts
✅ validationQuestions.preferredAITool → used for optimization

// Stage 6 can access all enhanced data
✅ RAG-enhanced blueprint → included in export
✅ RAG-enhanced screen prompts → included in export
✅ Tool selection → used for final optimization
```

## 🎯 Summary

**Data Flow is Complete**: ✅
- Each stage builds upon previous stage data
- RAG enhancements are preserved throughout the flow
- Tool selection from Stage 2 drives optimization in Stages 3 & 4
- All data is auto-saved and recoverable
- No data is lost when moving between stages

**Key Features**:
1. **Seamless Integration**: RAG works transparently within existing flow
2. **Data Persistence**: All enhancements are saved and restored
3. **Tool Consistency**: Same tool used for all optimizations
4. **Fallback Safety**: System works even if RAG fails
5. **Quality Tracking**: Confidence scores and suggestions preserved
