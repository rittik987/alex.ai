'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, CheckCircle, XCircle, Clock, BookOpen, Send } from 'lucide-react';

const codeTemplates = {
  javascript: `function twoSum(nums, target) {
    // Your solution here
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    
    return [];
}

// Test your solution
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]`,
  python: `def two_sum(nums, target):
    """
    Find two numbers that add up to target
    """
    num_map = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    
    return []

# Test your solution
print(two_sum([2, 7, 11, 15], 9))  # Expected: [0, 1]`,
  java: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        Map<Integer, Integer> map = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        
        return new int[]{};
    }
    
    // Test your solution
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] result = sol.twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println(Arrays.toString(result)); // Expected: [0, 1]
    }
}`,
  cpp: `#include <vector>
#include <unordered_map>
#include <iostream>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your solution here
        unordered_map<int, int> map;
        
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        
        return {};
    }
};

// Test your solution
int main() {
    Solution sol;
    vector<int> nums = {2, 7, 11, 15};
    vector<int> result = sol.twoSum(nums, 9);
    // Expected: [0, 1]
    for (int i : result) {
        cout << i << " ";
    }
    return 0;
}`
};

interface CodeEditorProps {
  question?: string;
  onSubmitCode?: (code: string, language: string) => void;
}

export default function CodeEditor({ onSubmitCode }: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof codeTemplates>('javascript');
  const [code, setCode] = useState(codeTemplates.javascript);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const currentProblem = {
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      }
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "-10⁹ ≤ target ≤ 10⁹",
      "Only one valid answer exists."
    ]
  };

  const handleLanguageChange = (language: keyof typeof codeTemplates) => {
    setSelectedLanguage(language);
    setCode(codeTemplates[language]);
    setResults(null);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    
    // Simulate code execution
    setTimeout(() => {
      setResults({
        passed: 2,
        total: 3,
        testCases: [
          { input: "[2,7,11,15], 9", expected: "[0,1]", actual: "[0,1]", passed: true },
          { input: "[3,2,4], 6", expected: "[1,2]", actual: "[1,2]", passed: true },
          { input: "[3,3], 6", expected: "[0,1]", actual: "[0,1]", passed: false }
        ],
        runtime: "52 ms",
        memory: "42.3 MB"
      });
      setIsRunning(false);
    }, 2000);
  };

  const handleReset = () => {
    setCode(codeTemplates[selectedLanguage]);
    setResults(null);
  };

  const handleSubmitCode = () => {
    if (onSubmitCode) {
      onSubmitCode(code, selectedLanguage);
    }
  };

  const handleTeachMe = () => {
    // This will be implemented in a later phase
    console.log('Teach Me functionality will be implemented later');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Problem Description */}
      <Card className="bg-gray-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold text-white">{currentProblem.title}</h3>
          <Badge 
            className={`${
              currentProblem.difficulty === 'Easy' 
                ? 'bg-green-500/20 text-green-300' 
                : currentProblem.difficulty === 'Medium'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            {currentProblem.difficulty}
          </Badge>
        </div>
        
        <p className="text-gray-300 text-sm mb-3">{currentProblem.description}</p>
        
        <div className="space-y-2">
          <h4 className="text-white font-medium text-sm">Example:</h4>
          {currentProblem.examples.map((example, index) => (
            <div key={index} className="bg-gray-800/50 p-3 rounded text-sm">
              <div className="text-gray-300">
                <strong>Input:</strong> {example.input}
              </div>
              <div className="text-gray-300">
                <strong>Output:</strong> {example.output}
              </div>
              {example.explanation && (
                <div className="text-gray-400 mt-1">
                  <strong>Explanation:</strong> {example.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Code Editor Controls */}
      <div className="flex items-center justify-between">
        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTeachMe}
            className="border-gray-600 text-gray-300"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Teach Me
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-gray-600 text-gray-300"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1">
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-64 bg-gray-800 border-gray-600 text-gray-100 font-mono text-sm resize-none"
          placeholder="Write your solution here..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleRunCode}
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-700 flex-1"
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? 'Running...' : 'Run Code'}
        </Button>
        <Button
          onClick={handleSubmitCode}
          className="bg-purple-600 hover:bg-purple-700 flex-1"
        >
          <Send className="h-4 w-4 mr-2" />
          Submit to Alex
        </Button>
      </div>

      {/* Results */}
      {results && (
        <Card className="bg-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-white font-medium">Test Results</h4>
            <Badge className={`${
              results.passed === results.total 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              {results.passed}/{results.total} Passed
            </Badge>
          </div>
          
          <div className="space-y-2 mb-3">
            {results.testCases.map((testCase: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {testCase.passed ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span className="text-gray-300">
                  Test Case {index + 1}: {testCase.input}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Runtime: {results.runtime}
            </div>
            <div>Memory: {results.memory}</div>
          </div>
        </Card>
      )}
    </div>
  );
}