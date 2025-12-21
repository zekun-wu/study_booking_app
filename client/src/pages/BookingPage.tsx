import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, Globe, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CalendarView from "@/components/CalendarView";

export default function BookingPage() {
  const { language, setLanguage, t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<string>("Saarland");
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]); // Multiple slots
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [assignedSlot, setAssignedSlot] = useState<any>(null); // The final assigned slot

  const utils = trpc.useUtils();
  const { data: timeSlots, isLoading } = trpc.timeSlots.listActive.useQuery({ location: selectedLocation });

  const bookingMutation = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      setAssignedSlot(data.assignedSlot);
      setBookingSuccess(true);
      utils.timeSlots.listActive.invalidate();
      setTimeout(() => {
        setIsBookingDialogOpen(false);
        setBookingSuccess(false);
        setSelectedSlots([]);
        setAssignedSlot(null);
      }, 5000); // Show success for 5 seconds
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSlotClick = (slot: any) => {
    // Toggle slot selection (max 3)
    setSelectedSlots(prev => {
      const isSelected = prev.some(s => s.id === slot.id);
      if (isSelected) {
        // Deselect
        return prev.filter(s => s.id !== slot.id);
      } else {
        // Select (max 3)
        if (prev.length >= 3) {
          toast.error(language === 'en' ? 'You can select up to 3 time slots' : 'Sie können bis zu 3 Zeitfenster auswählen');
          return prev;
        }
        return [...prev, slot];
      }
    });
  };
  
  const handleOpenBookingDialog = () => {
    if (selectedSlots.length === 0) {
      toast.error(language === 'en' ? 'Please select at least one time slot' : 'Bitte wählen Sie mindestens ein Zeitfenster aus');
      return;
    }
    setIsBookingDialogOpen(true);
    setBookingSuccess(false);
  };

  const handleSubmitBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    bookingMutation.mutate({
      timeSlotIds: selectedSlots.map(s => s.id),
      parentName: formData.get("parentName") as string,
      childName: formData.get("childName") as string,
      childAge: parseInt(formData.get("childAge") as string),
      userEmail: formData.get("userEmail") as string,
      userPhone: formData.get("userPhone") as string,
      notes: formData.get("notes") as string,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('bookYourTimeSlot')}</h1>
          <div className="flex gap-2">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              EN
            </Button>
            <Button
              variant={language === 'de' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('de')}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              DE
            </Button>
          </div>
        </div>

        {/* Booking Limit Notice */}
        <div className="max-w-2xl mx-auto mb-6 p-6 bg-amber-50 border-2 border-amber-500 rounded-lg">
          <h2 className="text-xl font-bold text-amber-900 mb-2">
            {language === 'en' ? '⚠️ Important Notice' : '⚠️ Wichtiger Hinweis'}
          </h2>
          <p className="text-base text-amber-800 font-semibold">
            {language === 'en' ? (
              <span>
                Please choose <strong>up to 3 available time slots</strong>. 
                We will reach you shortly with email to confirm the final time.
              </span>
            ) : (
              <span>
                Bitte wählen Sie <strong>bis zu 3 verfügbare Zeitfenster</strong>. 
                Wir werden Sie in Kürze per E-Mail kontaktieren, um die endgültige Zeit zu bestätigen.
              </span>
            )}
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8 p-6 bg-blue-50 border-2 border-blue-500 rounded-lg">
          <Label htmlFor="location" className="text-xl font-bold mb-3 block text-blue-900">
            <MapPin className="inline h-6 w-6 mr-2" />
            {t('selectLocation')}
          </Label>
          <p className="text-base font-bold text-blue-800 mb-4">
            {language === 'en' ? (
              <span>⚠️ Please choose your preferred location: <strong className="text-blue-900">Saarland</strong> OR <strong className="text-blue-900">IWM</strong></span>
            ) : (
              <span>⚠️ Bitte wählen Sie Ihren bevorzugten Standort: <strong className="text-blue-900">Saarland</strong> ODER <strong className="text-blue-900">IWM</strong></span>
            )}
          </p>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger id="location" className="w-full text-lg font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Saarland" className="text-lg">{t('saarland')}</SelectItem>
              <SelectItem value="IWM" className="text-lg">{t('iwm')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <CalendarView
              timeSlots={timeSlots || []}
              onSlotClick={handleSlotClick}
              showLocation={false}
              selectedSlots={selectedSlots}
            />
          </div>
        )}

        {/* Show selected slots count and confirm button */}
        {selectedSlots.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white rounded-lg shadow-2xl p-4 border-2 border-primary">
              <p className="text-center font-semibold mb-2">
                {language === 'en' ? `${selectedSlots.length} slot(s) selected` : `${selectedSlots.length} Zeitfenster ausgewählt`}
              </p>
              <Button onClick={handleOpenBookingDialog} size="lg" className="w-full">
                {language === 'en' ? 'Continue to Booking' : 'Weiter zur Buchung'}
              </Button>
            </div>
          </div>
        )}

        {selectedSlots.length > 0 && (
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
            {bookingSuccess && assignedSlot ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <DialogTitle className="text-2xl mb-2">
                  {language === 'en' ? 'Booking Confirmed!' : 'Buchung bestätigt!'}
                </DialogTitle>
                <DialogDescription className="text-base space-y-2">
                  <p className="font-semibold text-lg text-gray-900">
                    {language === 'en' ? 'Your confirmed time slot:' : 'Ihr bestätigtes Zeitfenster:'}
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-bold text-green-900">{assignedSlot.location}</p>
                    <p className="text-green-800">
                      {new Date(assignedSlot.startTime).toLocaleString(language === 'de' ? 'de-DE' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    {language === 'en' 
                      ? 'A confirmation email has been sent to your email address.' 
                      : 'Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet.'}
                  </p>
                </DialogDescription>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking}>
                  <DialogHeader>
                    <DialogTitle>{t('bookTimeSlotTitle')}</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-2 mt-2">
                        <p className="font-semibold">
                          {language === 'en' ? 'Selected time slots:' : 'Ausgewählte Zeitfenster:'}
                        </p>
                        {selectedSlots.map((slot, idx) => (
                          <div key={slot.id} className="text-sm bg-blue-50 p-2 rounded">
                            {idx + 1}. {slot.title} - {new Date(slot.startTime).toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}
                          </div>
                        ))}
                        <p className="text-xs text-gray-600 mt-2">
                          {language === 'en' 
                            ? 'We will assign you the earliest available slot from your selection.' 
                            : 'Wir werden Ihnen das früheste verfügbare Zeitfenster aus Ihrer Auswahl zuweisen.'}
                        </p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="parentName">
                        {t('parentName')} <span className="text-red-500">{t('required')}</span>
                      </Label>
                      <Input 
                        id="parentName" 
                        name="parentName" 
                        placeholder={t('parentNamePlaceholder')}
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="childName">
                        {t('childName')} <span className="text-red-500">{t('required')}</span>
                      </Label>
                      <Input 
                        id="childName" 
                        name="childName" 
                        placeholder={t('childNamePlaceholder')}
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="childAge">
                        {t('childAge')} <span className="text-red-500">{t('required')}</span>
                      </Label>
                      <Input 
                        id="childAge" 
                        name="childAge" 
                        type="number"
                        min="1"
                        max="18"
                        placeholder={t('childAgePlaceholder')}
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="userEmail">
                        {t('email')} <span className="text-red-500">{t('required')}</span>
                      </Label>
                      <Input 
                        id="userEmail" 
                        name="userEmail" 
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="userPhone">{t('phone')}</Label>
                      <Input 
                        id="userPhone" 
                        name="userPhone" 
                        type="tel"
                        placeholder={t('phonePlaceholder')}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">{t('notesOptional')}</Label>
                      <Textarea 
                        id="notes" 
                        name="notes" 
                        placeholder={t('notesPlaceholder')}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsBookingDialogOpen(false)}
                      disabled={bookingMutation.isPending}
                    >
                      {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={bookingMutation.isPending}>
                      {bookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('confirmBooking')}
                    </Button>
                  </DialogFooter>
                </form>
              )}
              </DialogContent>
            </Dialog>
          )
        }
      </div>
    </div>
  );
}
