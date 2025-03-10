'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      {/* Left side - Brand section with animated gradient background */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-teal-500 animate-pulse-subtle"></div>
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <radialGradient id="circles" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="20" cy="20" r="20" fill="url(#circles)" className="animate-float" style={{ animationDelay: '0s' }} />
            <circle cx="80" cy="30" r="15" fill="url(#circles)" className="animate-float" style={{ animationDelay: '1s' }} />
            <circle cx="40" cy="70" r="25" fill="url(#circles)" className="animate-float" style={{ animationDelay: '2s' }} />
            <circle cx="70" cy="80" r="10" fill="url(#circles)" className="animate-float" style={{ animationDelay: '3s' }} />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="max-w-md mx-auto">
            <div className="mb-8 flex items-center">
              <div className="mr-3 bg-white/20 p-2 rounded-lg">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L12 13L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 6H20V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 10H12V14H4V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold font-montserrat">CRM Suite</h1>
            </div>
            
            <h2 className="text-2xl font-semibold mb-6 font-montserrat">Streamline your customer relationships</h2>
            <p className="text-lg text-white/90 mb-8">
              Our intelligent CRM helps you manage leads, close deals, and build lasting customer relationships with ease.
            </p>
            
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 16L10.879 18.879C10.9505 18.9506 11.0355 19.0075 11.1294 19.0466C11.2233 19.0857 11.324 19.1061 11.4258 19.1061C11.5275 19.1061 11.6283 19.0857 11.7222 19.0466C11.8161 19.0075 11.9011 18.9506 11.9726 18.879L20 10.8284" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Smart Lead Management</h3>
                  <p className="text-white/80">Prioritize and nurture leads with AI-powered insights</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Unified Communications</h3>
                  <p className="text-white/80">Manage emails, calls, and meetings in one place</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 19V13C9 11.8954 8.10457 11 7 11H5C3.89543 11 3 11.8954 3 13V19C3 20.1046 3.89543 21 5 21H7C8.10457 21 9 20.1046 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 19V7C15 5.89543 14.1046 5 13 5H11C9.89543 5 9 5.89543 9 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 19V3C21 2.44772 20.5523 2 20 2H18C16.8954 2 16 2.89543 16 4V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Visual Sales Pipeline</h3>
                  <p className="text-white/80">Track deals with an intuitive drag-and-drop interface</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-white/70">Trusted by 1000+ businesses</div>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">
                      {['AB', 'CD', 'EF', 'GH'][i-1]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-scale-in">
          {children}
        </div>
      </div>
    </div>
  );
} 