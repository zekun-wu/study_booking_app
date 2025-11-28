import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, LogOut, BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import CalendarView from "@/components/CalendarView";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);
  const [viewingBookings, setViewingBookings] = useState(false);
  const [selectedSlotForBookings, setSelectedSlotForBookings] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: timeSlots, isLoading: slotsLoading } = trpc.timeSlots.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: bookings } = trpc.bookings.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createMutation = trpc.timeSlots.create.useMutation({
    onSuccess: () => {
      toast.success("Time slot created successfully");
      setIsCreateDialogOpen(false);
      utils.timeSlots.listAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.timeSlots.update.useMutation({
    onSuccess: () => {
      toast.success("Time slot updated successfully");
      setIsEditDialogOpen(false);
      setEditingSlot(null);
      utils.timeSlots.listAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.timeSlots.delete.useMutation({
    onSuccess: () => {
      toast.success("Time slot deleted successfully");
      utils.timeSlots.listAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const clearBookingsMutation = trpc.bookings.clearByTimeSlot.useMutation({
    onSuccess: () => {
      toast.success("All bookings cleared successfully");
      utils.timeSlots.listAll.invalidate();
      utils.bookings.listAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteBookingMutation = trpc.bookings.deleteBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking deleted successfully");
      utils.timeSlots.listAll.invalidate();
      utils.bookings.listAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Please log in to access the admin dashboard.</p>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">You do not have permission to access this page.</p>
            <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("startDate") as string;
    const startTime = formData.get("startTime") as string;
    const endDate = formData.get("endDate") as string;
    const endTime = formData.get("endTime") as string;

    createMutation.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      startTime: new Date(`${startDate}T${startTime}`).getTime(),
      endTime: new Date(`${endDate}T${endTime}`).getTime(),
      maxBookings: parseInt(formData.get("maxBookings") as string),
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("startDate") as string;
    const startTime = formData.get("startTime") as string;
    const endDate = formData.get("endDate") as string;
    const endTime = formData.get("endTime") as string;

    updateMutation.mutate({
      id: editingSlot.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      startTime: new Date(`${startDate}T${startTime}`).getTime(),
      endTime: new Date(`${endDate}T${endTime}`).getTime(),
      maxBookings: parseInt(formData.get("maxBookings") as string),
      isActive: parseInt(formData.get("isActive") as string),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this time slot?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleEdit = (slot: any) => {
    setEditingSlot(slot);
    setIsEditDialogOpen(true);
  };

  const handleSlotClick = (slot: any) => {
    handleEdit(slot);
  };

  const totalSlots = timeSlots?.length || 0;
  const totalBookings = bookings?.length || 0;
  const saarlandSlots = timeSlots?.filter(s => s.location === 'Saarland').length || 0;
  const iwmSlots = timeSlots?.filter(s => s.location === 'IWM').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name || user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showStats ? 'Hide' : 'Show'} Stats
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSlots}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBookings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Saarland Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{saarlandSlots}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">IWM Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{iwmSlots}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle>Create New Time Slot</DialogTitle>
                  <DialogDescription>Add a new time slot for bookings</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <select 
                      id="location" 
                      name="location" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      required
                    >
                      <option value="Saarland">Saarland</option>
                      <option value="IWM">IWM</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input id="startTime" name="startTime" type="time" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input id="endDate" name="endDate" type="date" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" name="endTime" type="time" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxBookings">Max Bookings</Label>
                    <Input id="maxBookings" name="maxBookings" type="number" min="1" defaultValue="1" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {slotsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <CalendarView
              timeSlots={timeSlots || []}
              onSlotClick={handleSlotClick}
              showLocation={true}
            />
          </div>
        )}

        {editingSlot && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleEditSubmit}>
                <DialogHeader>
                  <DialogTitle>Edit Time Slot</DialogTitle>
                  <DialogDescription>Update time slot details</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input id="edit-title" name="title" defaultValue={editingSlot.title} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea id="edit-description" name="description" defaultValue={editingSlot.description || ""} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <select 
                      id="edit-location" 
                      name="location" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      defaultValue={editingSlot.location}
                      required
                    >
                      <option value="Saarland">Saarland</option>
                      <option value="IWM">IWM</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-startDate">Start Date</Label>
                      <Input 
                        id="edit-startDate" 
                        name="startDate" 
                        type="date" 
                        defaultValue={new Date(editingSlot.startTime).toISOString().split('T')[0]}
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-startTime">Start Time</Label>
                      <Input 
                        id="edit-startTime" 
                        name="startTime" 
                        type="time" 
                        defaultValue={new Date(editingSlot.startTime).toTimeString().slice(0, 5)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-endDate">End Date</Label>
                      <Input 
                        id="edit-endDate" 
                        name="endDate" 
                        type="date" 
                        defaultValue={new Date(editingSlot.endTime).toISOString().split('T')[0]}
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-endTime">End Time</Label>
                      <Input 
                        id="edit-endTime" 
                        name="endTime" 
                        type="time" 
                        defaultValue={new Date(editingSlot.endTime).toTimeString().slice(0, 5)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-maxBookings">Max Bookings</Label>
                    <Input 
                      id="edit-maxBookings" 
                      name="maxBookings" 
                      type="number" 
                      min="1" 
                      defaultValue={editingSlot.maxBookings}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-isActive">Status</Label>
                    <select 
                      id="edit-isActive" 
                      name="isActive" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      defaultValue={editingSlot.isActive.toString()}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
                <DialogFooter className="gap-2 flex-wrap">
                  <div className="flex gap-2 flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedSlotForBookings(editingSlot);
                        setViewingBookings(true);
                        setIsEditDialogOpen(false);
                      }}
                      disabled={editingSlot.currentBookings === 0}
                    >
                      View Bookings ({editingSlot.currentBookings})
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        if (confirm(`Are you sure you want to clear ALL ${editingSlot.currentBookings} booking(s) for this time slot?`)) {
                          clearBookingsMutation.mutate({ timeSlotId: editingSlot.id });
                          setIsEditDialogOpen(false);
                        }
                      }}
                      disabled={clearBookingsMutation.isPending || editingSlot.currentBookings === 0}
                    >
                      {clearBookingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Clear All ({editingSlot.currentBookings})
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => {
                        handleDelete(editingSlot.id);
                        setIsEditDialogOpen(false);
                      }}
                    >
                      Delete Slot
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Bookings List Dialog */}
        {selectedSlotForBookings && (
          <Dialog open={viewingBookings} onOpenChange={setViewingBookings}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bookings for {selectedSlotForBookings.title}</DialogTitle>
                <DialogDescription>
                  {new Date(selectedSlotForBookings.startTime).toLocaleString()} - {new Date(selectedSlotForBookings.endTime).toLocaleTimeString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {bookings
                  ?.filter(b => b.timeSlotId === selectedSlotForBookings.id)
                  .map((booking) => (
                    <Card key={booking.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div>
                            <strong>Parent:</strong> {booking.parentName}
                          </div>
                          <div>
                            <strong>Child:</strong> {booking.childName} (Age: {booking.childAge})
                          </div>
                          <div>
                            <strong>Email:</strong> {booking.userEmail}
                          </div>
                          {booking.userPhone && (
                            <div>
                              <strong>Phone:</strong> {booking.userPhone}
                            </div>
                          )}
                          {booking.notes && (
                            <div>
                              <strong>Notes:</strong> {booking.notes}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            Booked: {new Date(booking.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete booking for ${booking.parentName}?`)) {
                              deleteBookingMutation.mutate({
                                bookingId: booking.id,
                                timeSlotId: selectedSlotForBookings.id,
                              });
                            }
                          }}
                          disabled={deleteBookingMutation.isPending}
                        >
                          {deleteBookingMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                {bookings?.filter(b => b.timeSlotId === selectedSlotForBookings.id).length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No bookings for this time slot
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setViewingBookings(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
