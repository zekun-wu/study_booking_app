import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Shield, QrCode } from "lucide-react";
import { APP_TITLE } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <QrCode className="h-16 w-16 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            QR Time Slot Booking
          </h1>
          <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
            Simple and efficient time slot management with QR code access
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-8 w-8 text-indigo-600" />
                <CardTitle className="text-2xl">Book a Time Slot</CardTitle>
              </div>
              <CardDescription className="text-base">
                Browse available time slots and book the one that fits your schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setLocation("/book")}
              >
                View Available Slots
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-purple-600" />
                <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              </div>
              <CardDescription className="text-base">
                Manage time slots, view bookings, and control availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                variant="outline"
                onClick={() => setLocation("/admin")}
              >
                {isAuthenticated && user?.role === 'admin' ? 'Go to Dashboard' : 'Admin Login'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-center">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Scan QR Code</h3>
                    <p className="text-gray-600">Users scan the QR code to access the booking page instantly</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Choose Time Slot</h3>
                    <p className="text-gray-600">Browse available time slots and select the one that works best</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Confirm Booking</h3>
                    <p className="text-gray-600">Fill in your details and confirm the booking in seconds</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
