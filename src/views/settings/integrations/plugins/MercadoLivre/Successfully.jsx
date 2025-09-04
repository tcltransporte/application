'use client';

import { Card, CardContent, Typography, Button, Box } from "@mui/material";

export default function Successfully() {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
      px={2}
    >
      <Card
        sx={{
          maxWidth: 400,
          borderRadius: 4,
          boxShadow: 6,
          textAlign: "center",
          p: 2,
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="center" mb={2}>
            <i
              className="ri-checkbox-circle-fill"
              style={{ fontSize: 70, color: "#4caf50" }}
            ></i>
          </Box>

          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Integração realizada com sucesso!
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Sua integração foi concluída e já está pronta para uso.
          </Typography>

        </CardContent>
      </Card>
    </Box>
  );
}
