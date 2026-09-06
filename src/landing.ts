import { TRANSLATIONS, Language, TranslationData } from './i18n';

let currentLang: Language = 'es';
let currentRoleTab = 'biz';

function getInitialLanguage(): Language {
  const saved = localStorage.getItem('webmcp_lang');
  if (saved && (saved === 'es' || saved === 'en' || saved === 'pt')) {
    return saved;
  }
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('pt')) return 'pt';
  return 'es';
}

function setLanguage(lang: Language) {
  currentLang = lang;
  localStorage.setItem('webmcp_lang', lang);
  document.documentElement.lang = lang;

  // Update active state in selector buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  applyTranslations(TRANSLATIONS[lang]);
}

function applyTranslations(t: TranslationData) {
  // 1. Navigation
  const navLinks = document.querySelectorAll('.nav-links a');
  if (navLinks.length >= 6) {
    navLinks[0].textContent = t.nav.whatIs;
    navLinks[1].textContent = t.nav.tools;
    navLinks[2].textContent = t.nav.advantages;
    navLinks[3].textContent = t.nav.howTo;
    navLinks[4].textContent = t.nav.useCases;
    navLinks[5].textContent = t.nav.faq;
  }
  const navBtnTxt = document.getElementById('txt-nav-open');
  if (navBtnTxt) navBtnTxt.textContent = t.nav.openStudio;

  // 2. Hero Section
  const heroPill = document.querySelector('.hero-pill span:last-child');
  if (heroPill) heroPill.textContent = t.hero.pill.replace('✨ ', '');

  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) heroTitle.innerHTML = t.hero.title;

  const heroSubtitle = document.querySelector('.hero-subtitle');
  if (heroSubtitle) heroSubtitle.innerHTML = t.hero.subtitle;

  // Hero CTAs
  const ctaStudio = document.querySelector('.btn-hero-primary .cta-text');
  if (ctaStudio) {
    ctaStudio.innerHTML = `<strong>${t.hero.ctaStudioTitle}</strong><span>${t.hero.ctaStudioDesc}</span>`;
  }
  const secondaryCtas = document.querySelectorAll('.btn-hero-secondary .cta-text');
  if (secondaryCtas.length >= 2) {
    secondaryCtas[0].innerHTML = `<strong>${t.hero.ctaSqliteTitle}</strong><span>${t.hero.ctaSqliteDesc}</span>`;
    secondaryCtas[1].innerHTML = `<strong>${t.hero.ctaMockarooTitle}</strong><span>${t.hero.ctaMockarooDesc}</span>`;
  }

  // Capabilities bar
  const capItems = document.querySelectorAll('.capabilities-bar .cap-item');
  if (capItems.length >= 4) {
    capItems[0].innerHTML = `<span class="cap-dot green"></span> ${t.hero.capZeroInstall}`;
    capItems[1].innerHTML = `<span class="cap-dot green"></span> ${t.hero.capPrivate}`;
    capItems[2].innerHTML = `<span class="cap-dot green"></span> ${t.hero.capZeroCost}`;
    capItems[3].innerHTML = `<span class="cap-dot green"></span> ${t.hero.capOffline}`;
  }

  // 3. Paradigm section
  const pTag = document.querySelector('#que-es .section-tag');
  if (pTag) pTag.textContent = t.paradigm.tag;

  const pTitle = document.querySelector('#que-es .section-title');
  if (pTitle) pTitle.textContent = t.paradigm.title;

  const pSubtitle = document.querySelector('#que-es .section-subtitle');
  if (pSubtitle) pSubtitle.textContent = t.paradigm.subtitle;

  const oldCard = document.querySelector('.paradigm-card.old-way');
  if (oldCard) {
    const badge = oldCard.querySelector('.card-status-badge');
    if (badge) badge.textContent = t.paradigm.oldBadge;
    const h3 = oldCard.querySelector('h3');
    if (h3) h3.textContent = t.paradigm.oldTitle;
    const items = oldCard.querySelectorAll('li');
    if (items.length >= 4) {
      items[0].innerHTML = t.paradigm.oldItem1;
      items[1].innerHTML = t.paradigm.oldItem2;
      items[2].innerHTML = t.paradigm.oldItem3;
      items[3].innerHTML = t.paradigm.oldItem4;
    }
  }

  const newCard = document.querySelector('.paradigm-card.new-way');
  if (newCard) {
    const badge = newCard.querySelector('.card-status-badge');
    if (badge) badge.textContent = t.paradigm.newBadge;
    const h3 = newCard.querySelector('h3');
    if (h3) h3.textContent = t.paradigm.newTitle;
    const items = newCard.querySelectorAll('li');
    if (items.length >= 4) {
      items[0].innerHTML = t.paradigm.newItem1;
      items[1].innerHTML = t.paradigm.newItem2;
      items[2].innerHTML = t.paradigm.newItem3;
      items[3].innerHTML = t.paradigm.newItem4;
    }
  }

  // 4. Tools section
  const tTag = document.querySelector('#herramientas .section-tag');
  if (tTag) tTag.textContent = t.toolsSection.tag;

  const tTitle = document.querySelector('#herramientas .section-title');
  if (tTitle) tTitle.textContent = t.toolsSection.title;

  const tSubtitle = document.querySelector('#herramientas .section-subtitle');
  if (tSubtitle) tSubtitle.textContent = t.toolsSection.subtitle;

  const toolCards = document.querySelectorAll('.tool-showcase-card');
  if (toolCards.length >= 3) {
    // Card 1: Code Studio
    toolCards[0].querySelector('.tool-card-badge')!.textContent = t.toolsSection.badgeDev;
    toolCards[0].querySelector('.tool-tagline')!.textContent = t.toolsSection.codeStudioTagline;
    toolCards[0].querySelector('.tool-description')!.textContent = t.toolsSection.codeStudioDesc;
    toolCards[0].querySelector('.card-action-btn')!.innerHTML = t.toolsSection.codeStudioBtn;

    // Card 2: SQLite Studio
    toolCards[1].querySelector('.tool-card-badge')!.textContent = t.toolsSection.badgeDb;
    toolCards[1].querySelector('.tool-tagline')!.textContent = t.toolsSection.sqliteTagline;
    toolCards[1].querySelector('.tool-description')!.textContent = t.toolsSection.sqliteDesc;
    toolCards[1].querySelector('.card-action-btn')!.innerHTML = t.toolsSection.sqliteBtn;

    // Card 3: Mockaroo
    toolCards[2].querySelector('.tool-card-badge')!.textContent = t.toolsSection.badgeGen;
    toolCards[2].querySelector('.tool-tagline')!.textContent = t.toolsSection.mockarooTagline;
    toolCards[2].querySelector('.tool-description')!.textContent = t.toolsSection.mockarooDesc;
    toolCards[2].querySelector('.card-action-btn')!.innerHTML = t.toolsSection.mockarooBtn;
  }

  // 5. Comparison Matrix
  const compTag = document.querySelector('#ventajas .section-tag');
  if (compTag) compTag.textContent = t.comparison.tag;

  const compTitle = document.querySelector('#ventajas .section-title');
  if (compTitle) compTitle.textContent = t.comparison.title;

  const compSubtitle = document.querySelector('#ventajas .section-subtitle');
  if (compSubtitle) compSubtitle.textContent = t.comparison.subtitle;

  const compHeaders = document.querySelectorAll('.comparison-table th');
  if (compHeaders.length >= 4) {
    compHeaders[0].textContent = t.comparison.colFeature;
    compHeaders[1].textContent = t.comparison.colTrad;
    compHeaders[2].textContent = t.comparison.colCloud;
    compHeaders[3].textContent = t.comparison.colWebmcp;
  }

  const compRows = document.querySelectorAll('.comparison-table tbody tr');
  if (compRows.length >= 6) {
    // Row 1
    compRows[0].children[0].innerHTML = `<strong>${t.comparison.rowStart}</strong>`;
    compRows[0].children[1].textContent = t.comparison.rowStartTrad;
    compRows[0].children[2].textContent = t.comparison.rowStartCloud;
    compRows[0].children[3].innerHTML = `<strong class="text-green">${t.comparison.rowStartWebmcp}</strong>`;

    // Row 2
    compRows[1].children[0].innerHTML = `<strong>${t.comparison.rowCost}</strong>`;
    compRows[1].children[1].textContent = t.comparison.rowCostTrad;
    compRows[1].children[2].textContent = t.comparison.rowCostCloud;
    compRows[1].children[3].innerHTML = `<strong class="text-green">${t.comparison.rowCostWebmcp}</strong>`;

    // Row 3
    compRows[2].children[0].innerHTML = `<strong>${t.comparison.rowPrivacy}</strong>`;
    compRows[2].children[1].textContent = t.comparison.rowPrivacyTrad;
    compRows[2].children[2].textContent = t.comparison.rowPrivacyCloud;
    compRows[2].children[3].innerHTML = `<strong class="text-green">${t.comparison.rowPrivacyWebmcp}</strong>`;

    // Row 4
    compRows[3].children[0].innerHTML = `<strong>${t.comparison.rowOffline}</strong>`;
    compRows[3].children[1].textContent = t.comparison.rowOfflineTrad;
    compRows[3].children[2].textContent = t.comparison.rowOfflineCloud;
    compRows[3].children[3].innerHTML = `<strong class="text-green">${t.comparison.rowOfflineWebmcp}</strong>`;

    // Row 5
    compRows[4].children[0].innerHTML = `<strong>${t.comparison.rowAi}</strong>`;
    compRows[4].children[1].textContent = t.comparison.rowAiTrad;
    compRows[4].children[2].textContent = t.comparison.rowAiCloud;
    compRows[4].children[3].innerHTML = `<strong class="text-green">${t.comparison.rowAiWebmcp}</strong>`;

    // Row 6
    compRows[5].children[0].innerHTML = `<strong>${t.comparison.rowNonTech}</strong>`;
    compRows[5].children[1].textContent = t.comparison.rowNonTechTrad;
    compRows[5].children[2].textContent = t.comparison.rowNonTechCloud;
    compRows[5].children[3].innerHTML = `<strong class="text-green">${t.comparison.rowNonTechWebmcp}</strong>`;
  }

  // 6. How to use (3 steps)
  const howTag = document.querySelector('#como-usar .section-tag');
  if (howTag) howTag.textContent = t.howTo.tag;

  const howTitle = document.querySelector('#como-usar .section-title');
  if (howTitle) howTitle.textContent = t.howTo.title;

  const howSubtitle = document.querySelector('#como-usar .section-subtitle');
  if (howSubtitle) howSubtitle.textContent = t.howTo.subtitle;

  const stepCards = document.querySelectorAll('.step-card');
  if (stepCards.length >= 3) {
    stepCards[0].querySelector('h3')!.textContent = t.howTo.step1Title;
    stepCards[0].querySelector('p')!.textContent = t.howTo.step1Desc;

    stepCards[1].querySelector('h3')!.textContent = t.howTo.step2Title;
    stepCards[1].querySelector('p')!.textContent = t.howTo.step2Desc;

    stepCards[2].querySelector('h3')!.textContent = t.howTo.step3Title;
    stepCards[2].querySelector('p')!.textContent = t.howTo.step3Desc;
  }

  // 7. Role Selector
  const rTag = document.querySelector('#perfiles .section-tag');
  if (rTag) rTag.textContent = t.roles.tag;

  const rTitle = document.querySelector('#perfiles .section-title');
  if (rTitle) rTitle.textContent = t.roles.title;

  const rSubtitle = document.querySelector('#perfiles .section-subtitle');
  if (rSubtitle) rSubtitle.textContent = t.roles.subtitle;

  const roleTabs = document.querySelectorAll('.role-tab');
  if (roleTabs.length >= 4) {
    roleTabs[0].textContent = t.roles.tabBiz;
    roleTabs[1].textContent = t.roles.tabAnalyst;
    roleTabs[2].textContent = t.roles.tabEdu;
    roleTabs[3].textContent = t.roles.tabDev;
  }
  renderActiveRole();

  // 8. FAQ
  const faqTag = document.querySelector('#faq .section-tag');
  if (faqTag) faqTag.textContent = t.faq.tag;

  const faqTitle = document.querySelector('#faq .section-title');
  if (faqTitle) faqTitle.textContent = t.faq.title;

  const faqSubtitle = document.querySelector('#faq .section-subtitle');
  if (faqSubtitle) faqSubtitle.textContent = t.faq.subtitle;

  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length >= 5) {
    faqItems[0].querySelector('.faq-question span:first-child')!.textContent = t.faq.q1;
    faqItems[0].querySelector('.faq-answer p')!.innerHTML = t.faq.a1;

    faqItems[1].querySelector('.faq-question span:first-child')!.textContent = t.faq.q2;
    faqItems[1].querySelector('.faq-answer p')!.innerHTML = t.faq.a2;

    faqItems[2].querySelector('.faq-question span:first-child')!.textContent = t.faq.q3;
    faqItems[2].querySelector('.faq-answer p')!.innerHTML = t.faq.a3;

    faqItems[3].querySelector('.faq-question span:first-child')!.textContent = t.faq.q4;
    faqItems[3].querySelector('.faq-answer p')!.innerHTML = t.faq.a4;

    faqItems[4].querySelector('.faq-question span:first-child')!.textContent = t.faq.q5;
    faqItems[4].querySelector('.faq-answer p')!.innerHTML = t.faq.a5;
  }

  // 9. Bottom CTA Banner
  const botTitle = document.querySelector('.cta-banner-title');
  if (botTitle) botTitle.textContent = t.bottomCta.title;

  const botSubtitle = document.querySelector('.cta-banner-subtitle');
  if (botSubtitle) botSubtitle.textContent = t.bottomCta.subtitle;

  const botStudioBtn = document.querySelector('.cta-banner-buttons .btn-hero-primary');
  if (botStudioBtn) botStudioBtn.innerHTML = `<span>🚀</span> ${t.bottomCta.btnStudio.replace('🚀 ', '')}`;

  const botGithubBtn = document.querySelector('.cta-banner-buttons .btn-hero-secondary');
  if (botGithubBtn) botGithubBtn.innerHTML = `<span>⭐</span> ${t.bottomCta.btnGithub.replace('⭐ ', '')}`;

  // 10. Footer
  const footerText = document.querySelector('.footer-text');
  if (footerText) footerText.textContent = t.footer.text;

  const footerCopy = document.querySelector('.footer-copy');
  if (footerCopy) footerCopy.textContent = t.footer.copy;

  const footerHeaders = document.querySelectorAll('.footer-links-group h4');
  if (footerHeaders.length >= 2) {
    footerHeaders[0].textContent = t.footer.trilogyTitle;
    footerHeaders[1].textContent = t.footer.resourcesTitle;
  }
}

function renderActiveRole() {
  const displayContainer = document.getElementById('role-content');
  if (!displayContainer) return;
  const t = TRANSLATIONS[currentLang];

  let title = t.roles.bizTitle;
  let tagline = t.roles.bizTagline;
  let desc = t.roles.bizDesc;
  let workflow = t.roles.bizWorkflow;
  let benefits = [t.roles.bizB1, t.roles.bizB2, t.roles.bizB3];

  if (currentRoleTab === 'analyst') {
    title = t.roles.analystTitle;
    tagline = t.roles.analystTagline;
    desc = t.roles.analystDesc;
    workflow = t.roles.analystWorkflow;
    benefits = [t.roles.analystB1, t.roles.analystB2, t.roles.analystB3];
  } else if (currentRoleTab === 'edu') {
    title = t.roles.eduTitle;
    tagline = t.roles.eduTagline;
    desc = t.roles.eduDesc;
    workflow = t.roles.eduWorkflow;
    benefits = [t.roles.eduB1, t.roles.eduB2, t.roles.eduB3];
  } else if (currentRoleTab === 'dev') {
    title = t.roles.devTitle;
    tagline = t.roles.devTagline;
    desc = t.roles.devDesc;
    workflow = t.roles.devWorkflow;
    benefits = [t.roles.devB1, t.roles.devB2, t.roles.devB3];
  }

  displayContainer.innerHTML = `
    <div class="role-content-box">
      <h3>${title}</h3>
      <p class="role-tagline">${tagline}</p>
      <p style="margin-bottom: 14px; line-height: 1.6;">${desc}</p>
      <div class="role-workflow">
        <strong>💡 ${workflow}</strong>
      </div>
      <h4 style="font-size: 14px; color: #fff; margin-bottom: 10px;">${t.roles.keyBenefitsLabel}</h4>
      <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">
        ${benefits.map(b => `<li style="font-size: 13px;">✨ ${b}</li>`).join('')}
      </ul>
    </div>
  `;
}

function initRoleSelector() {
  const tabs = document.querySelectorAll('.role-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const role = tab.getAttribute('data-role');
      if (role === 'analista') currentRoleTab = 'analyst';
      else if (role === 'educacion') currentRoleTab = 'edu';
      else if (role === 'dev') currentRoleTab = 'dev';
      else currentRoleTab = 'biz';
      renderActiveRole();
    });
  });
}

function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      if (!item) return;

      const isOpen = item.classList.contains('active');
      const answer = item.querySelector('.faq-answer') as HTMLElement;

      document.querySelectorAll('.faq-item').forEach(other => {
        other.classList.remove('active');
        const otherAnswer = other.querySelector('.faq-answer') as HTMLElement;
        if (otherAnswer) otherAnswer.style.maxHeight = '0';
      });

      if (!isOpen && answer) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

function initLanguageSelector() {
  const buttons = document.querySelectorAll('.lang-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang') as Language;
      if (lang && (lang === 'es' || lang === 'en' || lang === 'pt')) {
        setLanguage(lang);
      }
    });
  });

  // Set initial
  setLanguage(getInitialLanguage());
}

function initLiveCapabilities() {
  const bar = document.getElementById('capabilities-bar');
  if (!bar) return;

  if ('performance' in window && (performance as any).memory) {
    const mem = Math.round((performance as any).memory.jsHeapSizeLimit / (1024 * 1024));
    const memEl = document.createElement('div');
    memEl.className = 'cap-item';
    memEl.innerHTML = `<span class="cap-dot green"></span> <strong>Memoria:</strong> ~${mem} MB`;
    bar.appendChild(memEl);
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initRoleSelector();
  initFaqAccordion();
  initLiveCapabilities();
  initLanguageSelector();
});
