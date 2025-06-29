'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-700/50" />
            <div>
              <Skeleton className="h-8 w-48 bg-gray-700/50" />
              <Skeleton className="h-4 w-36 mt-2 bg-gray-700/50" />
            </div>
          </div>
        </div>

        {/* Profile Summary Skeleton */}
        <Card className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 bg-gray-700/50" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-6 w-24 bg-gray-700/50" />
                <Skeleton className="h-6 w-24 bg-gray-700/50" />
                <Skeleton className="h-6 w-24 bg-gray-700/50" />
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Skeleton className="h-4 w-24 bg-gray-700/50" />
                  <Skeleton className="h-8 w-16 mt-2 bg-gray-700/50" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-gray-700/50" />
              </div>
              <Skeleton className="h-2 w-full bg-gray-700/50" />
            </Card>
          ))}
        </div>

        {/* Interview Mode Selection Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-6 bg-gray-700/50" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700 p-8">
                <div className="text-center space-y-4">
                  <Skeleton className="h-16 w-16 rounded-full mx-auto bg-gray-700/50" />
                  <div>
                    <Skeleton className="h-6 w-48 mx-auto bg-gray-700/50" />
                    <Skeleton className="h-4 w-full mt-2 bg-gray-700/50" />
                    <Skeleton className="h-4 w-3/4 mt-1 mx-auto bg-gray-700/50" />
                  </div>
                  <Skeleton className="h-10 w-48 mx-auto bg-gray-700/50" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Carousel Skeleton */}
        <div className="mb-12">
          <Skeleton className="h-8 w-48 mb-6 bg-gray-700/50" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700 p-6">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-12 rounded-lg bg-gray-700/50" />
                  <div>
                    <Skeleton className="h-6 w-3/4 bg-gray-700/50" />
                    <Skeleton className="h-4 w-full mt-2 bg-gray-700/50" />
                    <Skeleton className="h-4 w-5/6 mt-1 bg-gray-700/50" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Activity and Sidebar Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <Skeleton className="h-6 w-48 mb-6 bg-gray-700/50" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg bg-gray-700/20">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full bg-gray-700/50" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 bg-gray-700/50" />
                        <Skeleton className="h-4 w-1/4 mt-2 bg-gray-700/50" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700 p-6">
                <Skeleton className="h-6 w-36 mb-4 bg-gray-700/50" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-gray-700/50" />
                  <Skeleton className="h-4 w-5/6 bg-gray-700/50" />
                  <Skeleton className="h-4 w-4/6 bg-gray-700/50" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
