/**
 * Semantic logo asset map for NextFlight Academy.
 * Uses Cloudinary-hosted URLs directly (not local 0-byte PNGs).
 */

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dwp64dtwa/image/upload';

function logo(id: string): { uri: string } {
  return { uri: `${CLOUDINARY_BASE}/${id}` };
}

// ─── For light/cream backgrounds (burgundy/dark color) ──────────────────────
export const LOGO_SEAL_BURGUNDY = logo('v1779780211/logo-next-3_d11uks.png');
export const LOGO_PLANE_BURGUNDY = logo('v1779780198/logo-next-4_grchuu.png');
export const LOGO_BADGE_BURGUNDY = logo('v1779780198/logo-next-5_gxctqe.png');
export const LOGO_MONOGRAM_BURGUNDY = logo('v1779780199/logo-next-6_v8hak7.png');
export const LOGO_OVAL_BURGUNDY = logo('v1779780199/logo-next-7_apdhwt.png');
export const LOGO_WORDMARK_CENTERED_BURGUNDY = logo('v1779780201/logo-next-12_ua7kuy.png');
export const LOGO_WORDMARK_SOLO_BURGUNDY = logo('v1779780202/logo-next-13_xp1rz8.png');
export const LOGO_ACADEMY_BURGUNDY = logo('v1779780202/logo-next-14_dwbwae.png');
export const LOGO_WORDMARK_LEFT_BURGUNDY = logo('v1779780201/logo-next-12_ua7kuy.png');

// ─── For dark/burgundy backgrounds (cream/off-white color) ──────────────────
export const LOGO_MONOGRAM_CREAM = logo('v1779780200/logo-next-8_o3nl4k.png');
export const LOGO_BADGE_CREAM = logo('v1779780200/logo-next-9_v2wi72.png');
export const LOGO_PLANE_CREAM = logo('v1779780201/logo-next-10_wpmv3p.png');
export const LOGO_SEAL_CREAM = logo('v1779780201/logo-next-11_yeixdt.png');
export const LOGO_OVAL_CREAM = logo('v1779780203/logo-next-15_phyhti.png');
export const LOGO_WORDMARK_LEFT_CREAM = logo('v1779780203/logo-next-16_r8b4nk.png');
export const LOGO_ACADEMY_CREAM = logo('v1779780204/logo-next-17_ureq9f.png');
export const LOGO_WORDMARK_SOLO_CREAM = logo('v1779780204/logo-next-18_ep6hcv.png');
export const LOGO_WORDMARK_CENTERED_CREAM = logo('v1779780205/logo-next-19_kmzdrx.png');

// ─── Gold flat — for neutral or dark backgrounds ────────────────────────────
export const LOGO_PLANE_GOLD = logo('v1779780205/logo-next-20_eedwfc.png');
export const LOGO_BADGE_GOLD = logo('v1779780206/logo-next-21_fatwmt.png');
export const LOGO_SEAL_GOLD = logo('v1779780206/logo-next-22_shvzqz.png');
export const LOGO_MONOGRAM_GOLD = logo('v1779780207/logo-next-23_hfb9lz.png');
export const LOGO_OVAL_GOLD = logo('v1779780207/logo-next-24_ypwitu.png');
export const LOGO_WORDMARK_LEFT_GOLD = logo('v1779780208/logo-next-25_v9he8i.png');
export const LOGO_ACADEMY_GOLD = logo('v1779780208/logo-next-26_uyyikd.png');
export const LOGO_WORDMARK_SOLO_GOLD = logo('v1779780208/logo-next-27_spmkzw.png');
export const LOGO_WORDMARK_CENTERED_GOLD = logo('v1779780209/logo-next-28_ccxxjs.png');

// ─── Gold gradient — premium / hero use ─────────────────────────────────────
export const LOGO_SEAL_GOLD_GRAD = logo('v1779780209/logo-next-29_wzp8cj.png');
export const LOGO_PLANE_GOLD_GRAD = logo('v1779780210/logo-next-30_eh6odr.png');
export const LOGO_BADGE_GOLD_GRAD = logo('v1779780210/logo-next-31_di6v3o.png');
export const LOGO_MONOGRAM_GOLD_GRAD = logo('v1779780211/logo-next-32_wicrv5.png');
export const LOGO_OVAL_GOLD_GRAD = logo('v1779780212/logo-next-33_jdsbga.png');
export const LOGO_WORDMARK_LEFT_GOLD_GRAD = logo('v1779780212/logo-next-34_hlurzg.png');
export const LOGO_ACADEMY_GOLD_GRAD = logo('v1779780213/logo-next-35_pkdgtd.png');
export const LOGO_WORDMARK_SOLO_GOLD_GRAD = logo('v1779780213/logo-next-36_ein7gn.png');

// ─── Main wordmark (gold, centered) ────────────────────────────────────────
export const LOGO_ALT_1 = logo('v1779780198/logo-next-1_ikptrv.png');
export const LOGO_ALT_2 = logo('v1779780197/logo-next-2_yg5l9s.png');

// ─── Hero background ────────────────────────────────────────────────────────
export const HERO_BACKGROUND = { uri: `${CLOUDINARY_BASE}/v1779867888/nextbackk1_raeh7e.png` };
