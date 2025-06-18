import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
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
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Material, Appointment } from '../../types';

interface MaterialManagementProps {
  appointment?: Appointment | null;
  onMaterialUsageRecorded?: () => void;
}

const MaterialManagement: React.FC<MaterialManagementProps> = ({
  appointment,
  onMaterialUsageRecorded
}) => {
  const functions = getFunctions();
  const recordMaterialUsageCallable = httpsCallable(functions, 'recordMaterialUsage');

  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; quantityUsed: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Load materials
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      // This would call a material service
      // For now, we'll use mock data
      const mockMaterials: Material[] = [
        {
          id: '1',
          name: 'Schwarze Tattoo-Farbe',
          category: 'ink',
          unit: 'ml',
          currentStock: 100,
          minimumStock: 20,
          costPerUnit: 0.5,
          supplier: 'Tattoo Supply Co.',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Rote Tattoo-Farbe',
          category: 'ink',
          unit: 'ml',
          currentStock: 80,
          minimumStock: 15,
          costPerUnit: 0.6,
          supplier: 'Tattoo Supply Co.',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Tattoo-Nadeln (3RL)',
          category: 'needle',
          unit: 'piece',
          currentStock: 200,
          minimumStock: 50,
          costPerUnit: 0.3,
          supplier: 'Tattoo Supply Co.',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setMaterials(mockMaterials);
    } catch (error) {
      console.error('Error loading materials:', error);
      setError('Fehler beim Laden der Materialien');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialUsage = async () => {
    if (!appointment || selectedMaterials.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      const result = await recordMaterialUsageCallable({
        appointmentId: appointment.id!,
        materials: selectedMaterials
      });

      console.log('Material usage result:', result.data);
      setSuccess('Materialverbrauch erfolgreich erfasst!');
      setSelectedMaterials([]);
      loadMaterials(); // Reload to get updated stock levels
      onMaterialUsageRecorded?.();
    } catch (err: any) {
      console.error('Error recording material usage:', err);
      setError(err.message || 'Fehler beim Erfassen des Materialverbrauchs');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    setSelectedMaterials(prev => {
      const existing = prev.find(item => item.materialId === materialId);
      if (existing) {
        return prev.map(item => 
          item.materialId === materialId 
            ? { ...item, quantityUsed: quantity }
            : item
        );
      } else {
        return [...prev, { materialId, quantityUsed: quantity }];
      }
    });
  };

  const getStockStatus = (material: Material) => {
    if (material.currentStock <= material.minimumStock) {
      return { status: 'low', color: 'error' as const };
    } else if (material.currentStock <= material.minimumStock * 1.5) {
      return { status: 'medium', color: 'warning' as const };
    } else {
      return { status: 'good', color: 'success' as const };
    }
  };

  const getSelectedQuantity = (materialId: string) => {
    const selected = selectedMaterials.find(item => item.materialId === materialId);
    return selected?.quantityUsed || 0;
  };

  const calculateTotalCost = () => {
    return selectedMaterials.reduce((total, selected) => {
      const material = materials.find(m => m.id === selected.materialId);
      return total + (material?.costPerUnit || 0) * selected.quantityUsed;
    }, 0);
  };

  const renderMaterialTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Material</TableCell>
            <TableCell>Kategorie</TableCell>
            <TableCell align="right">Lagerstand</TableCell>
            <TableCell align="right">Mindestbestand</TableCell>
            <TableCell align="right">Stückpreis</TableCell>
            <TableCell align="right">Verbrauch</TableCell>
            <TableCell align="right">Kosten</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {materials.map((material) => {
            const stockStatus = getStockStatus(material);
            const selectedQuantity = getSelectedQuantity(material.id!);
            const materialCost = material.costPerUnit * selectedQuantity;

            return (
              <TableRow key={material.id}>
                <TableCell>
                  <Typography variant="subtitle2">{material.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {material.supplier}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={material.category} 
                    size="small" 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {material.currentStock} {material.unit}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {material.minimumStock} {material.unit}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {material.costPerUnit.toFixed(2)}€
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={selectedQuantity}
                    onChange={(e) => handleQuantityChange(material.id!, Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{material.unit}</InputAdornment>,
                    }}
                    sx={{ width: 100 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="primary">
                    {materialCost.toFixed(2)}€
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={stockStatus.status === 'low' ? <WarningIcon /> : <InventoryIcon />}
                    label={stockStatus.status === 'low' ? 'Niedrig' : stockStatus.status === 'medium' ? 'Mittel' : 'Gut'}
                    color={stockStatus.color}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Materialverwaltung</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Material hinzufügen
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderMaterialTable()}

          {selectedMaterials.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Materialverbrauch erfassen
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedMaterials.length} Materialien ausgewählt
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      Gesamtkosten: {calculateTotalCost().toFixed(2)}€
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleMaterialUsage}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <InventoryIcon />}
                  >
                    Verbrauch erfassen
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lagerstand-Übersicht
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {materials.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktive Materialien
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Niedriger Bestand
                  </Typography>
                  <Typography variant="h4" color="error">
                    {materials.filter(m => m.currentStock <= m.minimumStock).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Benötigen Nachbestellung
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Gesamtwert
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {materials.reduce((total, m) => total + (m.currentStock * m.costPerUnit), 0).toFixed(0)}€
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lagerwert
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default MaterialManagement; 