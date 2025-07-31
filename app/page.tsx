import Link from 'next/link';
import { Terminal, Code, Zap, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Terminal className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            AgentsPod
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            A cloud development environment with VSCode and Claude Code CLI,
            ready in seconds
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/home">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                Get Started
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg" asChild>
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Code className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-xl">VSCode in Browser</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Full-featured VSCode editor accessible from any browser, with all your favorite extensions and themes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Terminal className="h-8 w-8 text-green-600" />
                <CardTitle className="text-xl">Claude Code CLI</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                AI-powered development assistant built right into your terminal for intelligent code assistance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Zap className="h-8 w-8 text-yellow-600" />
                <CardTitle className="text-xl">Instant Setup</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Launch your development environment in under 30 seconds. No configuration required.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to start coding?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            Launch your cloud development environment now
          </p>
          <Link href="/home">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
              Launch Environment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
