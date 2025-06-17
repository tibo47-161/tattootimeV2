import React, { useEffect, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers';
import { Paper, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, Chip, IconButton, Alert, Snackbar } from '@mui/material';
import { Theme } from '@mui/material/styles/index.js';
import { de } from 'date-fns/locale';
import { format, parseISO, isSameDay } from 'date-fns';
import { Add as AddIcon } from '@mui/icons-material';
import { getAppointments, getAppointmentsByDate } from '../../services/appointmentService';
import { Appointment } from '../../types';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  isAdmin?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, isAdmin = false }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAppointmentDialogOpen, setNewAppointmentDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
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
  }, []);

  const handleDateChange = async (date: Date | null) => {
    if (!date) return;

    setSelectedDate(date);
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayAppointments = await getAppointmentsByDate(formattedDate);
      setSelectedAppointments(dayAppointments);
      setDialogOpen(true);
      if (onDateSelect) {
        onDateSelect(date);
      }
    } catch (err) {
      setError('Fehler beim Laden der Termine für diesen Tag');
      console.error('Error fetching appointments for date:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleNewAppointment = () => {
    setNewAppointmentDialogOpen(true);
  };

  const handleCloseNewAppointmentDialog = () => {
    setNewAppointmentDialogOpen(false);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto', my: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Termin Kalender
        </Typography>
      </Box>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
        <DateCalendar
          value={selectedDate}
          onChange={handleDateChange}
          loading={loading}
          sx={{
            width: '100%',
            '& .MuiPickersCalendarHeader-root': {
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: 1,
            },
            '& .MuiPickersDay-root.Mui-selected': {
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
            '& .MuiPickersDay-root': {
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: (theme: Theme) => {
                  const day = theme.palette.mode === 'dark' ? 'white' : 'black';
                  return appointments.some(appointment => 
                    isSameDay(parseISO(appointment.date), new Date(day))
                  ) ? 'primary.main' : 'transparent';
                },
              },
            },
          }}
        />
      </LocalizationProvider>

      {/* Appointments Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Termine am {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : ''}
          {isAdmin && (
            <IconButton
              onClick={handleNewAppointment}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <AddIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Typography>Lade Termine...</Typography>
          ) : selectedAppointments.length > 0 ? (
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
            <Typography>Keine Termine an diesem Tag</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={newAppointmentDialogOpen} onClose={handleCloseNewAppointmentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Neuen Termin erstellen</DialogTitle>
        <DialogContent>
          {/* Add your appointment form here */}
          <Typography>Termin-Formular wird hier angezeigt</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewAppointmentDialog}>Abbrechen</Button>
          <Button onClick={handleCloseNewAppointmentDialog} variant="contained" color="primary">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Calendar; 