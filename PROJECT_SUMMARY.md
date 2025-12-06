# CodeAnalyzer Project Summary

## Overview
CodeAnalyzer is a modern, AI-powered code audit and analysis tool designed to help developers master their code quality. It leverages Google's **Gemini 2.0 Flash** model to provide deep, context-aware insights that go beyond traditional static analysis. The platform offers a premium, professional user interface with advanced visualization tools to detect bugs, security vulnerabilities, and architectural flaws.

## Key Features

### 1. 🚀 Intelligent Code Analysis
- **Deep Scan Engine**: Uses Gemini 2.0 to understand code context, logic, and intent.
- **Multi-Category Detection**: Identifies issues across:
  - **Security**: OWASP Top 10, hardcoded secrets, injection vulnerabilities.
  - **Performance**: N+1 queries, memory leaks, unoptimized algorithms.
  - **Code Quality**: Maintainability, readability, complexity (Cyclomatic, Halstead).
  - **Architecture**: Design pattern adherence, anti-patterns.
- **Automated Scoring**: Generates objective scores (0-100) for Overall Quality, Security, Maintainability, and Architecture.

### 2. 🤖 AI Detection & Forensics
- **Project-Wide AI Scan**: Samples project files to estimate the overall probability of AI-generated code.
- **Single File Analysis**: Detects if specific files were written by AI.
- **Source Identification**: Attempts to identify the likely source model (ChatGPT, Gemini, Copilot, Llama).
- **Forensic Signals**: Analyzes comment style, naming patterns, structure, and complexity to determine authorship.

### 3. 🏗️ Architecture Visualization
- **Interactive Diagrams**: Generates Mermaid.js class diagrams and dependency graphs.
- **Pattern Recognition**: Automatically detects architectural patterns (MVC, Microservices, Monolith).
- **Dependency Analysis**: Identifies circular dependencies and coupling issues.
- **Quality Assessment**: Provides high-level architectural feedback and improvement suggestions.

### 4. 💻 Seamless Input Methods
- **Multiple Upload Options**:
  - **Single File**: Quick analysis for snippets.
  - **ZIP Archive**: Full project analysis.
  - **GitHub Integration**: Direct cloning and analysis of public repositories.
- **Language Support**: JavaScript, TypeScript, Python, Java, Go, Rust.

### 5. 📊 Comprehensive Dashboard
- **Modern UI/UX**: Premium glassmorphism design with smooth animations and dark mode aesthetics.
- **File Explorer**: Integrated file browser to navigate the project structure.
- **Issue Filtering**: Filter issues by severity (High, Medium, Low) or specific files.
- **Detailed Insights**: Modal views for issues with detailed descriptions and AI-suggested fixes.

### 6. 📄 Reporting & Export
- **PDF Export**: Generates professional, downloadable PDF reports of the audit findings.
- **Re-analysis**: One-click option to re-scan the project after making changes.

## Technology Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS with custom animations and glassmorphism utilities
- **Icons**: Lucide React
- **Visualization**: Mermaid.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Model**: Google Gemini 2.0 Flash
- **Database**: MongoDB (implied by models structure)
- **File Handling**: Multer (for uploads), Adm-Zip (for archives)

## Value Proposition
CodeAnalyzer bridges the gap between simple linters and expensive enterprise analysis tools. By combining static analysis with the reasoning capabilities of Large Language Models, it provides actionable, context-aware feedback that helps developers write better, safer, and more maintainable code.
