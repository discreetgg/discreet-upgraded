export { IdvLanguage as AvailableLanguages } from '@idv/utils/idvLanguage';

export { ThemeType as SdkThemeType } from '@idv/utils/common/common.enums';

export enum SdkMode {
  Production = 'Production',
  Sandbox = 'Sandbox',
}

export enum SdkThemeType {
  Dark = 'dark',
  Light = 'light',
}

export type BackgroundStyle = {
  /**
   * SDK backround opacity.
   * CSS property opacity.
   * Default is 0.9.
   */
  opacity?: number | null;

  /**
   * SDK backround blur.
   * The radius of the blur in px / rem / em / etc.
   * Default is 0.375rem.
   */
  blur?: string | null;
};

export type CustomiseStyleProps = {
  /**
   * SDK backround styles.
   */
  background?: BackgroundStyle | null;

  /**
   * SDK theme.
   * Theme values dark | light.
   * Default is light.
   */
  theme?: SdkThemeType;
};
