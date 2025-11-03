"use client";
import { useEffect } from "react";

export default function DarkModeHandler() {
  useEffect(() => {
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      if (!mq) return;
      
      const root = document.documentElement;
      const apply = () => {
        if (mq.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      
      apply();
      
      if (mq.addEventListener) mq.addEventListener('change', apply);
      else if ((mq as any).addListener) (mq as any).addListener(apply);
      
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', apply);
        else if ((mq as any).removeListener) (mq as any).removeListener(apply);
      };
    } catch (e) {
      // no-op
    }
  }, []);

  return null;
}
