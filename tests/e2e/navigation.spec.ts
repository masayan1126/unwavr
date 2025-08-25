import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', title: 'ダッシュボード' },
  { path: '/backlog', title: '積み上げ候補' },
  { path: '/launcher', title: 'ランチャー' },
  { path: '/milestones', title: 'マイルストーン' },
  { path: '/pomodoro', title: 'ポモドーロ' },
  { path: '/calendar', title: 'カレンダー' },
  { path: '/tasks', title: 'タスク' },
  { path: '/tasks/daily', title: '毎日積み上げ' },
  { path: '/tasks/scheduled', title: '特定曜日' },
  { path: '/tasks/incomplete', title: '未完了' },
  { path: '/tasks/import-export', title: 'インポート/エクスポート' },
  { path: '/privacy', title: 'プライバシー' },
  { path: '/terms', title: '利用規約' },
  { path: '/weather', title: '天気' },
  { path: '/unwavr', title: 'unwavr' },
  { path: '/unwavr/roadmap', title: 'roadmap' },
];

for (const { path, title } of routes) {
  test(`can navigate to ${path} and render without error`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(res?.ok()).toBeTruthy();
    // エラーページ・例外オーバーレイが出ていないこと
    await expect(page.locator('text=This page could not be found')).toHaveCount(0);
    await expect(page.locator('text=Application error')).toHaveCount(0);
    // 最低限 body が表示されていること
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
  });
}


