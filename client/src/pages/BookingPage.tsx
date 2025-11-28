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
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const utils = trpc.useUtils();
  const { data: timeSlots, isLoading } = trpc.timeSlots.listActive.useQuery({ location: selectedLocation });

  const bookingMutation = trpc.bookings.create.useMutation({
    onSuccess: () => {
      setBookingSuccess(true);
      utils.timeSlots.listActive.invalidate();
      setTimeout(() => {
        setIsBookingDialogOpen(false);
        setBookingSuccess(false);
        setSelectedSlot(null);
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
    setIsBookingDialogOpen(true);
    setBookingSuccess(false);
  };

  const handleSubmitBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    bookingMutation.mutate({
      timeSlotId: selectedSlot.id,
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
            />
          </div>
        )}

        {selectedSlot && (
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              {bookingSuccess ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <DialogTitle className="text-2xl mb-2">{t('bookingConfirmed')}</DialogTitle>
                  <DialogDescription className="text-base">
                    {t('bookingSuccess')}
                  </DialogDescription>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking}>
                  <DialogHeader>
                    <DialogTitle>{t('bookTimeSlotTitle')}</DialogTitle>
                    <DialogDescription>
                      {selectedSlot.title} - {new Date(selectedSlot.startTime).toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}
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
        )}
      </div>
    </div>
  );
}
