import React, { useState } from 'react';
import { ChevronRight, MapPin, Utensils } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const OnboardingFlow = () => {
  const [step, setStep] = useState(0);

  const screens = [
    // Welcome Screen
    <div key="welcome" className="flex flex-col h-screen bg-gradient-to-b from-orange-100 to-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 bg-orange-500 rounded-full mb-8 flex items-center justify-center">
          <Utensils className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Welcome to HawkerGo</h1>
        <p className="text-gray-600 mb-8">
          Discover and enjoy the best hawker food Singapore has to offer
        </p>
        <Button 
          className="w-full" 
          onClick={() => setStep(1)}
        >
          Get Started
        </Button>
      </div>
    </div>,

    // Cuisine Preferences
    <div key="preferences" className="flex flex-col h-screen bg-white p-6">
      <h2 className="text-xl font-bold mb-6">Select Your Favorite Cuisines</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {['Chinese', 'Malay', 'Indian', 'Western', 'Thai', 'Japanese', 'Korean', 'Vietnamese'].map((cuisine) => (
          <Card key={cuisine} className="cursor-pointer hover:border-orange-500">
            <CardContent className="p-4 text-center">
              <span>{cuisine}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-auto">
        <Button 
          className="w-full" 
          onClick={() => setStep(2)}
        >
          Continue
        </Button>
      </div>
    </div>,

    // Dietary Preferences
    <div key="dietary" className="flex flex-col h-screen bg-white p-6">
      <h2 className="text-xl font-bold mb-6">Any Dietary Restrictions?</h2>
      <div className="space-y-4 mb-8">
        {['Vegetarian', 'Halal', 'No Seafood', 'Gluten Free', 'No Nuts', 'No Dairy'].map((diet) => (
          <Card key={diet} className="cursor-pointer hover:border-orange-500">
            <CardContent className="p-4 flex justify-between items-center">
              <span>{diet}</span>
              <input type="checkbox" className="h-4 w-4" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-auto">
        <Button 
          className="w-full" 
          onClick={() => setStep(3)}
        >
          Continue
        </Button>
      </div>
    </div>,

    // Location Permission
    <div key="location" className="flex flex-col h-screen bg-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full mb-8 flex items-center justify-center">
          <MapPin className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold mb-4">Enable Location Services</h2>
        <p className="text-gray-600 mb-8">
          Allow HawkerGo to access your location to find the nearest hawker centers
        </p>
        <div className="space-y-4 w-full">
          <Button 
            className="w-full"
            onClick={() => setStep(4)}
          >
            Enable Location
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setStep(4)}
          >
            Skip for Now
          </Button>
        </div>
      </div>
    </div>
  ];

  return screens[step];
};

export default OnboardingFlow;