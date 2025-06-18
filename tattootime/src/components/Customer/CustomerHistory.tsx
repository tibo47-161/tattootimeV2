import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  History as HistoryIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  Event as EventIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { CustomerHistory as CustomerHistoryType } from '../../types';

interface CustomerHistoryProps {
  userId?: string;
}

const CustomerHistory: React.FC<CustomerHistoryProps> = ({
  userId
}) => {
  const { currentUser } = useAuth();

  // State
  const [history, setHistory] = useState<CustomerHistoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const targetUserId = userId || currentUser?.id;

  const loadCustomerHistory = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      // This would call customer history service
      // For now, we'll use mock data
      const mockHistory: CustomerHistoryType[] = [
        {
          id: '1',
          userId: targetUserId,
          type: 'appointment',
          referenceId: 'app1',
          description: 'Termin am 2024-12-25 um 14:00 für Tattoo',
          metadata: {
            serviceType: 'Tattoo',
            bodyPart: 'arm',
            tattooStyle: 'traditional'
          },
          createdAt: new Date('2024-12-20')
        },
        {
          id: '2',
          userId: targetUserId,
          type: 'payment',
          referenceId: 'pay1',
          description: 'Zahlung von 60.00€ (stripe)',
          metadata: {
            amount: 60,
            currency: 'EUR',
            paymentMethod: 'stripe',
            status: 'completed'
          },
          createdAt: new Date('2024-12-21')
        },
        {
          id: '3',
          userId: targetUserId,
          type: 'review',
          referenceId: 'rev1',
          description: 'Bewertung mit 5 Sternen: "Sehr zufrieden!"',
          metadata: {
            rating: 5,
            isAnonymous: false,
            isVerified: true
          },
          createdAt: new Date('2024-12-26')
        },
        {
          id: '4',
          userId: targetUserId,
          type: 'material_usage',
          referenceId: 'app1',
          description: 'Materialverbrauch für Termin: 15.50€',
          metadata: {
            totalCost: 15.50,
            itemCount: 3
          },
          createdAt: new Date('2024-12-25')
        }
      ];
      setHistory(mockHistory);
    } catch (error: unknown) {
      console.error('Error loading customer history:', error);
      setError('Fehler beim Laden der Kundenhistorie');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  // Load customer history
  useEffect(() => {
    if (targetUserId) {
      loadCustomerHistory();
    }
  }, [targetUserId, loadCustomerHistory]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <EventIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'review':
        return <StarIcon />;
      case 'material_usage':
        return <InventoryIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'primary';
      case 'payment':
        return 'success';
      case 'review':
        return 'warning';
      case 'material_usage':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'Termin';
      case 'payment':
        return 'Zahlung';
      case 'review':
        return 'Bewertung';
      case 'material_usage':
        return 'Materialverbrauch';
      default:
        return type;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filterHistory = () => {
    let filtered = history;

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    if (dateRange.start) {
      filtered = filtered.filter(item => 
        item.createdAt >= new Date(dateRange.start)
      );
    }

    if (dateRange.end) {
      filtered = filtered.filter(item => 
        item.createdAt <= new Date(dateRange.end + 'T23:59:59')
      );
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const exportData = () => {
    try {
      const filteredHistory = filterHistory();
      const csvContent = [
        ['Datum', 'Typ', 'Beschreibung', 'Metadaten'],
        ...filteredHistory.map(item => [
          formatDate(item.createdAt),
          getTypeLabel(item.type),
          item.description,
          JSON.stringify(item.metadata || {})
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kundenhistorie_${targetUserId}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportDialogOpen(false);
    } catch (err: unknown) {
      setError('Fehler beim Exportieren der Daten');
    }
  };

  const renderHistoryTable = () => {
    const filteredHistory = filterHistory();

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Beschreibung</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(item.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getTypeIcon(item.type)}
                    label={getTypeLabel(item.type)}
                    color={getTypeColor(item.type) as "error" | "default" | "primary" | "success" | "warning" | "info" | "secondary"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {item.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="caption">Details anzeigen</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="caption" component="pre">
                          {JSON.stringify(item.metadata, null, 2)}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderStatistics = () => {
    const totalAppointments = history.filter(h => h.type === 'appointment').length;
    const totalPayments = history.filter(h => h.type === 'payment').length;
    const totalReviews = history.filter(h => h.type === 'review').length;
    const totalMaterialUsage = history.filter(h => h.type === 'material_usage').length;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Termine
              </Typography>
              <Typography variant="h4" color="primary">
                {totalAppointments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Zahlungen
              </Typography>
              <Typography variant="h4" color="success.main">
                {totalPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bewertungen
              </Typography>
              <Typography variant="h4" color="warning.main">
                {totalReviews}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Materialverbrauch
              </Typography>
              <Typography variant="h4" color="info.main">
                {totalMaterialUsage}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Kundenhistorie</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => setExportDialogOpen(true)}
        >
          Daten exportieren
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderStatistics()}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Typ</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">Alle</MenuItem>
                  <MenuItem value="appointment">Termine</MenuItem>
                  <MenuItem value="payment">Zahlungen</MenuItem>
                  <MenuItem value="review">Bewertungen</MenuItem>
                  <MenuItem value="material_usage">Materialverbrauch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Startdatum"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Enddatum"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderHistoryTable()
      )}

      {/* GDPR Notice */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Datenschutz-Hinweis:</strong> Diese Kundenhistorie enthält alle Ihre Aktivitäten 
          in unserem System. Sie können Ihre Daten jederzeit exportieren oder löschen lassen. 
          Weitere Informationen finden Sie in unserer Datenschutzerklärung.
        </Typography>
      </Alert>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Daten exportieren</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie Ihre Kundenhistorie als CSV-Datei exportieren? 
            Die Datei wird alle Ihre Daten in einem strukturierten Format enthalten.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={exportData} variant="contained">
            Exportieren
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerHistory; 