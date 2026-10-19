// Isolated preview: do not inherit the application's routing/i18n plugin.
const distDir = process.env.MEDIA_PREVIEW_DIST || '.next/manual';
export default { distDir, typescript: { tsconfigPath: `${distDir}/tsconfig.json` },
  experimental: { externalDir: true }, devIndicators: false };
