'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '../components/UploadZone';
import {
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  FileCode,
  GitBranch,
  ArrowRight,
  Code2,
  Check
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = (projectId) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">
              CodeAnalyzer
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/projects')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Projects
            </button>
            <a
              href="https://github.com/AtharvaMandave"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <GitBranch className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Analysis</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Analyze your code
                <span className="block text-blue-600">in seconds</span>
              </h1>

              <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Get instant AI-driven insights for your codebase. Detect bugs,
                security vulnerabilities, and architectural issues.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                {['Free to use', 'No signup required', 'Secure & private'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Upload Zone */}
            <div className="w-full">
              <UploadZone
                onUploadSuccess={handleUploadSuccess}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Everything you need for better code
            </h2>
            <p className="text-slate-600">
              Our analysis engine combines static code analysis with advanced AI
              to provide comprehensive feedback on your codebase.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Sparkles className="w-5 h-5" />}
              title="AI Deep Scan"
              description="Leverages Gemini 2.0 to understand code context, logic, and intent."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Security Analysis"
              description="Identifies OWASP Top 10 vulnerabilities and insecure patterns."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              title="Performance Issues"
              description="Detects N+1 queries, memory leaks, and optimization opportunities."
            />
            <FeatureCard
              icon={<GitBranch className="w-5 h-5" />}
              title="Architecture Review"
              description="Visualizes dependencies and evaluates design pattern usage."
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Quality Metrics"
              description="Get scores for maintainability, readability, and complexity."
            />
            <FeatureCard
              icon={<FileCode className="w-5 h-5" />}
              title="Refactoring Tips"
              description="Receive actionable suggestions to improve your code."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Ready to improve your code?
            </h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Upload your project now and get instant feedback from our AI-powered analysis engine.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Code2 className="w-4 h-4" />
            <span className="font-medium text-slate-700">CodeAnalyzer</span>
            <span>© 2025</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
