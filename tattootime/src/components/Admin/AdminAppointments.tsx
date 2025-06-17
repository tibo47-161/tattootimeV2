import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Appointment } from '../../types';

interface AdminAppointmentsProps {
  currentUserId: string;
}

const AdminAppointments: React.FC<AdminAppointmentsProps> = ({ currentUserId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [open, setOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Omit<Appointment, 'id' | 'userId'>>({
    date: '',
    time: '',
    clientName: '',
    service: '',
  });

  const appointmentsCollectionRef = collection(db, 'appointments');

  const getAppointments = async () => {
    const data = await getDocs(appointmentsCollectionRef);
    setAppointments(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Appointment[]);
  };

  useEffect(() => {
    getAppointments();
  }, []);

  const handleOpen = (appointment?: Appointment) => {
    setOpen(true);
    if (appointment) {
      setCurrentAppointment(appointment);
      setFormData({
        date: appointment.date,
        time: appointment.time,
        clientName: appointment.clientName,
        service: appointment.service,
      });
    } else {
      setCurrentAppointment(null);
      setFormData({
        date: '',
        time: '',
        clientName: '',
        service: '',
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentAppointment(null);
    setFormData({
      date: '',
      time: '',
      clientName: '',
      service: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (currentAppointment) {
      // Update appointment
      const appointmentDoc = doc(db, 'appointments', currentAppointment.id!);
      await updateDoc(appointmentDoc, formData);
    } else {
      // Add new appointment
      await addDoc(appointmentsCollectionRef, { ...formData, userId: currentUserId }); 
    }
    getAppointments();
    handleClose();
  };

  const deleteAppointment = async (id: string) => {
    const appointmentDoc = doc(db, 'appointments', id);
    await deleteDoc(appointmentDoc);
    getAppointments();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Alle Termine</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        Neuen Termin hinzufügen
      </Button>

      <List>
        {appointments.map((appointment) => (
          <ListItem key={appointment.id} divider>
            <ListItemText
              primary={`Datum: ${appointment.date}, Uhrzeit: ${appointment.time}`}
              secondary={`Kunde: ${appointment.clientName}, Service: ${appointment.service}`}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(appointment)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => deleteAppointment(appointment.id!)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{currentAppointment ? 'Termin bearbeiten' : 'Neuen Termin hinzufügen'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="date"
            label="Datum"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.date}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="time"
            label="Uhrzeit"
            type="time"
            fullWidth
            variant="outlined"
            value={formData.time}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="clientName"
            label="Kundenname"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.clientName}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="service"
            label="Service"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.service}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Abbrechen</Button>
          <Button onClick={handleSubmit}>{currentAppointment ? 'Speichern' : 'Hinzufügen'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAppointments; 