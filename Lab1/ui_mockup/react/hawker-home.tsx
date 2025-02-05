import React from 'react';
import { Bell, Search, MapPin, Users, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HomeScreen = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold">HawkerGo</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search hawker centers..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Active Queue Card (if exists) */}
      <div className="px-4 mb-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">In Queue: Maxwell Food Centre</h3>
                <p className="text-sm text-gray-600">Position: 3 • ~10 mins wait</p>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">Recommended For You</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">Old Airport Road Food Centre</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" /> 
                      <span>1.2 km away</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-green-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Low Crowd</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>Open</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto border-t bg-white">
        <div className="flex justify-around p-4">
          <Button variant="ghost" className="flex flex-col items-center">
            <MapPin className="h-5 w-5" />
            <span className="text-xs mt-1">Explore</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center">
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Queue</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center">
            <Bell className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;