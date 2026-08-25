import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Window } from "@tauri-apps/api/window"
import { invoke } from '@tauri-apps/api/core';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// ──────────────────────────────────────────────────── System
export class SysUtils {

    static getWindow = (name: string): any => {
        return Window.getByLabel(name);
    }

    public static delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    static getRandomInRange = (min: number, max: number): number => {
        return Math.random() * (max - min) + min;
    };

    public static getRandomFrom<T>(...args: T[]): T {
        const randomIndex = Math.floor(Math.random() * args.length);
        return args[randomIndex];
    }

    public static parseHexColor(hex: string): [number, number, number] {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    }

    public static hexToRgba(hex: string, alpha: number = 1.0): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
}

// ──────────────────────────────────────────────────── Hotkeys
export class WinUtils {

    static destroyApp(snd: string = "", delay: number = 0) {
        AudioUtils.playSound(snd, 0.5);
        setTimeout(() => {
            invoke("close_app");
        }, delay);
    }

    static hideWindow(win: Window, snd: string = "", delay: number = 0) {
        AudioUtils.playSound(snd, 0.5);
        setTimeout(() => {
            win.hide();
        }, delay);
    }

    static showWindow(win: Window, snd: string = "", delay: number = 0) {
        AudioUtils.playSound(snd, 0.5);
        setTimeout(() => {
            win.show();
        }, delay);
    }

    static toggleWindow(win: Window, snd: string = "", delay: number = 0) {
        AudioUtils.playSound(snd, 0.5);
        setTimeout(() => {
            if (win.isMaximized) {
                win.hide();
            } else {
                win.show();
            }
        }, delay);
    }
}

// ──────────────────────────────────────────────────── Audio
export class AudioUtils {

    static async playSound(filePath: string, InVolume: number, InPitch: number = 1.0) {
        const audio = new Audio(filePath);
        audio.volume = InVolume;
        if (InPitch !== 1.0)
            audio.playbackRate = SysUtils.getRandomInRange((1.0 - InPitch), (1.0 + InPitch));
        audio.play().catch(err => console.log("Audio-Blockade durch Browser:", err));
    };
}

// ──────────────────────────────────────────────────── Math
export class MathUtils {

    static mapRangeClamped(
        value: number,
        inMin: number,
        inMax: number,
        outMin: number,
        outMax: number
    ): number {
        if (inMin === inMax) return outMin;
        const normalized = (value - inMin) / (inMax - inMin);
        const clampedNormalized = Math.max(0.0, Math.min(1.0, normalized));
        return outMin + clampedNormalized * (outMax - outMin);
    }
}

// ──────────────────────────────────────────────────── Console
export class ConsoleUtils {

    static async println(input: string) {
        try {
            await invoke('print_to_console', { text: input });
        } catch (error) {
            console.error(error);
        }
    };
}

// ──────────────────────────────────────────────────── Key
export class KeyUtils {

    static async blockall(blocking: boolean) {
        try {
            await invoke('toggle_lock', { enable: blocking });
        } catch (error) {
            console.error(error);
        }
    };
}
