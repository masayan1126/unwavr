import { useState, useEffect, useCallback } from 'react';

interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'wimax' | 'none' | 'other' | 'unknown';
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

interface NetworkSpeed {
  downlink: number; // Mbps (実測値)
  effectiveType: string;
  type: string;
  measuring: boolean;
  lastMeasured?: number; // timestamp
}

/**
 * ダウンロードテストによる実際のネットワーク速度を測定するカスタムフック
 * 5分ごとに自動再測定し、キャッシュされた結果を返す
 */
export function useNetworkSpeed(): NetworkSpeed | null {
  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed | null>(null);

  // 実際のダウンロード速度を測定
  const measureSpeed = useCallback(async () => {
    setNetworkSpeed((prev) => (prev ? { ...prev, measuring: true } : { downlink: 0, effectiveType: 'unknown', type: 'unknown', measuring: true }));

    try {
      // 1MB のテストファイルをダウンロード
      const testSize = 1024 * 1024; // 1MB
      const startTime = performance.now();

      const response = await fetch(`/api/speedtest?size=${testSize}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Speed test failed');
      }

      // データを完全に読み込む
      await response.text();
      const endTime = performance.now();

      // 速度を計算 (Mbps)
      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsDownloaded = testSize * 8;
      const mbps = bitsDownloaded / durationInSeconds / 1_000_000;

      // Navigator Connection API から接続タイプを取得（可能な場合）
      const nav = navigator as NavigatorWithConnection;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

      setNetworkSpeed({
        downlink: Math.round(mbps * 10) / 10, // 小数点1桁に丸める
        effectiveType: connection?.effectiveType ?? 'unknown',
        type: connection?.type ?? 'unknown',
        measuring: false,
        lastMeasured: Date.now(),
      });
    } catch (error) {
      console.error('Speed measurement failed:', error);
      setNetworkSpeed((prev) => (prev ? { ...prev, measuring: false } : null));
    }
  }, []);

  useEffect(() => {
    // 初回測定
    measureSpeed();

    // 5分ごとに再測定
    const interval = setInterval(() => {
      measureSpeed();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(interval);
    };
  }, [measureSpeed]);

  return networkSpeed;
}
