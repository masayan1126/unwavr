'use client';

import { useNetworkSpeed } from '@/hooks/useNetworkSpeed';
import { Loader2 } from 'lucide-react';

/**
 * ネットワーク速度を表示するインジケーターコンポーネント
 * 実際のダウンロード測定による速度を表示
 */
export default function NetworkSpeedIndicator() {
  const networkSpeed = useNetworkSpeed();

  // 測定前
  if (!networkSpeed) {
    return null;
  }

  const { downlink, effectiveType, type, measuring } = networkSpeed;

  // 接続タイプに応じたアイコンとラベルを決定
  const getConnectionLabel = () => {
    if (type === 'wifi') return 'WiFi';
    if (type === 'cellular') {
      // effectiveType に基づいて表示
      if (effectiveType === '4g') return '4G';
      if (effectiveType === '3g') return '3G';
      if (effectiveType === '2g') return '2G';
      if (effectiveType === 'slow-2g') return '2G';
      return 'Mobile';
    }
    if (type === 'ethernet') return 'Ethernet';
    return 'Online';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* 接続タイプアイコン */}
      <div className="flex items-center gap-1.5">
        <svg
          className="w-4 h-4 opacity-70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {type === 'wifi' ? (
            // WiFi アイコン
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          ) : (
            // モバイル/その他のアイコン
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          )}
        </svg>
        <span className="text-foreground font-medium">
          {getConnectionLabel()}
        </span>
      </div>

      {/* 速度表示または測定中インジケーター */}
      {measuring ? (
        <div className="flex items-center gap-1.5 opacity-70">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">測定中...</span>
        </div>
      ) : (
        <div className="font-semibold text-primary" title="実測値（5分ごとに自動更新）">
          {downlink.toFixed(1)} Mbps
        </div>
      )}
    </div>
  );
}
