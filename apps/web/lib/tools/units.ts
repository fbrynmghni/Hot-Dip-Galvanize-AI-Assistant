export const MICRON_PER_MIL = 25.4;
export const MM_PER_INCH = 25.4;
export const ZINC_DENSITY_G_CM3 = 7.14; // 1 um zinc ~ 7,14 g/m2
export const GM2_PER_OZFT2 = 305.15;

export const milToMicron = (mil: number) => mil * MICRON_PER_MIL;
export const micronToGm2 = (um: number) => um * ZINC_DENSITY_G_CM3;
export const ozft2ToGm2 = (oz: number) => oz * GM2_PER_OZFT2;
export const gm2ToMicron = (g: number) => g / ZINC_DENSITY_G_CM3;
export const mmToIn = (mm: number) => mm / MM_PER_INCH;
