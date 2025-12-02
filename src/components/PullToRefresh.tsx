"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
    children: React.ReactNode;
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const controls = useAnimation();

    // Pull threshold in pixels
    const threshold = 80;

    // Transform values for the loading indicator
    const rotate = useTransform(y, [0, threshold], [0, 360]);
    const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
    const scale = useTransform(y, [0, threshold], [0.5, 1]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isDragging = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;

            // Only allow pulling if we are at the top of the page
            if (window.scrollY > 0) {
                isDragging = false;
                return;
            }

            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            // Only allow pulling down
            if (diff > 0) {
                // Add resistance
                const resistance = 0.4;
                const newY = diff * resistance;
                y.set(newY);

                // Prevent default scrolling behavior if we are pulling down at the top
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        };

        const handleTouchEnd = async () => {
            if (!isDragging) return;
            isDragging = false;

            const finalY = y.get();

            if (finalY > threshold) {
                setIsRefreshing(true);
                // Snap to threshold
                await controls.start({ y: threshold });

                // Trigger refresh
                router.refresh();

                // Simulate network delay if refresh is too fast, or wait for router
                // Since router.refresh() is void, we just wait a bit
                setTimeout(async () => {
                    setIsRefreshing(false);
                    await controls.start({ y: 0 });
                    y.set(0);
                }, 1000);
            } else {
                // Snap back
                controls.start({ y: 0 });
                y.set(0);
            }
        };

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        container.addEventListener("touchend", handleTouchEnd);

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [router, controls, y]);

    return (
        <div ref={containerRef} className="relative min-h-screen">
            <motion.div
                className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
                style={{ y, opacity }}
                animate={controls}
            >
                <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md mt-4 border">
                    <motion.div style={{ rotate, scale }}>
                        <Loader2 className={`w-6 h-6 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                style={{ y }}
                animate={controls}
            >
                {children}
            </motion.div>
        </div>
    );
}
