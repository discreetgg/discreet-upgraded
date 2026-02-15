'use client';

import { useEffect } from 'react';

const LOCK_ROOT_SELECTOR = [
  '[data-slot="sheet-overlay"][data-state="open"]',
  '[data-slot="sheet-content"][data-state="open"]',
  '[data-slot="dialog-overlay"][data-state="open"]',
  '[data-slot="dialog-content"][data-state="open"]',
  '[data-slot="alert-dialog-overlay"][data-state="open"]',
  '[data-slot="alert-dialog-content"][data-state="open"]',
  '[data-scroll-lock-modal="true"]',
  '[role="dialog"]',
].join(', ');

const isElementVisiblyBlocking = (element: Element) => {
  const style = window.getComputedStyle(element as HTMLElement);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.pointerEvents === 'none' ||
    Number(style.opacity || '1') === 0
  ) {
    return false;
  }

  const rect = (element as HTMLElement).getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const hasVisibleBlockingLayer = () => {
  const candidates = Array.from(document.querySelectorAll(LOCK_ROOT_SELECTOR));
  return candidates.some((element) => isElementVisiblyBlocking(element));
};

const isScrollLocked = () => {
  const { body, documentElement } = document;
  return (
    body.hasAttribute('data-scroll-locked') ||
    body.style.overflow === 'hidden' ||
    body.style.pointerEvents === 'none' ||
    body.style.paddingRight !== '' ||
    documentElement.style.overflow === 'hidden' ||
    documentElement.style.paddingRight !== ''
  );
};

const clearStaleScrollLock = () => {
  if (hasVisibleBlockingLayer()) {
    return;
  }

  if (!isScrollLocked()) {
    return;
  }

  const { body, documentElement } = document;
  body.removeAttribute('data-scroll-locked');
  body.style.overflow = '';
  body.style.pointerEvents = '';
  body.style.paddingRight = '';
  body.style.removeProperty('--removed-body-scroll-bar-size');

  documentElement.style.overflow = '';
  documentElement.style.paddingRight = '';
};

export const StaleScrollLockGuard = () => {
  useEffect(() => {
    const heal = () => {
      clearStaleScrollLock();
    };

    heal();

    const observer = new MutationObserver(heal);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-scroll-locked', 'data-state'],
    });

    const interval = window.setInterval(heal, 500);

    window.addEventListener('focus', heal);
    window.addEventListener('pageshow', heal);
    window.addEventListener('resize', heal);
    window.addEventListener('orientationchange', heal);
    window.addEventListener('popstate', heal);
    window.addEventListener('wheel', heal, { passive: true });
    window.addEventListener('pointerdown', heal);
    window.addEventListener('keydown', heal);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.removeEventListener('focus', heal);
      window.removeEventListener('pageshow', heal);
      window.removeEventListener('resize', heal);
      window.removeEventListener('orientationchange', heal);
      window.removeEventListener('popstate', heal);
      window.removeEventListener('wheel', heal);
      window.removeEventListener('pointerdown', heal);
      window.removeEventListener('keydown', heal);
    };
  }, []);

  return null;
};
