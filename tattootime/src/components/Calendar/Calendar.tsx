import React, { useEffect, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Paper, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, Chip, IconButton, Alert, Snackbar, TextField } from '@mui/material';
import { Theme } from '@mui/material/styles/index.js';
import { de } from 'date-fns/locale';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Add as AddIcon } from '@mui/icons-material';
import { getAppointments, getAppointmentsByDate, createAppointment } from '../../services/appointmentService';
import { Appointment, Slot } from '../../types';
import { getAvailableSlotsByDate } from '../../services/slotService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  isAdmin?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, isAdmin = false }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [clientNameInput, setClientNameInput] = useState('');
  const [clientEmailInput, setClientEmailInput] = useState('');
  const [freeDays, setFreeDays] = useState<Date[]>([]);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);

  const { currentUser, loading: authLoading } = useAuth();

  const functions = getFunctions();
  const bookSlotCallable = httpsCallable(functions, 'bookSlot');

  useEffect(() => {
    const fetchAppointments = async () => {
      if (authLoading || !currentUser) return;
      try {
        setLoading(true);
        const fetchedAppointments = await getAppointments();
        setAppointments(fetchedAppointments);
      } catch (err) {
        setError('Fehler beim Laden der Termine');
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [currentUser, authLoading]);

  const handleDateChange = async (date: Date | null) => {
    if (!date || authLoading || !currentUser) return;

    setSelectedDate(date);
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayAppointments = await getAppointmentsByDate(formattedDate);
      setSelectedAppointments(dayAppointments);

      if (!isAdmin) {
        const fetchedSlots = await getAvailableSlotsByDate(formattedDate);
        setAvailableSlots(fetchedSlots);
      }

      setDialogOpen(true);
      if (onDateSelect) {
        onDateSelect(date);
      }
    } catch (err: unknown) {
      setError('Fehler beim Laden der Termine für diesen Tag');
      console.error('Error fetching data for date:', err);
      const errorMessage = err instanceof Error ? err.message : 'Beim Laden der Daten ist ein Fehler aufgetreten.';
      setSnackbarMessage(`Fehler: ${errorMessage}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleBookSlot = async (slot: Slot, name: string, email: string) => {
    if (!currentUser) {
      setError('Sie müssen angemeldet sein, um einen Termin zu buchen.');
      setSnackbarMessage('Sie müssen angemeldet sein, um einen Termin zu buchen.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!name.trim()) {
      setError('Bitte geben Sie Ihren Namen ein.');
      setSnackbarMessage('Bitte geben Sie Ihren Namen ein.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      setSnackbarMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      if (!slot.id) {
        throw new Error('Slot ID is required for booking');
      }
      const result = await bookSlotCallable({
        slotId: slot.id,
        serviceType: slot.serviceType,
        clientName: name.trim(),
        clientEmail: email.trim(),
      });

      console.log('Book Slot Result:', result.data);
      setSnackbarMessage('Termin erfolgreich gebucht! Sie erhalten in Kürze eine Bestätigungs-E-Mail.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setClientNameInput('');
      setClientEmailInput('');

      await handleDateChange(selectedDate);
    } catch (err: unknown) {
      console.error('Error booking slot:', err);
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      
      if (err instanceof Error) {
        if (err.message?.includes('already-exists')) {
          errorMessage = 'Dieser Termin wurde bereits gebucht. Bitte wählen Sie einen anderen Termin.';
        } else if (err.message?.includes('unauthenticated')) {
          errorMessage = 'Sie müssen angemeldet sein, um einen Termin zu buchen.';
        } else if (err.message?.includes('not-found')) {
          errorMessage = 'Der ausgewählte Termin ist nicht mehr verfügbar.';
        }
      }

      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDialogOpen(false);
    }
  };

  // Freie Tage im aktuellen Monat berechnen
  useEffect(() => {
    if (!selectedDate) return;
    const getBookedDaysSet = () => {
      return new Set(appointments.map(a => format(parseISO(a.date), 'yyyy-MM-dd')));
    };
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const bookedDays = getBookedDaysSet();
    const free = daysInMonth.filter(day => !bookedDays.has(format(day, 'yyyy-MM-dd')));
    setFreeDays(free);
  }, [appointments, selectedDate]);

  // Handler für Klick auf freien Tag (im Kalender oder in der Liste)
  const handleFreeDayClick = (date: Date) => {
    setBookingDate(date);
    setBookingDialogOpen(true);
  };

  // Buchungsdialog schließen
  const handleBookingDialogClose = () => {
    setBookingDialogOpen(false);
    setBookingDate(null);
  };

  // Custom Day-Komponente für Admins: Gebuchte Tage farbig markieren
  const CustomDay = (props: PickersDayProps<Date>) => {
    const { day, ...other } = props;
    const isFree = freeDays.some(freeDay => isSameDay(freeDay, day));
    const isBooked = appointments.some(appointment => isSameDay(parseISO(appointment.date), day));
    return (
      <Box sx={{ position: 'relative', width: 36, height: 36 }} onClick={() => isAdmin || isFree ? handleFreeDayClick(day) : undefined}>
        {/* Farbpunkte für gebuchte Tage (nur für Admins) */}
        {isAdmin && isBooked && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: (theme: Theme) => theme.palette.primary.main,
              zIndex: 3,
            }}
          />
        )}
        {/* Punkt für freie Tage (nur für Nutzer) */}
        {!isAdmin && isFree && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'green',
              zIndex: 3,
            }}
          />
        )}
        <PickersDay day={day} {...other} />
      </Box>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto', my: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Termin Kalender
        </Typography>
      </Box>

      {/* Admin sieht den klassischen Kalender mit anklickbaren Tagen */}
      {isAdmin && (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
          <DatePicker
            openTo="day"
            views={['day', 'month', 'year']}
            value={selectedDate}
            onChange={handleDateChange}
            slots={{
              day: CustomDay,
            }}
            sx={{
              width: '100%',
            }}
          />
        </LocalizationProvider>
      )}

      {/* Normale Nutzer sehen nur die Liste der freien Tage */}
      {!isAdmin && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">Freie Tage im Monat:</Typography>
          {freeDays.length === 0 ? (
            <Typography variant="body2">Keine freien Tage in diesem Monat.</Typography>
          ) : (
            <List>
              {freeDays.map(day => (
                <ListItem key={format(day, 'yyyy-MM-dd')}>
                  <Button variant="outlined" onClick={() => handleFreeDayClick(day)}>
                    {format(day, 'dd.MM.yyyy')}
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Buchungsdialog für freie Tage */}
      <Dialog open={bookingDialogOpen} onClose={handleBookingDialogClose}>
        <DialogTitle>Buchungsanfrage für {bookingDate ? format(bookingDate, 'dd.MM.yyyy') : ''}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Ihr Name"
            type="text"
            fullWidth
            variant="outlined"
            value={clientNameInput}
            onChange={(e) => setClientNameInput(e.target.value)}
            required
            error={!clientNameInput.trim()}
            helperText={!clientNameInput.trim() ? 'Bitte geben Sie Ihren Namen ein' : ''}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Ihre E-Mail"
            type="email"
            fullWidth
            variant="outlined"
            value={clientEmailInput}
            onChange={(e) => setClientEmailInput(e.target.value)}
            required
            error={!clientEmailInput.trim() || !clientEmailInput.includes('@')}
            helperText={
              !clientEmailInput.trim() || !clientEmailInput.includes('@')
                ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
                : ''
            }
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBookingDialogClose}>Abbrechen</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!clientNameInput.trim() || !clientEmailInput.trim() || !clientEmailInput.includes('@')}
            onClick={async () => {
              if (!bookingDate) return;
              try {
                setLoading(true);
                await createAppointment({
                  date: format(bookingDate, 'yyyy-MM-dd'),
                  clientName: clientNameInput,
                  clientEmail: clientEmailInput,
                });
                setSnackbarMessage('Buchungsanfrage gesendet!');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setClientNameInput('');
                setClientEmailInput('');
                handleBookingDialogClose();
                // Termine neu laden
                const fetchedAppointments = await getAppointments();
                setAppointments(fetchedAppointments);
              } catch (err) {
                setSnackbarMessage('Fehler beim Senden der Buchungsanfrage.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
              } finally {
                setLoading(false);
              }
            }}
          >
            Anfrage senden
          </Button>
        </DialogActions>
      </Dialog>

      {/* Appointments/Slots Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Termine am {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : ''}
          {isAdmin && (
            <IconButton
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <AddIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Lade Daten...</Typography>
            </Box>
          ) : isAdmin ? (
            selectedAppointments.length > 0 ? (
              <List>
                {selectedAppointments.map((appointment) => (
                  <ListItem key={appointment.id} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={appointment.serviceType || 'Termin'}
                            size="small"
                            sx={{
                              backgroundColor: appointment.colorCode || 'transparent',
                              color: 'white',
                            }}
                          />
                          <Typography variant="subtitle1">
                            {appointment.time} - {appointment.clientName}
                          </Typography>
                        </Box>
                      }
                      secondary={appointment.service}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>Keine gebuchten Termine an diesem Tag</Typography>
            )
          ) : (
            availableSlots.length > 0 ? (
              <>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Verfügbare Termine:</Typography>
                <TextField
                  margin="dense"
                  label="Ihr Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  required
                  error={!clientNameInput.trim()}
                  helperText={!clientNameInput.trim() ? 'Bitte geben Sie Ihren Namen ein' : ''}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  label="Ihre E-Mail"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={clientEmailInput}
                  onChange={(e) => setClientEmailInput(e.target.value)}
                  required
                  error={!clientEmailInput.trim() || !clientEmailInput.includes('@')}
                  helperText={
                    !clientEmailInput.trim() || !clientEmailInput.includes('@')
                      ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
                      : ''
                  }
                  sx={{ mb: 2 }}
                />
                <List>
                  {availableSlots.map((slot) => (
                    <ListItem
                      key={slot.id}
                      divider
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <ListItemText
                        primary={`${slot.startTime} - ${slot.endTime}`}
                        secondary={slot.serviceType}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleBookSlot(slot, clientNameInput, clientEmailInput)}
                        disabled={loading || !clientNameInput.trim() || !clientEmailInput.trim() || !clientEmailInput.includes('@')}
                      >
                        Buchen
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Typography>Keine verfügbaren Termine an diesem Tag</Typography>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={!!error} onClose={handleCloseError}>
        <DialogTitle>Fehler</DialogTitle>
        <DialogContent>
          <Typography>{error}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseError}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Calendar; 