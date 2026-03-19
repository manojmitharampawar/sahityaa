/**
 * Book Reader — Client-Side Pagination Engine
 * Splits rendered markdown content into pages at heading boundaries.
 */

// ─── Types ───────────────────────────────────────────────

export interface PageData {
  index: number;
  elements: HTMLElement[];
  headingText?: string;
}

export interface BookReaderOptions {
  /** CSS selector for the content container */
  contentSelector: string;
  /** CSS selector for the book page display area */
  pageSelector: string;
  /** Number of shlokas (heading groups) per page */
  shlokasPerPage: number;
  /** Callback when page changes */
  onPageChange?: (page: number, total: number) => void;
}

// ─── Constants ───────────────────────────────────────────

const DEFAULT_SHLOKAS_PER_PAGE = 5;

// ─── BookReader Class ────────────────────────────────────

export class BookReader {
  private pages: PageData[] = [];
  private currentPage = 0;
  private contentEl: HTMLElement | null = null;
  private pageEl: HTMLElement | null = null;
  private opts: BookReaderOptions;
  private touchStartX = 0;
  private touchStartY = 0;
  private isAnimating = false;

  constructor(opts: Partial<BookReaderOptions> & { contentSelector: string; pageSelector: string }) {
    this.opts = {
      shlokasPerPage: DEFAULT_SHLOKAS_PER_PAGE,
      ...opts,
    };
  }

  /** Initialize: parse content, build pages, set up navigation */
  init(): boolean {
    this.contentEl = document.querySelector<HTMLElement>(this.opts.contentSelector);
    this.pageEl = document.querySelector<HTMLElement>(this.opts.pageSelector);

    if (!this.contentEl || !this.pageEl) return false;

    this.buildPages();
    if (this.pages.length === 0) return false;

    this.setupKeyboard();
    this.setupSwipe();
    this.renderPage(0, 'none');

    return true;
  }

  // ─── Page Building ───────────────────────────────────

  private buildPages() {
    if (!this.contentEl) return;

    const children = Array.from(this.contentEl.children) as HTMLElement[];
    if (children.length === 0) return;

    // Identify heading elements that act as section boundaries
    const headingTags = new Set(['H2', 'H3', 'H4']);

    // Group content by heading boundaries
    const groups: { heading?: HTMLElement; elements: HTMLElement[] }[] = [];
    let currentGroup: { heading?: HTMLElement; elements: HTMLElement[] } = { elements: [] };

    for (const el of children) {
      if (headingTags.has(el.tagName)) {
        // Dividers right before a heading belong to the previous group
        if (currentGroup.elements.length > 0 || currentGroup.heading) {
          groups.push(currentGroup);
        }
        currentGroup = { heading: el, elements: [] };
      } else {
        currentGroup.elements.push(el);
      }
    }
    // Push the last group
    if (currentGroup.elements.length > 0 || currentGroup.heading) {
      groups.push(currentGroup);
    }

    // If only a few groups, put everything on one page
    if (groups.length <= this.opts.shlokasPerPage) {
      const allElements: HTMLElement[] = [];
      let headingText: string | undefined;
      for (const g of groups) {
        if (g.heading) {
          if (!headingText) headingText = g.heading.textContent?.trim();
          allElements.push(g.heading);
        }
        allElements.push(...g.elements);
      }
      this.pages = [{ index: 0, elements: allElements, headingText }];
      return;
    }

    // Batch groups into pages of N shlokas each
    const perPage = this.opts.shlokasPerPage;
    let pageIndex = 0;

    for (let i = 0; i < groups.length; i += perPage) {
      const batch = groups.slice(i, i + perPage);
      const elements: HTMLElement[] = [];
      let firstHeading: string | undefined;
      let lastHeading: string | undefined;

      for (const g of batch) {
        if (g.heading) {
          const text = g.heading.textContent?.trim();
          if (text) {
            if (!firstHeading) firstHeading = text;
            lastHeading = text;
          }
          elements.push(g.heading);
        }
        elements.push(...g.elements);
      }

      // Build a range heading like "श्लोक 1 — श्लोक 5"
      let headingText: string | undefined;
      if (firstHeading && lastHeading && firstHeading !== lastHeading) {
        headingText = `${firstHeading} — ${lastHeading}`;
      } else if (firstHeading) {
        headingText = firstHeading;
      }

      this.pages.push({ index: pageIndex, elements, headingText });
      pageIndex++;
    }
  }

  // ─── Rendering ───────────────────────────────────────

  private renderPage(pageIndex: number, direction: 'forward' | 'backward' | 'none') {
    if (!this.pageEl || pageIndex < 0 || pageIndex >= this.pages.length) return;
    if (this.isAnimating) return;

    const page = this.pages[pageIndex];
    this.currentPage = pageIndex;

    // Helper to swap content
    const swapContent = () => {
      this.pageEl!.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (const el of page.elements) {
        fragment.appendChild(el.cloneNode(true));
      }
      this.pageEl!.appendChild(fragment);
      this.pageEl!.scrollTop = 0;
    };

    if (direction === 'none') {
      swapContent();
      this.opts.onPageChange?.(pageIndex, this.pages.length);
      return;
    }

    // Kindle-style slide animation (consistent on all devices)
    this.isAnimating = true;
    const container = this.pageEl;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      container.classList.add('page-fade-out');
      setTimeout(() => {
        swapContent();
        container.classList.remove('page-fade-out');
        container.classList.add('page-fade-in');
        setTimeout(() => {
          container.classList.remove('page-fade-in');
          this.isAnimating = false;
        }, 200);
      }, 150);
    } else {
      // Kindle-style horizontal slide
      const slideOut = direction === 'forward' ? 'page-slide-out-left' : 'page-slide-out-right';
      const slideIn = direction === 'forward' ? 'page-slide-in-right' : 'page-slide-in-left';

      container.classList.add(slideOut);
      setTimeout(() => {
        swapContent();
        container.classList.remove(slideOut);
        container.classList.add(slideIn);
        setTimeout(() => {
          container.classList.remove(slideIn);
          this.isAnimating = false;
        }, 320);
      }, 280);
    }

    this.opts.onPageChange?.(pageIndex, this.pages.length);
  }

  // ─── Navigation ──────────────────────────────────────

  nextPage() {
    if (this.currentPage < this.pages.length - 1) {
      this.renderPage(this.currentPage + 1, 'forward');
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.renderPage(this.currentPage - 1, 'backward');
    }
  }

  goToPage(n: number) {
    const clamped = Math.max(0, Math.min(this.pages.length - 1, n));
    const direction = clamped > this.currentPage ? 'forward' : clamped < this.currentPage ? 'backward' : 'none';
    this.renderPage(clamped, direction);
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getTotalPages(): number {
    return this.pages.length;
  }

  /** Get all page heading texts for TOC */
  getTableOfContents(): { index: number; heading: string }[] {
    return this.pages.map(p => ({
      index: p.index,
      heading: p.headingText || `Page ${p.index + 1}`,
    }));
  }

  // ─── Keyboard Navigation ────────────────────────────

  private setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't interfere with inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          this.nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prevPage();
          break;
        case ' ':
          // Space = next page (like an e-reader)
          if (!e.shiftKey) {
            e.preventDefault();
            this.nextPage();
          }
          break;
        case 'Home':
          e.preventDefault();
          this.goToPage(0);
          break;
        case 'End':
          e.preventDefault();
          this.goToPage(this.pages.length - 1);
          break;
      }
    });
  }

  // ─── Swipe Navigation ───────────────────────────────

  private setupSwipe() {
    const el = this.pageEl;
    if (!el) return;

    el.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;

      // Only trigger on horizontal swipes (not vertical scrolling)
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) {
          this.nextPage(); // Swipe left → next page
        } else {
          this.prevPage(); // Swipe right → prev page
        }
      }
    }, { passive: true });
  }

  /** Destroy and cleanup */
  destroy() {
    // Re-insert all original content back (in case needed)
    if (this.contentEl && this.pageEl) {
      this.pageEl.innerHTML = '';
      for (const page of this.pages) {
        for (const el of page.elements) {
          this.pageEl.appendChild(el);
        }
      }
    }
    this.pages = [];
    this.currentPage = 0;
  }
}
