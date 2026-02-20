import { useState, useEffect } from "react";

/**
 * usePortalTarget Hook
 * Reliably finds and tracks a portal target element, even if it's dynamically added/removed.
 * Useful for responsive layouts where the target element might move between different containers.
 */
export function usePortalTarget(targetId: string) {
    const [target, setTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const updateTarget = () => {
            const el = document.getElementById(targetId);
            setTarget(el);
        };

        updateTarget();

        // Observe document body for changes to catch when the targetId becomes available
        const observer = new MutationObserver(updateTarget);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [targetId]);

    return target;
}
