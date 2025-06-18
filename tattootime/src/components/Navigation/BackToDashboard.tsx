import React from "react";
import { Box, Button, SxProps, Theme } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface BackToDashboardProps {
  sx?: SxProps<Theme>;
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
}

const BackToDashboard: React.FC<BackToDashboardProps> = ({
  sx = {},
  variant = "outlined",
  size = "medium",
}) => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Button
        variant={variant}
        startIcon={<ArrowBackIcon />}
        onClick={handleBackToDashboard}
        size={size}
      >
        Zurück zum Dashboard
      </Button>
    </Box>
  );
};

export default BackToDashboard; 