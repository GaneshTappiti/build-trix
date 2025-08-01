# Contributing to BuildTrix MVP Studio

Thank you for your interest in contributing to BuildTrix MVP Studio! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- A GitHub account

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/buildtrix-mvp-studio.git
   cd buildtrix-mvp-studio
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in your values
5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🎯 How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node.js version)

### Suggesting Features

1. **Check existing issues** for similar suggestions
2. **Create a feature request** with:
   - Clear description of the feature
   - Use case and benefits
   - Possible implementation approach
   - Mockups or examples if applicable

### Code Contributions

1. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Create a Pull Request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots of changes if applicable

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type when possible

### React Components

- Use functional components with hooks
- Follow the existing component structure
- Use proper prop types and interfaces

### Styling

- Use Tailwind CSS classes
- Follow the existing design system
- Ensure responsive design
- Support dark mode

### File Organization

```
components/
├── builder-cards/     # MVP Studio stage components
├── ui/               # Reusable UI components
└── WorkspaceSidebar.tsx

app/
├── (authenticated)/  # Protected routes
│   └── workspace/   # Workspace pages
└── api/             # API routes

lib/
└── builderContext.tsx # State management
```

## 🧪 Testing

- Test your changes manually
- Ensure all existing functionality still works
- Test responsive design on different screen sizes
- Test dark/light mode compatibility

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] Changes have been tested thoroughly
- [ ] Documentation has been updated if needed
- [ ] No console errors or warnings
- [ ] Responsive design works correctly
- [ ] Dark mode compatibility maintained

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Responsive design verified
- [ ] Dark mode compatibility checked

## Screenshots
[Add screenshots if applicable]

## Related Issues
Closes #[issue number]
```

## 🎨 Design Guidelines

### Colors
- Follow the existing color scheme
- Use Tailwind CSS color classes
- Maintain accessibility standards

### Typography
- Use consistent font sizes and weights
- Follow the existing typography scale
- Ensure good readability

### Spacing
- Use Tailwind spacing classes
- Maintain consistent spacing patterns
- Follow the existing layout structure

## 🚀 Release Process

1. **Version Bump**: Update version in `package.json`
2. **Changelog**: Update `CHANGELOG.md` with new features and fixes
3. **Tag Release**: Create a git tag for the new version
4. **Deploy**: Automatic deployment via CI/CD

## 📞 Getting Help

- **Discord**: [Join our Discord server]
- **GitHub Issues**: For bug reports and feature requests
- **Email**: [maintainer-email@example.com]

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to BuildTrix MVP Studio! 🎉
