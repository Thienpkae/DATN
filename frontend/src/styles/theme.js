// Enhanced Theme Configuration for Land Registry System
// This file provides comprehensive theme tokens for Ant Design and custom components

// Base design tokens
const designTokens = {
  // Color palette
  colors: {
    // Primary colors for each organization
    org1: {
      primary: '#1677ff',
      primaryHover: '#4096ff',
      primaryActive: '#0958d9',
      primaryLight: '#e6f4ff',
      primaryLighter: '#f0f8ff',
    },
    org2: {
      primary: '#389e0d',
      primaryHover: '#52c41a',
      primaryActive: '#237804',
      primaryLight: '#f6ffed',
      primaryLighter: '#fcffe6',
    },
    org3: {
      primary: '#d46b08',
      primaryHover: '#fa8c16',
      primaryActive: '#ad4e00',
      primaryLight: '#fff7e6',
      primaryLighter: '#fffbe6',
    },
    
    // Neutral colors
    white: '#ffffff',
    black: '#000000',
    gray: {
      25: '#fcfcfd',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    
    // Semantic colors
    success: '#16a34a',
    successHover: '#22c55e',
    successLight: '#dcfce7',
    successBorder: '#bbf7d0',
    
    warning: '#d97706',
    warningHover: '#f59e0b',
    warningLight: '#fef3c7',
    warningBorder: '#fed7aa',
    
    error: '#dc2626',
    errorHover: '#ef4444',
    errorLight: '#fee2e2',
    errorBorder: '#fecaca',
    
    info: '#0ea5e9',
    infoHover: '#38bdf8',
    infoLight: '#e0f2fe',
    infoBorder: '#bae6fd',
  },
  
  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      thin: 100,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
  },
  
  // Shadows
  boxShadow: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },
  
  // Transitions
  transition: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Generate Ant Design theme configuration
export const getAntTheme = (organization = 'org1') => {
  const orgColors = designTokens.colors[organization] || designTokens.colors.org1;
  
  return {
    token: {
      // Primary colors
      colorPrimary: orgColors.primary,
      colorPrimaryHover: orgColors.primaryHover,
      colorPrimaryActive: orgColors.primaryActive,
      colorPrimaryBg: orgColors.primaryLight,
      colorPrimaryBgHover: orgColors.primaryLighter,
      
      // Success colors
      colorSuccess: designTokens.colors.success,
      colorSuccessHover: designTokens.colors.successHover,
      colorSuccessBg: designTokens.colors.successLight,
      colorSuccessBorder: designTokens.colors.successBorder,
      
      // Warning colors
      colorWarning: designTokens.colors.warning,
      colorWarningHover: designTokens.colors.warningHover,
      colorWarningBg: designTokens.colors.warningLight,
      colorWarningBorder: designTokens.colors.warningBorder,
      
      // Error colors
      colorError: designTokens.colors.error,
      colorErrorHover: designTokens.colors.errorHover,
      colorErrorBg: designTokens.colors.errorLight,
      colorErrorBorder: designTokens.colors.errorBorder,
      
      // Info colors
      colorInfo: designTokens.colors.info,
      colorInfoHover: designTokens.colors.infoHover,
      colorInfoBg: designTokens.colors.infoLight,
      colorInfoBorder: designTokens.colors.infoBorder,
      
      // Neutral colors
      colorBgBase: designTokens.colors.white,
      colorBgContainer: designTokens.colors.white,
      colorBgElevated: designTokens.colors.white,
      colorBgLayout: designTokens.colors.gray[50],
      colorBgSpotlight: designTokens.colors.gray[25],
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
      
      // Text colors
      colorText: designTokens.colors.gray[800],
      colorTextSecondary: designTokens.colors.gray[600],
      colorTextTertiary: designTokens.colors.gray[500],
      colorTextQuaternary: designTokens.colors.gray[400],
      
      // Border colors
      colorBorder: designTokens.colors.gray[200],
      colorBorderSecondary: designTokens.colors.gray[100],
      
      // Typography
      fontFamily: designTokens.typography.fontFamily,
      fontSize: 14,
      fontSizeLG: 16,
      fontSizeSM: 12,
      fontSizeXL: 20,
      fontWeightStrong: designTokens.typography.fontWeight.semibold,
      
      // Layout
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      borderRadiusXS: 4,
      
      // Spacing
      padding: 16,
      paddingLG: 24,
      paddingSM: 12,
      paddingXS: 8,
      paddingXXS: 4,
      
      margin: 16,
      marginLG: 24,
      marginSM: 12,
      marginXS: 8,
      marginXXS: 4,
      
      // Shadows
      boxShadow: designTokens.boxShadow.sm,
      boxShadowSecondary: designTokens.boxShadow.xs,
      boxShadowTertiary: designTokens.boxShadow.md,
      
      // Motion
      motionDurationFast: '0.1s',
      motionDurationMid: '0.2s',
      motionDurationSlow: '0.3s',
      motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      motionEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
      motionEaseIn: 'cubic-bezier(0.4, 0, 1, 1)',
      
      // Control heights
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      controlHeightXS: 16,
      
      // Line heights
      lineHeight: designTokens.typography.lineHeight.normal,
      lineHeightLG: designTokens.typography.lineHeight.relaxed,
      lineHeightSM: designTokens.typography.lineHeight.snug,
      
      // Wireframe mode
      wireframe: false,
    },
    
    components: {
      Layout: {
        bodyBg: designTokens.colors.gray[50],
        headerBg: designTokens.colors.white,
        headerHeight: 64,
        headerPadding: '0 24px',
        siderBg: designTokens.colors.white,
        footerBg: designTokens.colors.gray[50],
        footerPadding: '24px 50px',
        triggerBg: designTokens.colors.gray[100],
        triggerColor: designTokens.colors.gray[600],
        zeroTriggerWidth: 36,
        zeroTriggerHeight: 42,
      },
      
      Menu: {
        itemBorderRadius: 8,
        itemHeight: 40,
        itemMarginBlock: 4,
        itemMarginInline: 8,
        itemPaddingInline: 12,
        subMenuItemBg: 'transparent',
        activeBarBorderWidth: 0,
        activeBarHeight: 0,
        activeBarWidth: 0,
        itemActiveBg: orgColors.primary,
        itemSelectedBg: orgColors.primary,
        itemSelectedColor: designTokens.colors.white,
        itemHoverBg: orgColors.primaryLight,
        itemHoverColor: orgColors.primary,
      },
      
      Button: {
        borderRadius: 8,
        controlHeight: 32,
        controlHeightLG: 40,
        controlHeightSM: 24,
        fontWeight: designTokens.typography.fontWeight.medium,
        primaryShadow: `0 2px 0 ${orgColors.primaryActive}`,
        dangerShadow: `0 2px 0 ${designTokens.colors.error}`,
      },
      
      Card: {
        borderRadius: 12,
        borderRadiusLG: 16,
        headerBg: 'transparent',
        headerHeight: 56,
        headerHeightSM: 48,
        actionsBg: designTokens.colors.gray[50],
        tabsMarginBottom: 16,
      },
      
      Table: {
        headerBg: designTokens.colors.gray[50],
        headerColor: designTokens.colors.gray[800],
        headerSortActiveBg: designTokens.colors.gray[100],
        headerSortHoverBg: designTokens.colors.gray[75],
        bodySortBg: designTokens.colors.gray[25],
        rowHoverBg: designTokens.colors.gray[50],
        rowSelectedBg: orgColors.primaryLight,
        rowSelectedHoverBg: orgColors.primaryLighter,
        borderColor: designTokens.colors.gray[200],
        headerSplitColor: designTokens.colors.gray[200],
      },
      
      Form: {
        labelColor: designTokens.colors.gray[700],
        labelFontSize: 14,
        labelHeight: 32,
        labelColonMarginInlineStart: 2,
        labelColonMarginInlineEnd: 8,
        itemMarginBottom: 24,
        verticalLabelPadding: '0 0 8px',
        verticalLabelMargin: 0,
      },
      
      Input: {
        borderRadius: 6,
        controlHeight: 32,
        controlHeightLG: 40,
        controlHeightSM: 24,
        paddingInline: 12,
        paddingInlineLG: 16,
        paddingInlineSM: 8,
        activeBorderColor: orgColors.primary,
        hoverBorderColor: orgColors.primaryHover,
        activeShadow: `0 0 0 2px ${orgColors.primaryLight}`,
        errorActiveShadow: `0 0 0 2px ${designTokens.colors.errorLight}`,
        warningActiveShadow: `0 0 0 2px ${designTokens.colors.warningLight}`,
      },
      
      Select: {
        borderRadius: 6,
        controlHeight: 32,
        controlHeightLG: 40,
        controlHeightSM: 24,
        optionActiveBg: orgColors.primaryLight,
        optionSelectedBg: orgColors.primary,
        optionSelectedColor: designTokens.colors.white,
        optionPadding: '8px 12px',
        selectorBg: designTokens.colors.white,
      },
      
      Modal: {
        borderRadius: 12,
        headerBg: 'transparent',
        contentBg: designTokens.colors.white,
        footerBg: 'transparent',
        maskBg: 'rgba(0, 0, 0, 0.45)',
        titleColor: designTokens.colors.gray[900],
        titleFontSize: 18,
        titleLineHeight: 1.5,
      },
      
      Notification: {
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        width: 384,
      },
      
      Message: {
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 8,
      },
      
      Drawer: {
        borderRadius: 0,
        headerHeight: 56,
        bodyPadding: 24,
        footerPaddingBlock: 16,
        footerPaddingInline: 24,
      },
      
      Tabs: {
        borderRadius: 6,
        cardBg: designTokens.colors.white,
        cardHeight: 40,
        cardPadding: '8px 16px',
        cardPaddingSM: '6px 12px',
        cardPaddingLG: '10px 20px',
        titleFontSize: 14,
        titleFontSizeLG: 16,
        titleFontSizeSM: 12,
        inkBarColor: orgColors.primary,
        activeColor: orgColors.primary,
        hoverColor: orgColors.primaryHover,
      },
      
      Progress: {
        defaultColor: orgColors.primary,
        remainingColor: designTokens.colors.gray[200],
        circleTextColor: designTokens.colors.gray[800],
        lineBorderRadius: 100,
        circleIconFontSize: 14,
      },
      
      Badge: {
        borderRadius: 10,
        fontWeight: designTokens.typography.fontWeight.medium,
        fontSize: 12,
        fontSizeSM: 10,
        height: 20,
        heightSM: 16,
        dotSize: 6,
        textColor: designTokens.colors.white,
      },
      
      Tag: {
        borderRadius: 6,
        fontSizeSM: 12,
        lineHeight: 1.5,
        lineHeightSM: 1.2,
        defaultBg: designTokens.colors.gray[100],
        defaultColor: designTokens.colors.gray[700],
      },
      
      Tooltip: {
        borderRadius: 6,
        colorBgSpotlight: designTokens.colors.gray[800],
        colorTextLightSolid: designTokens.colors.white,
        fontSize: 12,
        padding: '6px 8px',
        maxWidth: 250,
      },
      
      Popover: {
        borderRadius: 8,
        titleMinWidth: 177,
        innerPadding: 12,
        titleBorderBottom: `1px solid ${designTokens.colors.gray[200]}`,
        titleColor: designTokens.colors.gray[900],
        fontSize: 14,
      },
    },
  };
};

// Export design tokens for use in custom components
export { designTokens };

// Export theme utilities
export const getOrgTheme = (organization) => {
  const orgColors = designTokens.colors[organization] || designTokens.colors.org1;
  return {
    primary: orgColors.primary,
    primaryHover: orgColors.primaryHover,
    primaryActive: orgColors.primaryActive,
    primaryLight: orgColors.primaryLight,
    primaryLighter: orgColors.primaryLighter,
  };
};

// CSS custom properties generator
export const generateCSSCustomProperties = (organization = 'org1') => {
  const orgColors = designTokens.colors[organization] || designTokens.colors.org1;
  
  return {
    '--primary-color': orgColors.primary,
    '--primary-hover': orgColors.primaryHover,
    '--primary-active': orgColors.primaryActive,
    '--primary-light': orgColors.primaryLight,
    '--primary-lighter': orgColors.primaryLighter,
  };
};
