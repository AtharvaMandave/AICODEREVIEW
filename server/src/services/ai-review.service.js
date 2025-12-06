import { GROQ_API_KEY, CHUNK_SIZE, CHUNK_OVERLAP } from '../config/env.js';
import { logger } from '../utils/logger.js';

const getLanguageFromExtension = (ext) => {
    const languageMap = {
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.py': 'Python',
        '.java': 'Java',
        '.go': 'Go',
        '.rs': 'Rust'
    };
    return languageMap[ext] || 'Unknown';
};

/**
 * Helper to truncate text to stay within token limits
 * Groq's Llama 3 models have various token limits
 */
const truncateText = (text, maxChars = 12000) => {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + '\n... [truncated for length]';
};

/**
 * Helper to call Groq API directly
 * Using Llama 3.3 70B model (free tier available)
 */
const callGroqAPI = async (prompt, maxTokens = 4096) => {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not defined');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: maxTokens,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new Error('Invalid response format from Groq API');
    }

    return data.choices[0].message.content;
};

/**
 * Split large file into chunks with overlap (professional chunking strategy)
 */
export const chunkFile = (content, filePath) => {
    const lines = content.split('\n');
    const chunks = [];

    if (lines.length <= CHUNK_SIZE) {
        // File is small enough, return as single chunk
        return [{
            content,
            startLine: 1,
            endLine: lines.length,
            chunkIndex: 0,
            totalChunks: 1
        }];
    }

    let currentLine = 0;
    let chunkIndex = 0;

    while (currentLine < lines.length) {
        const endLine = Math.min(currentLine + CHUNK_SIZE, lines.length);
        const chunkLines = lines.slice(currentLine, endLine);

        chunks.push({
            content: chunkLines.join('\n'),
            startLine: currentLine + 1,
            endLine: endLine,
            chunkIndex: chunkIndex,
            totalChunks: 0 // Will be set after all chunks are created
        });

        // Move forward, accounting for overlap
        currentLine += CHUNK_SIZE - CHUNK_OVERLAP;
        chunkIndex++;
    }

    // Set total chunks for all
    chunks.forEach(chunk => chunk.totalChunks = chunks.length);

    logger.info(`File ${filePath} split into ${chunks.length} chunks`);
    return chunks;
};

/**
 * Generate AI review prompt for code chunk
 */
const generateReviewPrompt = (chunk, filePath, language) => {
    return `You are a senior software engineer conducting a code review. Analyze this ${language} code and identify issues.

**File:** ${filePath}
**Lines:** ${chunk.startLine}-${chunk.endLine}
**Chunk:** ${chunk.chunkIndex + 1}/${chunk.totalChunks}

**Code:**
\`\`\`${language.toLowerCase()}
${truncateText(chunk.content)}
\`\`\`

**Instructions:**
1. Identify code quality issues, security vulnerabilities, performance problems, and architectural concerns
2. For each issue, provide:
   - Category (code-quality, security, performance, architecture, design-pattern, maintainability, readability)
   - Severity (high, medium, low)
   - Title (brief description)
   - Description (detailed explanation)
   - Line number (relative to chunk start)
   - Suggestion (how to fix it)

**Output Format (JSON array):**
[
  {
    "category": "security",
    "severity": "high",
    "title": "SQL Injection vulnerability",
    "description": "User input is directly concatenated into SQL query",
    "lineNumber": 15,
    "suggestion": "Use parameterized queries or prepared statements"
  }
]

Return ONLY the JSON array, no additional text.`;
};

/**
 * Review a single code chunk with AI
 */
export const reviewChunk = async (chunk, filePath, language) => {
    try {
        const prompt = generateReviewPrompt(chunk, filePath, language);
        const text = await callGroqAPI(prompt);

        // Parse JSON response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            logger.warn(`No valid JSON found in AI response for ${filePath} chunk ${chunk.chunkIndex}`);
            return [];
        }

        const issues = JSON.parse(jsonMatch[0]);

        // Adjust line numbers to absolute file positions
        // Sanitize and validate issue fields
        const validCategories = [
            'code-quality', 'security', 'performance', 'architecture',
            'design-pattern', 'maintainability', 'readability'
        ];
        const validSeverities = ['high', 'medium', 'low'];

        return issues.map(issue => ({
            ...issue,
            category: validCategories.includes(issue.category) ? issue.category : 'code-quality',
            severity: validSeverities.includes(issue.severity) ? issue.severity : 'medium',
            title: issue.title || 'Untitled Issue',
            description: issue.description || 'No description provided.',
            lineNumber: {
                start: chunk.startLine + (parseInt(issue.lineNumber) || 0) - 1,
                end: chunk.startLine + (parseInt(issue.lineNumber) || 0) - 1
            },
            source: 'ai-review',
            filePath
        }));

    } catch (error) {
        logger.error(`AI review error for ${filePath} chunk ${chunk.chunkIndex}:`, error.message);
        return [];
    }
};

/**
 * Review entire file with chunking and parallel processing
 */
export const reviewFile = async (filePath, content, language) => {
    try {
        const chunks = chunkFile(content, filePath);
        logger.info(`Reviewing ${filePath} with ${chunks.length} chunks`);

        // Process chunks in parallel (with concurrency limit)
        const MAX_CONCURRENT = 3; // Lower for Groq rate limits
        const allIssues = [];

        for (let i = 0; i < chunks.length; i += MAX_CONCURRENT) {
            const batch = chunks.slice(i, i + MAX_CONCURRENT);
            const batchResults = await Promise.all(
                batch.map(chunk => reviewChunk(chunk, filePath, language))
            );

            batchResults.forEach(issues => allIssues.push(...issues));

            logger.info(`Processed chunks ${i + 1}-${Math.min(i + MAX_CONCURRENT, chunks.length)} of ${chunks.length}`);

            // Add small delay to avoid rate limits
            if (i + MAX_CONCURRENT < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        // Deduplicate issues in overlap regions
        const deduplicatedIssues = deduplicateIssues(allIssues);

        logger.info(`AI review complete for ${filePath}: ${deduplicatedIssues.length} issues found`);
        return deduplicatedIssues;

    } catch (error) {
        logger.error(`AI review error for ${filePath}:`, error.message);
        return [];
    }
};

/**
 * Deduplicate issues found in overlapping regions
 */
const deduplicateIssues = (issues) => {
    const seen = new Set();
    const unique = [];

    for (const issue of issues) {
        // Create a unique key based on file, line, and title
        const key = `${issue.filePath}:${issue.lineNumber.start}:${issue.title}`;

        if (!seen.has(key)) {
            seen.add(key);
            unique.push(issue);
        }
    }

    return unique;
};

/**
 * Generate architecture insights for entire project
 */
export const analyzeArchitecture = async (files, projectName) => {
    try {
        if (!GROQ_API_KEY) {
            logger.error('GROQ_API_KEY is not configured. Architecture analysis cannot proceed.');
            return null;
        }

        // Create a summary of the project structure
        const fileList = files.map(f => `${f.path} (${f.lines} lines)`).join('\n');

        const prompt = `You are a senior software architect. Analyze this codebase structure and provide insights.

**Project:** ${projectName}
**Files:**
${truncateText(fileList, 8000)}

**Instructions:**
Analyze the architecture and provide:
1. Architecture pattern (MVC, microservices, monolith, layered, etc.)
2. Quality assessment (excellent, good, needs-improvement, poor)
3. Key issues (array of strings)
4. Suggestions for improvement (array of strings)
5. Identify any circular dependencies
6. Generate a Mermaid.js classDiagram or graph showing dependencies between key files/modules.

**Output Format (JSON):**
{
  "pattern": "MVC",
  "quality": "good",
  "issues": ["Missing service layer", "Controllers too large"],
  "suggestions": ["Extract business logic to services", "Implement dependency injection"],
  "circularDependencies": [],
  "dependencyGraph": "graph TD;\\n  A[App] --> B[Service];\\n  B --> C[Model];"
}

Return ONLY the JSON object, no additional text.`;

        logger.info('Calling Groq API for architecture analysis...');
        const text = await callGroqAPI(prompt);
        logger.info('Received response from Groq API');

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            logger.warn('No valid JSON found in architecture analysis response');
            logger.warn('Response text:', text.substring(0, 200));
            return null;
        }

        const result = JSON.parse(jsonMatch[0]);
        logger.info('Successfully parsed architecture analysis');
        return result;

    } catch (error) {
        logger.error('Architecture analysis error:', error.message);
        logger.error('Error stack:', error.stack);
        return null;
    }
};

/**
 * Detect if code is AI generated
 */
export const detectAI = async (code, language) => {
    try {
        const prompt = `Evaluate the code based on these signals:

1. COMMENT STYLE:
   - Overly formal explanations
   - Generic comment phrasing
   - Uniform comment formatting

2. NAMING PATTERNS:
   - Very generic or template-like variable names:
     e.g., \`processData\`, \`handleRequest\`, \`result\`, \`output\`, \`fetchUserData\`
   - Consistent casing patterns AI commonly uses

3. STRUCTURE PATTERNS:
   - Perfect indentation throughout
   - Repetitive structure across functions
   - Functions that appear "too clean" or "too balanced"

4. COMPLEXITY & HUMAN SIGNATURES:
   - Lack of typos
   - Lack of inconsistencies
   - No dead code or partially-written ideas
   - No unnecessary micro-optimizations

5. REPETITION & TEMPLATE PATTERNS:
   - Function blocks look copied from template patterns
   - Boilerplate style repeated across different functions

6. AI MODEL SIGNATURE DETECTION:
   - ChatGPT-style: verbose comments, clean two-line spacing
   - Gemini-style: cleaner code, simpler comments
   - Copilot-style: short comments; predictable autocompletions
   - Llama/Coder: minimal comments, structured blocks

Analyze the following code:

### CODE START
${truncateText(code)}
### CODE END

Return ONLY the following JSON (strict format):

{
  "ai_probability": 0.0 to 1.0,
  "likely_source": "human" | "chatgpt" | "gemini" | "copilot" | "llama" | "unknown",
  "reasons": ["reason1", "reason2", ...],
  "chunk_size": ${code.length},
  "analysis_confidence": 0.0 to 1.0
}

Where:
- ai_probability = likelihood code is AI-generated
- likely_source = best guess of which AI model wrote it
- reasons = short explanations
- chunk_size = length of code you received
- analysis_confidence = how confident you are in this prediction

Do NOT include any text outside of the JSON.`;

        const text = await callGroqAPI(prompt);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            logger.warn('No valid JSON found in AI detection response');
            return null;
        }

        return JSON.parse(jsonMatch[0]);

    } catch (error) {
        logger.error('AI detection error:', error.message);
        return null;
    }
};

/**
 * Detect AI in a project (sampling strategy)
 */
export const detectProjectAI = async (files) => {
    try {
        // Filter for source code files
        const sourceFiles = files.filter(f =>
            ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs'].includes(f.extension)
        );

        if (sourceFiles.length === 0) {
            return null;
        }

        // Pick up to 5 random files for sampling
        const sampleSize = Math.min(sourceFiles.length, 5);
        const shuffled = sourceFiles.sort(() => 0.5 - Math.random());
        const sample = shuffled.slice(0, sampleSize);

        logger.info(`Running AI detection on ${sampleSize} files...`);

        const results = [];
        for (const file of sample) {
            const result = await detectAI(file.content, getLanguageFromExtension(file.extension));
            results.push(result);
            // Add small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Filter out null results
        const validResults = results.filter(r => r !== null);

        if (validResults.length === 0) return null;

        // Aggregate results
        const totalProb = validResults.reduce((sum, r) => sum + r.ai_probability, 0);
        const avgProb = totalProb / validResults.length;

        // Find most likely source
        const sources = {};
        validResults.forEach(r => {
            sources[r.likely_source] = (sources[r.likely_source] || 0) + 1;
        });
        const likelySource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0][0];

        // Aggregate reasons (take top 1 from each)
        const allReasons = validResults.flatMap(r => r.reasons.slice(0, 1));
        const uniqueReasons = [...new Set(allReasons)].slice(0, 5);

        return {
            ai_probability: avgProb,
            likely_source: likelySource,
            reasons: uniqueReasons,
            files_analyzed: sampleSize,
            analysis_confidence: validResults.reduce((sum, r) => sum + r.analysis_confidence, 0) / validResults.length
        };

    } catch (error) {
        logger.error('Project AI detection error:', error.message);
        return null;
    }
};
