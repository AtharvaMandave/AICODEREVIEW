import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Generate HTML report template
 */
const generateHTMLReport = (project, issues, scores, architecture) => {
    const issuesBySeverity = {
        high: issues.filter(i => i.severity === 'high'),
        medium: issues.filter(i => i.severity === 'medium'),
        low: issues.filter(i => i.severity === 'low')
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Code Quality Report - ${project.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      padding: 40px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #5b6ef5;
      padding-bottom: 30px;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 36px;
      color: #0d0d12;
      margin-bottom: 10px;
    }
    .header .subtitle {
      font-size: 18px;
      color: #64748b;
    }
    .meta {
      display: flex;
      gap: 30px;
      margin-bottom: 40px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
    }
    .meta-item {
      flex: 1;
    }
    .meta-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .meta-value {
      font-size: 20px;
      font-weight: 600;
      color: #0d0d12;
    }
    .scores {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .score-card {
      padding: 20px;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      text-align: center;
    }
    .score-card.overall {
      grid-column: span 3;
      background: linear-gradient(135deg, #5b6ef5, #7c3aed);
      color: white;
      border: none;
    }
    .score-label {
      font-size: 14px;
      margin-bottom: 10px;
      opacity: 0.8;
    }
    .score-value {
      font-size: 48px;
      font-weight: 700;
    }
    .score-card.overall .score-value {
      font-size: 64px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #0d0d12;
    }
    .issue {
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border-left: 4px solid;
    }
    .issue.high {
      background: #fef2f2;
      border-color: #ef4444;
    }
    .issue.medium {
      background: #fffbeb;
      border-color: #f59e0b;
    }
    .issue.low {
      background: #f0fdf4;
      border-color: #22c55e;
    }
    .issue-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .issue-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .issue-badge.high {
      background: #ef4444;
      color: white;
    }
    .issue-badge.medium {
      background: #f59e0b;
      color: white;
    }
    .issue-badge.low {
      background: #22c55e;
      color: white;
    }
    .issue-title {
      font-size: 16px;
      font-weight: 600;
      flex: 1;
    }
    .issue-meta {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 10px;
    }
    .issue-description {
      font-size: 14px;
      color: #475569;
      margin-bottom: 10px;
    }
    .issue-suggestion {
      font-size: 13px;
      color: #5b6ef5;
      background: #f1f5f9;
      padding: 10px;
      border-radius: 6px;
    }
    .architecture {
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 40px;
    }
    .architecture-quality {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .architecture-quality.excellent {
      background: #22c55e;
      color: white;
    }
    .architecture-quality.good {
      background: #3b82f6;
      color: white;
    }
    .architecture-quality.needs-improvement {
      background: #f59e0b;
      color: white;
    }
    .architecture-quality.poor {
      background: #ef4444;
      color: white;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }
    ul {
      margin-left: 20px;
      margin-top: 10px;
    }
    li {
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Code Quality Audit Report</h1>
    <div class="subtitle">${project.name}</div>
  </div>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Files Analyzed</div>
      <div class="meta-value">${project.fileCount || 0}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Total Lines</div>
      <div class="meta-value">${(project.totalLines || 0).toLocaleString()}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Issues Found</div>
      <div class="meta-value">${issues.length}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Analysis Date</div>
      <div class="meta-value">${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="scores">
    <div class="score-card overall">
      <div class="score-label">Overall Quality Score</div>
      <div class="score-value">${scores.overallScore}/100</div>
    </div>
    <div class="score-card">
      <div class="score-label">Maintainability</div>
      <div class="score-value">${scores.maintainabilityScore}</div>
    </div>
    <div class="score-card">
      <div class="score-label">Security</div>
      <div class="score-value">${scores.securityScore}</div>
    </div>
    <div class="score-card">
      <div class="score-label">Performance</div>
      <div class="score-value">${scores.performanceScore}</div>
    </div>
  </div>

  ${architecture ? `
  <div class="section">
    <h2 class="section-title">Architecture Analysis</h2>
    <div class="architecture">
      <div class="architecture-quality ${architecture.quality}">${architecture.quality.toUpperCase()}</div>
      <p><strong>Pattern:</strong> ${architecture.pattern}</p>
      ${architecture.issues && architecture.issues.length > 0 ? `
        <p style="margin-top: 15px;"><strong>Issues:</strong></p>
        <ul>
          ${architecture.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
      ` : ''}
      ${architecture.suggestions && architecture.suggestions.length > 0 ? `
        <p style="margin-top: 15px;"><strong>Suggestions:</strong></p>
        <ul>
          ${architecture.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">High Severity Issues (${issuesBySeverity.high.length})</h2>
    ${issuesBySeverity.high.slice(0, 10).map(issue => `
      <div class="issue high">
        <div class="issue-header">
          <span class="issue-badge high">HIGH</span>
          <span class="issue-title">${issue.title}</span>
        </div>
        <div class="issue-meta">📄 ${issue.filePath} ${issue.lineNumber ? `• Line ${issue.lineNumber.start}` : ''}</div>
        <div class="issue-description">${issue.description}</div>
        ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
      </div>
    `).join('')}
    ${issuesBySeverity.high.length > 10 ? `<p style="color: #64748b; margin-top: 10px;">... and ${issuesBySeverity.high.length - 10} more high severity issues</p>` : ''}
  </div>

  <div class="section">
    <h2 class="section-title">Medium Severity Issues (${issuesBySeverity.medium.length})</h2>
    ${issuesBySeverity.medium.slice(0, 5).map(issue => `
      <div class="issue medium">
        <div class="issue-header">
          <span class="issue-badge medium">MEDIUM</span>
          <span class="issue-title">${issue.title}</span>
        </div>
        <div class="issue-meta">📄 ${issue.filePath} ${issue.lineNumber ? `• Line ${issue.lineNumber.start}` : ''}</div>
        <div class="issue-description">${issue.description}</div>
        ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
      </div>
    `).join('')}
    ${issuesBySeverity.medium.length > 5 ? `<p style="color: #64748b; margin-top: 10px;">... and ${issuesBySeverity.medium.length - 5} more medium severity issues</p>` : ''}
  </div>

  <div class="footer">
    <p>Generated by AI Code Quality Auditor</p>
    <p>Powered by Static Analysis + Google Gemini AI</p>
  </div>
</body>
</html>
  `;
};

/**
 * Generate PDF report for a project
 */
export const generatePDFReport = async (projectId) => {
    let browser;

    try {
        logger.info(`Generating PDF report for project: ${projectId}`);

        // Import models dynamically to avoid circular dependencies
        const { default: Project } = await import('../models/Project.js');
        const { default: Issue } = await import('../models/Issue.js');
        const { default: Score } = await import('../models/Score.js');
        const { default: Analysis } = await import('../models/Analysis.js');

        // Fetch project data
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const issues = await Issue.find({ projectId }).sort({ severity: 1 });
        const scores = await Score.findOne({ projectId });
        const analysis = await Analysis.findOne({ projectId });

        // Generate HTML
        const html = generateHTMLReport(
            project,
            issues,
            scores || {},
            analysis?.architecture
        );

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();

        logger.info(`PDF report generated successfully for project: ${projectId}`);
        return pdfBuffer;

    } catch (error) {
        if (browser) {
            await browser.close();
        }
        logger.error('PDF generation error:', error);
        throw error;
    }
};
