import { initEditorPage } from './modules/editor';
import { initPhotoboothPage } from './modules/photobooth';
import { initResultPage } from './modules/result';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Drawer Toggle
    const mobileMenuBtn = document.getElementById('miora-mobile-menu-btn');
    const mobileMenu = document.getElementById('miora-mobile-menu');
    const iconOpen = document.getElementById('miora-menu-icon-open');
    const iconClose = document.getElementById('miora-menu-icon-close');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.toggle('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', String(!isHidden));
            iconOpen?.classList.toggle('hidden', !isHidden);
            iconClose?.classList.toggle('hidden', isHidden);
        });
    }

    // 2. Initialize Active Page Modules
    initPhotoboothPage();
    initEditorPage();
    initResultPage();
});
