import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';

interface ReportPageProps {
  params: Promise<{
    interviewId: string;
  }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { interviewId } = await params;

  // Mock data - replace with actual data fetching
  const reportData = {
    id: interviewId,
    date: new Date().toLocaleDateString(),
    duration: '45 minutes',
    type: 'Technical Interview',
    company: 'Tech Company',
    overallScore: 8.2,
    sections: [
      {
        name: 'Communication',
        score: 8.5,
        feedback: 'Excellent verbal communication and clear explanation of thought process.'
      },
      {
        name: 'Technical Skills',
        score: 7.8,
        feedback: 'Strong technical knowledge with room for improvement in optimization.'
      },
      {
        name: 'Problem Solving',
        score: 8.3,
        feedback: 'Great approach to breaking down complex problems systematically.'
      },
      {
        name: 'Cultural Fit',
        score: 8.2,
        feedback: 'Good alignment with company values and team collaboration skills.'
      }
    ],
    strengths: [
      'Clear and concise communication',
      'Strong problem-solving methodology',
      'Good understanding of system design principles',
      'Excellent time management during coding challenges'
    ],
    improvements: [
      'Practice more advanced algorithms and data structures',
      'Work on explaining complex concepts more simply',
      'Improve code optimization techniques',
      'Prepare more specific examples for behavioral questions'
    ],
    questions: [
      {
        question: 'Implement a function to reverse a linked list',
        answer: 'Provided iterative solution with O(n) time complexity',
        score: 8.0,
        feedback: 'Correct implementation, consider discussing recursive approach as well.'
      },
      {
        question: 'Describe a challenging project you worked on',
        answer: 'Discussed microservices migration project',
        score: 8.5,
        feedback: 'Great use of STAR method and quantifiable results.'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Interview Report</h1>
            <p className="text-gray-400">
              {reportData.type} • {reportData.date} • {reportData.duration}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-gray-600 text-gray-300">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Overall Score */}
        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Overall Performance</h2>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-semibold">Above Average</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-400 mb-1">
                {reportData.overallScore}/10
              </div>
              <Badge className="bg-purple-500/20 text-purple-300">
                Strong Performance
              </Badge>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Breakdown */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Performance Breakdown</h3>
              <div className="space-y-4">
                {reportData.sections.map((section, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">{section.name}</span>
                      <span className="text-white font-semibold">{section.score}/10</span>
                    </div>
                    <Progress 
                      value={section.score * 10} 
                      className="h-2 bg-gray-700"
                    />
                    <p className="text-sm text-gray-400 mt-1">{section.feedback}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Strengths</h3>
              <div className="space-y-2">
                {reportData.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{strength}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Areas for Improvement</h3>
              <div className="space-y-2">
                {reportData.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Brain className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{improvement}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Question Analysis</h3>
              <div className="space-y-4">
                {reportData.questions.map((q, index) => (
                  <div key={index} className="border-l-2 border-purple-500 pl-4">
                    <h4 className="text-white font-medium mb-1">{q.question}</h4>
                    <p className="text-gray-400 text-sm mb-2">{q.answer}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-400 font-semibold">{q.score}/10</span>
                      <span className="text-xs text-gray-500">{q.feedback}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6 mt-8">
          <h3 className="text-xl font-semibold text-white mb-4">Recommended Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/interview">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Practice Another Interview
              </Button>
            </Link>
            <Button variant="outline" className="w-full border-purple-500 text-purple-300">
              Review Learning Materials
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}