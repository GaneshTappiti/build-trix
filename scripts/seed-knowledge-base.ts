// Knowledge Base Seeding Script for RAG System
// This script populates the vector database with initial knowledge and templates

import { vectorService } from '../lib/vector-service';

// Initial knowledge base documents
const KNOWLEDGE_BASE_DOCUMENTS = [
  {
    title: "Lovable.dev Best Practices",
    content: `Lovable.dev is an AI-powered web development platform that excels at creating React applications with TypeScript and Supabase integration.

Key Best Practices:
1. Always use React with TypeScript for type safety
2. Integrate Supabase for backend functionality including authentication, database, and real-time features
3. Style with Tailwind CSS for responsive design
4. Use shadcn/ui components for consistent UI elements
5. Implement mobile-first responsive design
6. Follow accessibility best practices (WCAG 2.1)
7. Use the Knowledge Base feature extensively to maintain context
8. Leverage Chat mode for complex planning and clarification
9. Break complex features into incremental development steps
10. Be explicit about Supabase schema requirements

Common Patterns:
- Authentication: Use Supabase Auth with protected routes
- Database: Define clear table schemas with proper relationships
- UI Components: Combine shadcn/ui with custom Tailwind styling
- State Management: Use React hooks and context for local state
- Real-time: Implement Supabase subscriptions for live updates`,
    document_type: "best_practice",
    target_tools: ["lovable"],
    categories: ["ui_design", "backend", "authentication", "database"],
    complexity_level: "intermediate"
  },
  {
    title: "React Component Architecture",
    content: `Modern React component architecture focuses on reusability, maintainability, and performance.

Component Structure:
1. Functional components with hooks
2. TypeScript interfaces for props
3. Proper prop validation
4. Memoization for performance optimization
5. Custom hooks for shared logic

Best Practices:
- Keep components small and focused
- Use composition over inheritance
- Implement proper error boundaries
- Follow the single responsibility principle
- Use descriptive naming conventions
- Separate concerns (logic, presentation, data)

Example Structure:
interface ComponentProps {
  title: string;
  onAction: () => void;
}

const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // Component logic here
  return (
    <div className="component-container">
      {/* JSX here */}
    </div>
  );
};`,
    document_type: "guide",
    target_tools: ["lovable", "v0", "cursor"],
    categories: ["ui_design", "frontend"],
    complexity_level: "intermediate"
  },
  {
    title: "Supabase Integration Patterns",
    content: `Supabase provides a complete backend solution with PostgreSQL database, authentication, and real-time subscriptions.

Database Setup:
1. Define clear table schemas with proper types
2. Set up Row Level Security (RLS) policies
3. Create indexes for performance
4. Use foreign keys for relationships

Authentication:
- Implement sign-up/sign-in flows
- Protect routes with auth guards
- Handle session management
- Use role-based access control

Real-time Features:
- Set up subscriptions for live updates
- Handle connection states
- Implement optimistic updates
- Manage subscription cleanup

Example Auth Pattern:
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Redirect to login
}

Example Real-time:
const subscription = supabase
  .channel('table-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, 
    (payload) => {
      // Handle real-time updates
    })
  .subscribe();`,
    document_type: "guide",
    target_tools: ["lovable"],
    categories: ["backend", "database", "authentication"],
    complexity_level: "intermediate"
  },
  {
    title: "Responsive Design with Tailwind CSS",
    content: `Tailwind CSS provides utility-first styling with excellent responsive design capabilities.

Mobile-First Approach:
1. Start with mobile styles (default)
2. Add breakpoints for larger screens (sm:, md:, lg:, xl:)
3. Use responsive utilities for spacing, typography, and layout
4. Test across different screen sizes

Key Responsive Patterns:
- Grid layouts: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Flexbox: flex-col md:flex-row
- Spacing: p-4 md:p-6 lg:p-8
- Typography: text-sm md:text-base lg:text-lg
- Visibility: hidden md:block

Accessibility Considerations:
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure sufficient color contrast
- Support keyboard navigation
- Test with screen readers

Example Responsive Component:
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {/* Responsive grid items */}
  </div>
</div>`,
    document_type: "guide",
    target_tools: ["lovable", "v0", "bolt"],
    categories: ["ui_design", "responsive"],
    complexity_level: "beginner"
  },
  {
    title: "Cursor IDE Best Practices",
    content: `Cursor is an AI-powered code editor that excels at code editing, refactoring, and debugging.

Effective Prompting:
1. Provide clear context about the codebase
2. Be specific about exact changes needed
3. Use incremental, file-by-file approach
4. Include proper error handling requirements
5. Focus on code quality and maintainability

Code Context Tips:
- Reference specific files and functions
- Explain the current implementation
- Describe the desired outcome
- Mention any constraints or requirements

Refactoring Patterns:
- Extract reusable functions
- Improve type safety
- Optimize performance
- Enhance readability
- Add proper error handling

Example Prompt Structure:
"In the file src/components/UserProfile.tsx, refactor the user data fetching logic to use a custom hook. The current implementation is in the useEffect, and I want to extract it to a reusable useUserData hook that handles loading states and error handling."`,
    document_type: "best_practice",
    target_tools: ["cursor"],
    categories: ["code_editing", "refactoring"],
    complexity_level: "intermediate"
  }
];

// Initial prompt templates
const PROMPT_TEMPLATES = [
  {
    template_name: "Lovable App Skeleton",
    template_content: `Create a {app_type} application using Lovable.dev with the following requirements:

## Project Setup
- Use React with TypeScript
- Integrate Supabase for backend functionality
- Style with Tailwind CSS and shadcn/ui components
- Implement responsive, mobile-first design

## Core Features
{core_features}

## Database Schema
{database_schema}

## Authentication
- Implement Supabase Auth with email/password
- Create protected routes for authenticated users
- Add user profile management

## UI Requirements
- {ui_style} design style
- Responsive layout for mobile and desktop
- Accessibility compliance (WCAG 2.1)
- Loading states and error handling

## Technical Requirements
{technical_requirements}

Please start by setting up the project structure and implementing the core authentication flow.`,
    template_type: "skeleton",
    target_tool: "lovable",
    use_case: "new_project_setup",
    project_complexity: "medium",
    required_variables: ["app_type", "core_features", "database_schema", "ui_style", "technical_requirements"]
  },
  {
    template_name: "React Component Creation",
    template_content: `Create a {component_type} React component with the following specifications:

## Component Requirements
- Use TypeScript for type safety
- Implement proper prop validation
- Follow React best practices
- Include error handling

## Functionality
{functionality_description}

## Props Interface
{props_interface}

## Styling
- Use {styling_framework} for styling
- Implement responsive design
- Follow accessibility guidelines

## State Management
{state_requirements}

## Example Usage
Provide an example of how to use this component in a parent component.

Please ensure the component is reusable, well-documented, and follows modern React patterns.`,
    template_type: "feature",
    target_tool: "lovable",
    use_case: "component_creation",
    project_complexity: "simple",
    required_variables: ["component_type", "functionality_description", "props_interface", "styling_framework", "state_requirements"]
  },
  {
    template_name: "Database Integration",
    template_content: `Implement database integration for {feature_name} using Supabase:

## Database Schema
{table_schema}

## Required Operations
{crud_operations}

## Real-time Features
{realtime_requirements}

## Security
- Implement Row Level Security (RLS) policies
- Add proper user authentication checks
- Validate data before database operations

## Error Handling
- Handle network errors gracefully
- Provide user-friendly error messages
- Implement retry logic where appropriate

## Performance
- Add appropriate database indexes
- Implement pagination for large datasets
- Use optimistic updates for better UX

Please provide the complete implementation including TypeScript types, database functions, and React hooks.`,
    template_type: "feature",
    target_tool: "lovable",
    use_case: "database_integration",
    project_complexity: "complex",
    required_variables: ["feature_name", "table_schema", "crud_operations", "realtime_requirements"]
  }
];

/**
 * Seed the knowledge base with initial documents and templates
 */
export async function seedKnowledgeBase(): Promise<void> {
  console.log('🌱 Starting knowledge base seeding...');

  try {
    // Seed knowledge base documents
    console.log('📚 Adding knowledge base documents...');
    for (const doc of KNOWLEDGE_BASE_DOCUMENTS) {
      try {
        const id = await vectorService.addKnowledgeDocument(doc);
        console.log(`✅ Added knowledge document: ${doc.title} (ID: ${id})`);
      } catch (error) {
        console.error(`❌ Failed to add document "${doc.title}":`, error);
      }
    }

    // Seed prompt templates
    console.log('📝 Adding prompt templates...');
    for (const template of PROMPT_TEMPLATES) {
      try {
        const id = await vectorService.addPromptTemplate(template);
        console.log(`✅ Added prompt template: ${template.template_name} (ID: ${id})`);
      } catch (error) {
        console.error(`❌ Failed to add template "${template.template_name}":`, error);
      }
    }

    console.log('🎉 Knowledge base seeding completed successfully!');
  } catch (error) {
    console.error('💥 Knowledge base seeding failed:', error);
    throw error;
  }
}

/**
 * Run seeding if this script is executed directly
 */
if (require.main === module) {
  seedKnowledgeBase()
    .then(() => {
      console.log('✨ Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}
