/**
 * Utilitas Deteksi Tipe Perangkat (Desktop/Laptop vs Mobile/Tablet)
 * Memastikan pengalaman interaksi keyboard presisi antar-platform sesuai Rule 1.
 */

export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;

  // 1. Deteksi User-Agent perangkat ponsel cerdas
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobileUA) {
    return false;
  }

  // 2. Deteksi iPad / tablet berbasis sentuhan murni
  const isIPad = /iPad/i.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !window.matchMedia('(pointer: fine)').matches);
  if (isIPad) {
    return false;
  }

  // 3. Layar sempit dengan kemampuan sentuhan primer (ponsel)
  if (window.innerWidth < 768 && window.matchMedia('(pointer: coarse)').matches) {
    return false;
  }

  return true;
}
