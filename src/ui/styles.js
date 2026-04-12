const DESIGN_TOKENS = {
  colors: {
    bg: {
      primary: 'rgb(19, 20, 22)',
      secondary: 'rgb(24, 25, 27)',
      modal: '#1a1a1a',
      surface: '#2a2a2a'
    },
    text: {
      primary: 'rgb(250, 250, 250)',
      secondary: 'rgba(255, 255, 255, 0.77)',
      muted: '#9ca3af'
    },
    interactive: {
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.05)'
    }
  },

  typography: {
    fontFamily: '"Exo 2", system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '24px'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '14px',
    pill: '9999px'
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px'
  },

  shadows: {
    none: 'none',
    sm: '0 4px 12px rgba(0, 0, 0, 0.15)',
    md: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },

  transitions: {
    fast: '0.2s',
    normal: '0.3s'
  }
};

const buttonStyles = (variant = 'primary') => {
  const base = `
    font-family: ${DESIGN_TOKENS.typography.fontFamily};
    font-size: ${DESIGN_TOKENS.typography.fontSize.md};
    font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
    border-radius: ${DESIGN_TOKENS.radius.pill};
    border: none;
    cursor: pointer;
    transition: all ${DESIGN_TOKENS.transitions.fast};
    outline: none;
  `;

  const variants = {
    primary: `
      background: ${DESIGN_TOKENS.colors.bg.secondary};
      color: ${DESIGN_TOKENS.colors.text.primary};
      padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
      height: 36px;
    `,
    secondary: `
      background: #374151;
      color: ${DESIGN_TOKENS.colors.text.primary};
      padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
    `,
    icon: `
      background: rgba(255, 255, 255, 0.05);
      color: ${DESIGN_TOKENS.colors.text.muted};
      width: 40px;
      height: 40px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: ${DESIGN_TOKENS.radius.md};
    `,
    fullWidth: `
      background: ${DESIGN_TOKENS.colors.bg.secondary};
      color: ${DESIGN_TOKENS.colors.text.primary};
      padding: 10px 20px;
      width: 100%;
    `
  };

  return base + (variants[variant] || variants.primary);
};

const modalStyles = () => `
  background: ${DESIGN_TOKENS.colors.bg.modal};
  color: ${DESIGN_TOKENS.colors.text.primary};
  font-family: ${DESIGN_TOKENS.typography.fontFamily};
  border-radius: ${DESIGN_TOKENS.radius.lg};
  padding: ${DESIGN_TOKENS.spacing.xxl};
  box-shadow: ${DESIGN_TOKENS.shadows.md};
  animation: remanga-modal-appear ${DESIGN_TOKENS.transitions.fast} ease;
`;

const overlayStyles = () => `
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999998;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
`;

const toastStyles = () => `
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 999999;
  background: ${DESIGN_TOKENS.colors.bg.secondary};
  color: ${DESIGN_TOKENS.colors.text.primary};
  padding: ${DESIGN_TOKENS.spacing.lg} ${DESIGN_TOKENS.spacing.xl};
  border-radius: ${DESIGN_TOKENS.radius.lg};
  box-shadow: ${DESIGN_TOKENS.shadows.none};
  font-family: ${DESIGN_TOKENS.typography.fontFamily};
  font-size: ${DESIGN_TOKENS.typography.fontSize.md};
  font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
  max-width: 400px;
  animation: remanga-toast-slide-in ${DESIGN_TOKENS.transitions.normal} ease;
  cursor: pointer;
  transition: top ${DESIGN_TOKENS.transitions.normal} ease, opacity ${DESIGN_TOKENS.transitions.fast} ease;
  display: flex;
  align-items: center;
  gap: ${DESIGN_TOKENS.spacing.sm};
  border-left: 3px solid ${DESIGN_TOKENS.colors.text.secondary};
`;
