export type ThemeColors =
  | 'Zinc'
  | 'Rose'
  | 'Blue'
  | 'Green'
  | 'Orange'
  | 'Red'
  | 'Yellow'
  | 'Violet'
  | 'Discreet';

export interface ThemeColorStateParams {
  themeColor: ThemeColors;
  setThemeColor: React.Dispatch<React.SetStateAction<ThemeColors>>;
}
