// Accessibility Foundation - APP-211
// WCAG 2.1 AA compliance utilities and constants

export const a11y = {
  // Color contrast ratios (WCAG AA: 4.5:1, AAA: 7:1)
  contrast: {
    AA_NORMAL: 4.5,
    AA_LARGE: 3,
    AAA_NORMAL: 7,
    AAA_LARGE: 4.5,
  },

  // Focus management
  focusRing: {
    width: '2px',
    style: 'solid',
    color: '#2563eb', // Blue-600
    offset: '2px',
    borderRadius: '4px',
  },

  // Skip links for keyboard navigation
  skipLink: {
    position: 'absolute' as const,
    left: '-9999px',
    top: '0',
    background: '#000',
    color: '#fff',
    padding: '8px',
    textDecoration: 'none',
    zIndex: '9999',
    fontSize: '14px',
    fontWeight: '600',
    '&:focus': {
      left: '6px',
      top: '6px',
    },
  },

  // Screen reader utilities
  srOnly: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0',
  },

  // Minimum target sizes (WCAG 2.5.5)
  minTargetSize: {
    width: '44px',
    height: '44px',
  },

  // Motion preferences
  reducedMotion: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
      scrollBehavior: 'auto !important',
    },
  },

  // High contrast mode support
  highContrast: {
    '@media (prefers-contrast: high)': {
      borderWidth: '2px',
      outline: '2px solid',
    },
  },

  // Color scheme preferences
  colorScheme: {
    light: {
      colorScheme: 'light',
    },
    dark: {
      colorScheme: 'dark',
    },
    auto: {
      '@media (prefers-color-scheme: dark)': {
        colorScheme: 'dark',
      },
      '@media (prefers-color-scheme: light)': {
        colorScheme: 'light',
      },
    },
  },
} as const;

// Semantic HTML helpers
export const semanticElements = {
  landmark: {
    main: 'main',
    navigation: 'nav', 
    banner: 'header',
    contentinfo: 'footer',
    complementary: 'aside',
    form: 'form',
    search: 'search',
  },
  
  heading: {
    h1: 'h1',
    h2: 'h2', 
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
  },
} as const;

// ARIA attributes and roles
export const aria = {
  roles: {
    button: 'button',
    link: 'link',
    tab: 'tab',
    tabpanel: 'tabpanel',
    tablist: 'tablist',
    dialog: 'dialog',
    alertdialog: 'alertdialog',
    alert: 'alert',
    status: 'status',
    progressbar: 'progressbar',
    menu: 'menu',
    menuitem: 'menuitem',
    menubar: 'menubar',
    tree: 'tree',
    treeitem: 'treeitem',
    grid: 'grid',
    gridcell: 'gridcell',
    listbox: 'listbox',
    option: 'option',
    combobox: 'combobox',
    slider: 'slider',
    spinbutton: 'spinbutton',
  },

  states: {
    expanded: 'aria-expanded',
    selected: 'aria-selected',
    checked: 'aria-checked',
    disabled: 'aria-disabled',
    hidden: 'aria-hidden',
    pressed: 'aria-pressed',
    current: 'aria-current',
    invalid: 'aria-invalid',
    required: 'aria-required',
    readonly: 'aria-readonly',
  },

  properties: {
    label: 'aria-label',
    labelledby: 'aria-labelledby',
    describedby: 'aria-describedby',
    controls: 'aria-controls',
    owns: 'aria-owns',
    activedescendant: 'aria-activedescendant',
    level: 'aria-level',
    setsize: 'aria-setsize',
    posinset: 'aria-posinset',
    valuemin: 'aria-valuemin',
    valuemax: 'aria-valuemax',
    valuenow: 'aria-valuenow',
    valuetext: 'aria-valuetext',
  },
} as const;

// Form validation messages (multilingual ready)
export const validationMessages = {
  required: 'このフィールドは必須です',
  email: '有効なメールアドレスを入力してください',
  minLength: (min: number) => `最低${min}文字入力してください`,
  maxLength: (max: number) => `${max}文字以内で入力してください`,
  pattern: '入力形式が正しくありません',
  number: '数値を入力してください',
  min: (min: number) => `${min}以上の値を入力してください`,
  max: (max: number) => `${max}以下の値を入力してください`,
  fileSize: (maxSize: string) => `ファイルサイズは${maxSize}以下にしてください`,
  fileType: (types: string) => `ファイル形式は${types}のみ対応しています`,
} as const;

// Keyboard navigation keys
export const keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;