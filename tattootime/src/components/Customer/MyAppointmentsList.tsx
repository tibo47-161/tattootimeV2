import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Typography, Button, Box, Chip } from '@mui/material';
import { getAppointmentsByUser, cancelAppointment } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { Appointment } from '../../types';

interface MyAppointmentsListProps {
  maxItems?: number;
}

const MyAppointmentsList: React.FC<MyAppointmentsListProps> = ({ maxItems }) => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser || !currentUser.id) return;
      setLoading(true);
      try {
        const data = await getAppointmentsByUser(currentUser.id);
        setAppointments(maxItems ? data.slice(0, maxItems) : data);
      } catch (err) {
        setError('Fehler beim Laden der Termine');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [currentUser, maxItems]);

  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Fehler beim Stornieren');
    }
  };

  if (!currentUser) return <Typography>Bitte einloggen.</Typography>;
  if (loading) return <Typography>Lade Termine...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (appointments.length === 0) return <Typography>Keine Termine gefunden.</Typography>;

  return (
    <List>
      {appointments.map((appt) => (
        <ListItem key={appt.id} divider>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Chip label={appt.status ?? 'angefragt'} size="small" color={appt.status === 'bestätigt' ? 'success' : appt.status === 'abgelehnt' ? 'error' : 'warning'} />
                <Typography variant="subtitle1">{appt.date} {appt.time ? `um ${appt.time}` : ''}</Typography>
                {appt.serviceType && <Typography variant="body2">({appt.serviceType})</Typography>}
              </Box>
            }
            secondary={appt.service || ''}
          />
          {(appt.status ?? 'angefragt') === 'angefragt' && typeof appt.id === 'string' && (
            <Button variant="outlined" color="error" onClick={() => handleCancel(appt.id as string)}>
              Stornieren
            </Button>
          )}
        </ListItem>
      ))}
    </List>
  );
};

export default MyAppointmentsList; 