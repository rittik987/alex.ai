'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Brain, User, Briefcase, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createUserProfile } from '@/lib/supabase/auth';
import { toast } from 'sonner';

const personalDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  age: z.number().min(16, 'Age must be at least 16').max(100, 'Age must be less than 100'),
  gender: z.string().min(1, 'Please select a gender'),
  city: z.string().min(2, 'City must be at least 2 characters'),
});

const professionalDetailsSchema = z.object({
  field: z.enum(['Technical', 'Non-Technical']),
  branch: z.string().optional(),
});

type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;
type ProfessionalDetailsData = z.infer<typeof professionalDetailsSchema>;

const LoadingAnimation = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Brain className="h-6 w-6 text-purple-600 animate-pulse" />
      </div>
    </div>
    <div className="text-center">
      <h3 className="text-lg font-semibold text-white mb-2">Creating Your Profile</h3>
      <p className="text-gray-400">Setting up your personalized interview experience...</p>
    </div>
  </div>
);

export default function OnboardingPage() {
  const { user, refreshProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [personalData, setPersonalData] = useState<PersonalDetailsData | null>(null);

  const personalForm = useForm<PersonalDetailsData>({
    resolver: zodResolver(personalDetailsSchema),
  });

  const professionalForm = useForm<ProfessionalDetailsData>({
    resolver: zodResolver(professionalDetailsSchema),
  });

  // Redirect if not authenticated
  useEffect(() => {
    console.log('🎯 Onboarding: Auth state check:', { user: user?.email, authLoading });
    if (!authLoading && !user) {
      console.log('➡️ Onboarding: No user, redirecting to home');
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handlePersonalSubmit = (data: PersonalDetailsData) => {
    console.log('📝 Onboarding: Personal data submitted:', data);
    setPersonalData(data);
    setCurrentStep(2);
  };

  const handleProfessionalSubmit = async (data: ProfessionalDetailsData) => {
    if (!user || !personalData) {
      console.error('❌ Onboarding: Missing user or personal data');
      toast.error('Missing required data. Please try again.');
      return;
    }

    console.log('📝 Onboarding: Professional data submitted:', data);
    setIsLoading(true);

    try {
      const profileData = {
        id: user.id,
        full_name: personalData.fullName,
        age: personalData.age,
        gender: personalData.gender,
        city: personalData.city,
        field: data.field,
        branch: data.field === 'Technical' ? data.branch : undefined,
      };

      console.log('💾 Onboarding: Creating profile with data:', profileData);
      const profile = await createUserProfile(profileData);

      if (profile) {
        console.log('✅ Onboarding: Profile created successfully');
        toast.success('Profile created successfully!');
        
        // Refresh the profile in context
        console.log('🔄 Onboarding: Refreshing profile in context...');
        await refreshProfile();
        
        // Small delay to ensure profile is saved and context is updated
        setTimeout(() => {
          console.log('➡️ Onboarding: Redirecting to dashboard');
          router.push('/dashboard');
        }, 1500);
      } else {
        console.error('❌ Onboarding: Failed to create profile');
        toast.error('Failed to create profile. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('💥 Onboarding: Error creating profile:', error);
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const field = professionalForm.watch('field');

  if (authLoading) {
    console.log('⏳ Onboarding: Auth loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ Onboarding: No user found');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 p-8 w-full max-w-md">
          <LoadingAnimation />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">InterviewCracker AI</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">Help us personalize your interview preparation experience</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Step {currentStep} of 2</span>
            <span className="text-sm text-gray-400">{currentStep === 1 ? '50%' : '100%'}</span>
          </div>
          <Progress value={currentStep === 1 ? 50 : 100} className="h-2" />
        </div>

        <div className="max-w-md mx-auto">
          {currentStep === 1 && (
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Personal Details</h2>
              </div>

              <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    className="bg-gray-700 border-gray-600 text-white"
                    {...personalForm.register('fullName')}
                  />
                  {personalForm.formState.errors.fullName && (
                    <p className="text-red-400 text-sm">{personalForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-gray-300">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    className="bg-gray-700 border-gray-600 text-white"
                    {...personalForm.register('age', { valueAsNumber: true })}
                  />
                  {personalForm.formState.errors.age && (
                    <p className="text-red-400 text-sm">{personalForm.formState.errors.age.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Gender</Label>
                  <Select onValueChange={(value) => personalForm.setValue('gender', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {personalForm.formState.errors.gender && (
                    <p className="text-red-400 text-sm">{personalForm.formState.errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-300">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter your city"
                    className="bg-gray-700 border-gray-600 text-white"
                    {...personalForm.register('city')}
                  />
                  {personalForm.formState.errors.city && (
                    <p className="text-red-400 text-sm">{personalForm.formState.errors.city.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                  Continue
                </Button>
              </form>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Briefcase className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Professional Details</h2>
              </div>

              <form onSubmit={professionalForm.handleSubmit(handleProfessionalSubmit)} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-gray-300">Are you from a technical background?</Label>
                  <RadioGroup
                    onValueChange={(value) => professionalForm.setValue('field', value as 'Technical' | 'Non-Technical')}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Technical" id="technical" />
                      <Label htmlFor="technical" className="text-gray-300">Technical</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Non-Technical" id="non-technical" />
                      <Label htmlFor="non-technical" className="text-gray-300">Non-Technical</Label>
                    </div>
                  </RadioGroup>
                </div>

                {field === 'Technical' && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Select Your Branch</Label>
                    <Select onValueChange={(value) => professionalForm.setValue('branch', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Choose your engineering branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                        <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                        <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                        <SelectItem value="Electronics & Communication">Electronics & Communication</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border-gray-600 text-gray-300"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={!field || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}