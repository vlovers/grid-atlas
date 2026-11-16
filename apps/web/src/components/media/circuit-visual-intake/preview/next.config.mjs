const distDir = process.env.CIRCUIT_MEDIA410_DIST || '.next/manual';
export default { distDir, typescript: { tsconfigPath: `${distDir}/tsconfig.json` }, experimental: { externalDir: true }, devIndicators: false };
