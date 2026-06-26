import { NextResponse } from 'next/server';

export async function GET() {
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'your-username';
  const repoName = process.env.GITHUB_REPO_NAME || 'biashara-ledger';

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

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const release = await response.json();

    const windowsAsset = release.assets.find(
      (a: any) => a.name.endsWith('.exe') || a.name.endsWith('.Setup.exe')
    );
    const macAsset = release.assets.find(
      (a: any) => a.name.endsWith('.dmg')
    );
    const linuxAsset = release.assets.find(
      (a: any) => a.name.endsWith('.AppImage')
    );

    return NextResponse.json({
      version: release.tag_name,
      publishedAt: release.published_at,
      releaseNotes: release.body,
      windows: windowsAsset?.browser_download_url || null,
      mac: macAsset?.browser_download_url || null,
      linux: linuxAsset?.browser_download_url || null,
      windowsSize: windowsAsset?.size || null,
      macSize: macAsset?.size || null,
      linuxSize: linuxAsset?.size || null,
    });
  } catch {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.json({
      version: process.env.npm_package_version || '1.0.0',
      windows: `${baseUrl}/downloads/biashara-ledger-setup.exe`,
      mac: `${baseUrl}/downloads/biashara-ledger-mac.dmg`,
      linux: null,
    });
  }
}
