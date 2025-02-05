import React, { useState } from 'react';
import { Search, Filter, MapPin, Users, Clock, List, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";

const ExploreScreen = () => {
  const [viewMode, setViewMode] = useState('list');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white p-4 shadow-sm space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search hawker centers..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Distance</h3>
                  <div className="space-y-2">
                    {['Within 1km', 'Within 3km', 'Within 5km', 'Any distance'].map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Crowd Level</h3>
                  <div className="space-y-2">
                    {['Low', 'Moderate', 'High', 'Any'].map((level) => (
                      <Button
                        key={level}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Cuisine Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Chinese', 'Malay', 'Indian', 'Western', 'Thai', 'Japanese'].map((cuisine) => (
                      <Button
                        key={cuisine}
                        variant="outline"
                      >
                        {cuisine}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Price Range</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['$', '$$', '$$$', 'Any'].map((price) => (
                      <Button
                        key={price}
                        variant="outline"
                      >
                        {price}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Operating Hours</h3>
                  <div className="space-y-2">
                    {['Open Now', 'Open 24/7', 'All'].map((hours) => (
                      <Button
                        key={hours}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {hours}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <SheetFooter>
                <Button className="w-full">Apply Filters</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 justify-center">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="flex-1"
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button 
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            className="flex-1"
          >
            <Map className="h-4 w-4 mr-2" />
            Map
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">Maxwell Food Centre</h3>
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
      ) : (
        <div className="flex-1 bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <Map className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600">Map View</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreScreen;