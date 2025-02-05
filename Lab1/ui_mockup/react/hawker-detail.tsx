import React, { useState } from 'react';
import { ArrowLeft, MapPin, Clock, Users, Navigation2, Heart } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HawkerDetailScreen = () => {
  const [activeTab, setActiveTab] = useState('stalls');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="relative h-48">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <Button variant="ghost" className="text-white" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <img 
          src="/api/placeholder/400/200" 
          alt="Hawker Center"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title Section */}
      <div className="p-4 bg-white shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">Old Airport Road Food Centre</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <MapPin className="h-4 w-4" />
              <span>51 Old Airport Road</span>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1 text-green-600">
            <Users className="h-4 w-4" />
            <span className="text-sm">Low Crowd</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Open until 10 PM</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button className="flex-1">
            <Navigation2 className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
          <Button variant="outline" className="flex-1">View Menu</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stalls" className="w-full">
        <div className="bg-white px-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="stalls">Stalls</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stalls" className="p-4 m-0">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Lao Ban Soya Beancurd #{i}</h3>
                      <p className="text-sm text-gray-600 mt-1">Desserts • $2-5</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="text-yellow-400 text-sm">★ 4.5</div>
                        <div className="text-sm text-gray-600">(1.2k reviews)</div>
                      </div>
                    </div>
                    <Button>Join Queue</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="p-4 m-0">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                    <div>
                      <div className="font-medium">User #{i}</div>
                      <div className="text-sm text-gray-600">2 days ago</div>
                    </div>
                  </div>
                  <div className="text-yellow-400 mb-2">★★★★☆</div>
                  <p className="text-sm text-gray-700">
                    Great variety of food at reasonable prices. The atmosphere is authentic
                    and the food is delicious. Must try the local favorites!
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="info" className="p-4 m-0">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Opening Hours</h3>
                <p className="text-sm text-gray-600">
                  Monday - Sunday: 6:00 AM - 10:00 PM
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Facilities</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Public Restrooms</li>
                  <li>• Wheelchair Accessible</li>
                  <li>• Free Parking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HawkerDetailScreen;