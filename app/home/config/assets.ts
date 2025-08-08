export interface AssetConfig {
  id: string;
  name: string;
  url: string;
  type: 'icon' | 'image' | 'logo';
  description: string;
}

export const ASSET_URLS: AssetConfig[] = [
  {
    id: 'vscode-icon',
    name: 'VSCode Icon',
    url: 'https://code.visualstudio.com/assets/images/code-stable-white.png',
    type: 'icon',
    description: 'Visual Studio Code icon - white version'
  },
  {
    id: 'claude-icon',
    name: 'Claude Code Icon',
    url: 'https://anthropic.gallerycdn.vsassets.io/extensions/anthropic/claude-code/1.0.67/1754087738567/Microsoft.VisualStudio.Services.Icons.Default',
    type: 'icon',
    description: 'Claude Code extension icon from VS Code marketplace'
  }
];

export const getAssetUrl = (id: string): string | undefined => {
  return ASSET_URLS.find(asset => asset.id === id)?.url;
};

export const getAllAssets = (): AssetConfig[] => {
  return ASSET_URLS;
};