import { NextResponse } from 'next/server';

export async function GET() {
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'digitalbaroz';
  const repoName = process.env.GITHUB_REPO_NAME || 'biashara-ledger';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const version = process.env.npm_package_version || '1.0.0';

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'biashara-ledger-app',
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) throw new Error(`GitHub API responded with ${response.status}`);

    const release = await response.json();

    const findAsset = (ext: string) => {
      const asset = release.assets.find((a: any) => a.name.endsWith(ext));
      return asset ? { url: asset.browser_download_url, size: asset.size, name: asset.name } : null;
    };

    return NextResponse.json({
      version: release.tag_name.replace(/^v/, ''),
      publishedAt: release.published_at,
      releaseNotes: release.body,
      windows: findAsset('.exe'),
      mac: findAsset('.dmg'),
      macArm64: findAsset('-arm64.dmg') || findAsset('arm64.dmg'),
      linux: findAsset('.AppImage'),
      source: 'github',
    });
  } catch {
    return NextResponse.json({
      version,
      windows: { url: `${baseUrl}/downloads/biashara-ledger-setup.exe`, size: null, name: 'BiasharaLedger-Setup-1.0.0.exe' },
      mac: { url: `${baseUrl}/downloads/biashara-ledger-mac.dmg`, size: null, name: 'BiasharaLedger-1.0.0.dmg' },
      macArm64: { url: `${baseUrl}/downloads/biashara-ledger-mac-arm64.dmg`, size: null, name: 'BiasharaLedger-1.0.0-arm64.dmg' },
      linux: null,
      source: 'local',
    });
  }
}
