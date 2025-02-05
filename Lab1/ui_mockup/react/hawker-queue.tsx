import React from 'react';
import { Clock, Users, X, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const QueueScreen = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Active Queue */}
      <div className="bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold mb-4">Current Queue</h1>
        <Card className="bg-blue-50 border-blue-200 mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">Lao Ban Soya Beancurd</h3>
                <p className="text-sm text-gray-600">Old Airport Road Food Centre</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Position: 3/12</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">~10 mins</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Almost your turn!</AlertTitle>
              <AlertDescription>
                Please head to the stall in the next 5 minutes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Queue History */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">Recent Queues</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Hill Street Tai Hwa Pork Noodle</h3>
                    <p className="text-sm text-gray-600">Crawford Lane</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Yesterday • 25 min wait</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Join Queue Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-end">
        <div className="bg-white w-full p-4 rounded-t-xl">
          <h2 className="text-lg font-semibold mb-4">Join Queue</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Number of People</label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    className="flex-1"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
            
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Current Queue</span>
                  <span className="font-medium">12 people</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Wait</span>
                  <span className="font-medium">25-30 mins</span>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll receive a notification when it's almost your turn.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button className="w-full">Confirm & Join Queue</Button>
              <Button variant="ghost" className="w-full">Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueScreen;