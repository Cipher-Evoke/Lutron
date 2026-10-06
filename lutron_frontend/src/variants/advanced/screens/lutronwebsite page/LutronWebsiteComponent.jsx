import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const navItems = ['Home', 'Solutions', 'Design', 'Experience', 'Contact'];

const featuredCards = [
  {
    title: 'Ambient Intelligence',
    subtitle: 'Responsive lighting scenes that feel effortless.',
    detail: 'Warm tones, dimmed textures and quiet control for every interior moment.'
  },
  {
    title: 'Material Craft',
    subtitle: 'Curated finishes, elevated surfaces.',
    detail: 'A design system built around understated luxury and tactile simplicity.'
  },
  {
    title: 'Architectural Serenity',
    subtitle: 'Soft silhouettes with a cinematic presence.',
    detail: 'High-end spaces that breathe, glow, and move with intention.'
  }
];

const LutronWebsiteComponent = () => {
  const navigate = useNavigate();

  return (
    <Box className="luxury-landing-root">
      <Box className="luxury-navbar">
        <Typography component="span" className="luxury-brand">
          Lutron Atelier
        </Typography>
        <Stack direction="row" className="luxury-navbar-links" spacing={3}>
          {navItems.map((item) => (
            <Button
              key={item}
              className="luxury-navbar-link"
              onClick={() => window.scrollTo({ top: item === 'Experience' ? 1080 : 0, behavior: 'smooth' })}
              disableRipple
            >
              {item}
            </Button>
          ))}
        </Stack>
      </Box>

      <Box className="luxury-hero-panel">
        <Box className="luxury-hero-copy">
          <Typography component="h1" className="luxury-hero-title">
            The ultimate smart-home sanctuary crafted in warm light.
          </Typography>
          <Typography component="p" className="luxury-hero-description">
            A premium architectural experience inspired by calm interiors, layered textures, and intelligent design. Discover understated control with a soft, cinematic atmosphere.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} className="luxury-cta-stack">
            <Button
              className="luxury-cta-btn"
              onClick={() => navigate('/dashboard/overview')}
            >
              Explore the system
            </Button>
            <Button
              className="luxury-cta-secondary"
              onClick={() => navigate('/heatmap')}
            >
              View spaces
            </Button>
          </Stack>
        </Box>

        <Box className="luxury-hero-card">
          <Box className="luxury-hero-card-glow" />
          <Typography className="luxury-hero-card-label">Signature residence</Typography>
          <Typography className="luxury-hero-card-title">A luminous retreat in champagne and charcoal.</Typography>
          <Typography className="luxury-hero-card-copy">
            Soft gradients, gentle shadows, and ambient layering create an elegant setting for modern smart living.
          </Typography>
        </Box>
      </Box>

      <Box className="luxury-feature-grid" id="Experience">
        {featuredCards.map((card) => (
          <Box key={card.title} className="luxury-feature-card">
            <Typography className="luxury-feature-tag">Premium insight</Typography>
            <Typography className="luxury-feature-title">{card.title}</Typography>
            <Typography className="luxury-feature-subtitle">{card.subtitle}</Typography>
            <Typography className="luxury-feature-detail">{card.detail}</Typography>
          </Box>
        ))}
      </Box>

      <Box className="luxury-overview-panel">
        <Typography className="luxury-overview-title">
          Designed for spaces where every moment feels intentional.
        </Typography>
        <Typography className="luxury-overview-copy">
          A refined digital environment for premium residences and architectural interiors, where control is seamless and every surface exudes quiet luxury.
        </Typography>
      </Box>
    </Box>
  );
};

export default LutronWebsiteComponent;
