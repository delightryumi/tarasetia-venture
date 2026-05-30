export type TextAnimationType = 'fade-up' | 'fade-down' | 'slide-left' | 'slide-right' | 'zoom' | 'fade';

export interface HeroSlide {
    id: string;
    title: string;
    subtitle: string;
    backgroundImage: string;
    midgroundImage: string | null;
    foregroundImage: string | null;
    textAnimation?: TextAnimationType; // Optional for backwards compatibility, defaults to fade-up
}

export interface HeroData {
    slides: HeroSlide[];
    updatedAt?: string;
}
