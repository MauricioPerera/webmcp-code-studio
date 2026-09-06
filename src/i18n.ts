// Internationalization (i18n) dictionary for WebMCP Landing Page

export type Language = 'es' | 'en' | 'pt';

export interface TranslationData {
  nav: {
    whatIs: string;
    tools: string;
    advantages: string;
    howTo: string;
    useCases: string;
    faq: string;
    openStudio: string;
  };
  hero: {
    pill: string;
    title: string;
    subtitle: string;
    ctaStudioTitle: string;
    ctaStudioDesc: string;
    ctaSqliteTitle: string;
    ctaSqliteDesc: string;
    ctaMockarooTitle: string;
    ctaMockarooDesc: string;
    capZeroInstall: string;
    capPrivate: string;
    capZeroCost: string;
    capOffline: string;
    capMemory: string;
  };
  paradigm: {
    tag: string;
    title: string;
    subtitle: string;
    oldBadge: string;
    oldTitle: string;
    oldItem1: string;
    oldItem2: string;
    oldItem3: string;
    oldItem4: string;
    newBadge: string;
    newTitle: string;
    newItem1: string;
    newItem2: string;
    newItem3: string;
    newItem4: string;
  };
  toolsSection: {
    tag: string;
    title: string;
    subtitle: string;
    badgeDev: string;
    badgeDb: string;
    badgeGen: string;
    codeStudioTagline: string;
    codeStudioDesc: string;
    codeStudioBtn: string;
    sqliteTagline: string;
    sqliteDesc: string;
    sqliteBtn: string;
    mockarooTagline: string;
    mockarooDesc: string;
    mockarooBtn: string;
  };
  comparison: {
    tag: string;
    title: string;
    subtitle: string;
    colFeature: string;
    colTrad: string;
    colCloud: string;
    colWebmcp: string;
    rowStart: string;
    rowStartTrad: string;
    rowStartCloud: string;
    rowStartWebmcp: string;
    rowCost: string;
    rowCostTrad: string;
    rowCostCloud: string;
    rowCostWebmcp: string;
    rowPrivacy: string;
    rowPrivacyTrad: string;
    rowPrivacyCloud: string;
    rowPrivacyWebmcp: string;
    rowOffline: string;
    rowOfflineTrad: string;
    rowOfflineCloud: string;
    rowOfflineWebmcp: string;
    rowAi: string;
    rowAiTrad: string;
    rowAiCloud: string;
    rowAiWebmcp: string;
    rowNonTech: string;
    rowNonTechTrad: string;
    rowNonTechCloud: string;
    rowNonTechWebmcp: string;
  };
  howTo: {
    tag: string;
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  roles: {
    tag: string;
    title: string;
    subtitle: string;
    tabBiz: string;
    tabAnalyst: string;
    tabEdu: string;
    tabDev: string;
    bizTitle: string;
    bizTagline: string;
    bizDesc: string;
    bizWorkflow: string;
    bizB1: string;
    bizB2: string;
    bizB3: string;
    analystTitle: string;
    analystTagline: string;
    analystDesc: string;
    analystWorkflow: string;
    analystB1: string;
    analystB2: string;
    analystB3: string;
    eduTitle: string;
    eduTagline: string;
    eduDesc: string;
    eduWorkflow: string;
    eduB1: string;
    eduB2: string;
    eduB3: string;
    devTitle: string;
    devTagline: string;
    devDesc: string;
    devWorkflow: string;
    devB1: string;
    devB2: string;
    devB3: string;
    keyBenefitsLabel: string;
  };
  faq: {
    tag: string;
    title: string;
    subtitle: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
    q5: string;
    a5: string;
  };
  bottomCta: {
    title: string;
    subtitle: string;
    btnStudio: string;
    btnGithub: string;
  };
  footer: {
    text: string;
    copy: string;
    trilogyTitle: string;
    resourcesTitle: string;
    githubLink: string;
    w3cLink: string;
    kddLink: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationData> = {
  es: {
    nav: {
      whatIs: '¿Qué es?',
      tools: 'Herramientas',
      advantages: 'Ventajas vs Otros',
      howTo: 'Cómo Usar',
      useCases: 'Casos de Uso',
      faq: 'Preguntas',
      openStudio: '🚀 Abrir Code Studio',
    },
    hero: {
      pill: '✨ La Nueva Era de Creación con Inteligencia Artificial',
      title: 'Crea software, bases de datos y analítica <br class="desktop-only" /><span class="gradient-text">directamente en tu navegador.</span>',
      subtitle: 'Sin instalar nada. Sin servidores en la nube. 100% privado en tu computadora.<br />Diseñado para que <strong>personas sin conocimientos técnicos</strong> puedan prototipar ideas en minutos, y para que <strong>equipos avanzados</strong> cuenten con herramientas nativas para Agentes de IA.',
      ctaStudioTitle: 'Abrir WebMCP Code Studio',
      ctaStudioDesc: 'Estudio de desarrollo visual tipo VS Code',
      ctaSqliteTitle: 'Abrir SQLite Studio',
      ctaSqliteDesc: 'Base de datos relacional instantánea',
      ctaMockarooTitle: 'Abrir Mockaroo WebMCP',
      ctaMockarooDesc: 'Generador de datos realistas',
      capZeroInstall: '0 Instalación: Abre y usa en cualquier navegador moderno',
      capPrivate: '100% Privado: Tus datos nunca abandonan tu máquina',
      capZeroCost: '$0 Costo: Sin pagos mensuales ni sorpresas en la nube',
      capOffline: 'Offline-Ready: Funciona incluso sin internet',
      capMemory: 'Memoria Navegador:',
    },
    paradigm: {
      tag: 'EL CAMBIO DE PARADIGMA',
      title: '¿Qué es WebMCP y por qué cambia el juego?',
      subtitle: 'Hasta hoy, usar Inteligencia Artificial para crear software requería instalar programas difíciles, configurar servidores y pagar costosas suscripciones mensuales.',
      oldBadge: 'El Enfoque Tradicional (Complejo)',
      oldTitle: 'Antes: Fricción, Esperas y Riesgos',
      oldItem1: '❌ <strong>Instalaciones agotadoras:</strong> Descargar Node.js, Python, Docker, editores de 500 MB y resolver errores de consola.',
      oldItem2: '❌ <strong>Facturas sorpresa en la nube:</strong> Pagar por servidores, bases de datos remotas y cobros recurrentes por uso de cómputo.',
      oldItem3: '❌ <strong>Pérdida de privacidad:</strong> Tus archivos y bases de datos sensibles se suben a servidores externos de terceros.',
      oldItem4: '❌ <strong>IA con "manos atadas":</strong> La IA solo te da texto; tienes que copiar, pegar y adivinar dónde poner cada archivo.',
      newBadge: 'La Revolución WebMCP (Local-First)',
      newTitle: 'Ahora: La Plataforma Web es tu Computadora',
      newItem1: '✅ <strong>Un solo clic en el navegador:</strong> Entras al enlace y todo está listo para usar en 1 segundo. Sin descargas.',
      newItem2: '✅ <strong>100% Gratuito y de Código Abierto:</strong> Al ejecutarse en tu propio navegador, el costo de servidores es exactamente $0.',
      newItem3: '✅ <strong>Máxima Seguridad y Privacidad:</strong> Tus datos viven en la memoria de tu dispositivo. Nadie más los ve.',
      newItem4: '✅ <strong>IA con "Manos Virtuales":</strong> Con el estándar W3C WebMCP, los agentes de IA crean archivos, corren pruebas y consultan datos por ti de forma autónoma y controlada.',
    },
    toolsSection: {
      tag: 'EL ECOSISTEMA INTEGRADO',
      title: 'Las 3 Herramientas de la Suite WebMCP',
      subtitle: 'Tres aplicaciones estáticas e independientes que se comunican entre sí para cubrir todo el ciclo: desde la generación de datos hasta la programación y el almacenamiento relacional.',
      badgeDev: 'Estudio de Desarrollo',
      badgeDb: 'Base de Datos',
      badgeGen: 'Generador de Datos',
      codeStudioTagline: 'Tu propio entorno tipo Visual Studio Code en una pestaña web.',
      codeStudioDesc: 'Crea páginas web, aplicaciones interactivas y scripts. Incluye un sistema de archivos virtual, previsualización en tiempo real, control de versiones Git completo y una terminal Unix para ejecutar comandos.',
      codeStudioBtn: 'Abrir Code Studio →',
      sqliteTagline: 'Base de datos relacional ultrarrápida impulsada por WebAssembly.',
      sqliteDesc: 'Guarda información organizada en tablas, ejecuta consultas SQL complejas e importa o exporta datos en JSON con un clic. Procesa millones de operaciones en milisegundos sin necesidad de instalar bases de datos pesadas.',
      sqliteBtn: 'Abrir SQLite Studio →',
      mockarooTagline: 'Crea datasets realistas para prototipos y demostraciones.',
      mockarooDesc: 'Nunca más inventes datos de muestra a mano. Genera en segundos listas completas de clientes, ventas, productos o direcciones con más de 69 tipos de datos realistas listos para importar a tu base de datos o aplicación.',
      mockarooBtn: 'Abrir Mockaroo →',
    },
    comparison: {
      tag: 'ANÁLISIS COMPARATIVO',
      title: '¿Por qué elegir WebMCP frente a alternativas?',
      subtitle: 'Comparamos nuestra suite contra los editores locales tradicionales y las plataformas de pago en la nube.',
      colFeature: 'Característica',
      colTrad: 'Editores Tradicionales (VS Code instalado)',
      colCloud: 'Plataformas Cloud (Replit / Vercel / SaaS)',
      colWebmcp: 'Suite WebMCP (Nuestra Plataforma)',
      rowStart: 'Tiempo de Inicio',
      rowStartTrad: '15 - 45 min (descarga e instalación)',
      rowStartCloud: '2 - 5 min (registro y espera de servidores)',
      rowStartWebmcp: '⚡ Menos de 1 segundo',
      rowCost: 'Costo de Operación',
      rowCostTrad: 'Gratis pero consume batería y disco',
      rowCostCloud: '$15 - $50 USD al mes por usuario',
      rowCostWebmcp: '💰 $0 USD para siempre',
      rowPrivacy: 'Privacidad de tus Datos',
      rowPrivacyTrad: 'Buena en tu disco, pero sin puente de IA',
      rowPrivacyCloud: 'Mala: tus datos viajan a servidores ajenos',
      rowPrivacyWebmcp: '🔒 100% Local en tu navegador',
      rowOffline: 'Operación sin Internet',
      rowOfflineTrad: 'Parcial (requiere paquetes descargados)',
      rowOfflineCloud: 'No (se apaga si se cae la conexión)',
      rowOfflineWebmcp: '✅ Sí (100% Offline-Ready)',
      rowAi: 'Integración con Agentes IA',
      rowAiTrad: 'Plugins fragmentados que rompen configs',
      rowAiCloud: 'Bloqueado tras muros de pago o APIs lentas',
      rowAiWebmcp: '🤖 Estándar W3C WebMCP Nativo',
      rowNonTech: 'Complejidad para No Técnicos',
      rowNonTechTrad: 'Alta (miedo a romper la terminal del sistema)',
      rowNonTechCloud: 'Media (menús y configuraciones complejas)',
      rowNonTechWebmcp: '🌱 Muy amigable e intuitivo',
    },
    howTo: {
      tag: 'GUÍA PASO A PASO',
      title: 'Cómo empezar en 3 sencillos pasos',
      subtitle: 'Cualquier persona puede pasar de una idea en su cabeza a un prototipo funcional en minutos.',
      step1Title: 'Elige una Plantilla o Genera Datos',
      step1Desc: 'Entra a WebMCP Code Studio y selecciona una plantilla prediseñada o usa Mockaroo para crear clientes y ventas de prueba con un solo clic.',
      step2Title: 'Interactúa y Modifica en Vivo',
      step2Desc: 'Escribe o pide a tu agente de IA que haga cambios por ti. Observa cómo el sitio se actualiza en tiempo real en la pantalla de previsualización.',
      step3Title: 'Guarda, Analiza o Descarga',
      step3Desc: 'Importa tus datos a SQLite Studio para crear consultas y reportes. Descarga tu proyecto en un archivo ZIP o sincronízalo a GitHub con un botón.',
    },
    roles: {
      tag: 'PERSONALIZADO PARA TI',
      title: '¿Cómo te ayuda según tu rol?',
      subtitle: 'Haz clic en tu perfil para descubrir el beneficio clave y el caso de uso ideal:',
      tabBiz: '🚀 Emprendedores y Negocio',
      tabAnalyst: '📈 Analistas y Finanzas',
      tabEdu: '🎓 Estudiantes y Docentes',
      tabDev: '👨‍💻 Desarrolladores y Diseñadores',
      bizTitle: 'Para Emprendedores y Líderes de Negocio',
      bizTagline: 'Valida ideas y crea prototipos comerciales interactivos en una tarde sin gastar en agencias ni servidores.',
      bizDesc: '¿Tienes una idea para una nueva aplicación o servicio? En lugar de pagar miles de dólares o pasar semanas explicando requerimientos a un tercero, puedes generar un set de datos de prueba en Mockaroo, pedirle a un agente de IA que construya tu interfaz en Code Studio y presentársela a tus clientes o inversores en vivo.',
      bizWorkflow: 'Flujo Recomendado: Mockaroo (Crea 50 clientes muestra) ➔ Code Studio (Genera la landing de tu producto) ➔ Comparte y valida ventas.',
      bizB1: 'Sin costos fijos mensuales de servidores mientras pruebas el mercado.',
      bizB2: 'Tus ideas de negocio y datos estratégicos quedan protegidos en tu máquina.',
      bizB3: 'Capacidad de iterar en vivo frente a clientes potenciales.',
      analystTitle: 'Para Analistas de Datos, Operaciones y Finanzas',
      analystTagline: 'Consulta, filtra y cruza datasets relacionales complejos sin depender del equipo de TI.',
      analystDesc: 'Olvídate de las hojas de cálculo congeladas con miles de filas. Con SQLite Studio importas archivos JSON o tablas masivas en segundos y puedes ejecutar agrupaciones analíticas complejas que se resuelven en menos de 1 milisegundo directamente en la memoria de tu navegador.',
      analystWorkflow: 'Flujo Recomendado: SQLite Studio (Importa tu reporte) ➔ Ejecuta consultas SQL con IA ➔ Exporta conclusiones limpias.',
      analystB1: 'Rendimiento instantáneo impulsado por WebAssembly.',
      analystB2: 'Genera reportes y volcados portables con un clic.',
      analystB3: 'No necesitas solicitar permisos para instalar software corporativo en tu máquina de trabajo.',
      eduTitle: 'Para Estudiantes, Profesores e Investigadores',
      eduTagline: 'El aula interactiva perfecta para aprender desarrollo web, bases de datos y agentes de IA sin barreras técnicas.',
      eduDesc: 'Elimina el "infierno de las instalaciones" en clase. Los alumnos solo necesitan abrir un enlace para tener un entorno completo tipo VS Code con terminal Unix y base de datos relacional operativa desde el primer segundo.',
      eduWorkflow: 'Flujo Recomendado: Elige una plantilla educativa ➔ Aprende haciendo en vivo ➔ Descarga tu proyecto en ZIP para entregar.',
      eduB1: 'Funciona en Chromebooks, laptops modestas y cualquier sistema operativo.',
      eduB2: 'Alineado con el estándar oficial W3C WebMCP para el futuro de la IA.',
      eduB3: 'Cero configuración para el profesor y cero frustración para el estudiante.',
      devTitle: 'Para Desarrolladores y Diseñadores UI/UX',
      devTagline: 'Un laboratorio ágil para experimentar con Agentes de Inteligencia Artificial.',
      devDesc: 'Explora de primera mano la especificación WebMCP del W3C. Prueba cómo Claude, GPT-4o o Gemini pueden invocar herramientas nativas en window.modelContext, controlar un sistema de archivos virtual y gestionar ramas de Git sin tocar tu entorno local.',
      devWorkflow: 'Flujo Recomendado: Abre Code Studio ➔ Conecta con fastwebmcp o agentes headless ➔ Inspecciona trazas de ejecución en vivo.',
      devB1: 'Arquitectura KDD Nivel 1 certificada con contratos y oráculos congelados.',
      devB2: 'Terminal POSIX integrada con tuberías, redirecciones y comandos Git.',
      devB3: 'Sincronización remota con GitHub y Codeberg lista para producción.',
      keyBenefitsLabel: 'Ventajas Clave:',
    },
    faq: {
      tag: 'RESOLVIENDO DUDAS',
      title: 'Preguntas Frecuentes',
      subtitle: 'Todo lo que necesitas saber antes de empezar a usar la suite.',
      q1: '¿Necesito saber programar para sacarle provecho?',
      a1: 'No necesariamente. Puedes usar Mockaroo para generar hojas de datos realistas para Excel o presentaciones, y SQLite Studio como un visor interactivo de datos. Si trabajas con agentes de IA (como Claude, ChatGPT o Gemini), ellos pueden escribir y corregir el código por ti dentro de Code Studio mientras tú solo diriges la idea.',
      q2: '¿Dónde se guardan mis archivos y datos si cierro la pestaña?',
      a2: 'La plataforma guarda automáticamente tu trabajo en el almacenamiento local seguro de tu navegador (IndexedDB y LocalStorage). Además, en cualquier momento puedes hacer clic en "Descargar ZIP" o "Exportar .sqlite" para tener una copia física en tu computadora.',
      q3: '¿Es seguro para datos confidenciales de mi empresa?',
      a3: 'Absolutamente seguro. A diferencia de las plataformas cloud donde tus archivos viajan a servidores de terceros, aquí el motor de ejecución es 100% client-side (Local-First). Nada sale de tu navegador; tu computadora procesa todo localmente.',
      q4: '¿Qué significa que use el Estándar W3C WebMCP?',
      a4: 'WebMCP (Web Model Context Protocol) es una especificación emergente del W3C que estandariza cómo los agentes de Inteligencia Artificial pueden interactuar con herramientas web. Significa que en vez de inventar integraciones frágiles, cualquier IA moderna puede "entender" y operar estas aplicaciones siguiendo un protocolo abierto y oficial.',
      q5: '¿Puedo conectar mi repositorio de GitHub?',
      a5: 'Sí. WebMCP Code Studio incluye soporte de sincronización remota con GitHub y Codeberg mediante tokens de acceso personal con permisos limitados. Puedes clonar, hacer push y pull directamente desde tu navegador.',
    },
    bottomCta: {
      title: '¿Listo para experimentar el futuro de la creación web?',
      subtitle: 'Sin registro, sin tarjetas de crédito y sin esperas. Abre una pestaña y empieza ahora mismo.',
      btnStudio: '🚀 Entrar a WebMCP Code Studio',
      btnGithub: '⭐ Ver Código Abierto en GitHub',
    },
    footer: {
      text: 'La primera suite de desarrollo, bases de datos y analítica 100% estática para navegadores modernos.',
      copy: '© 2026 Mauricio Perera & Comunidad WebMCP. Licencia MIT.',
      trilogyTitle: 'Trilogía de Aplicaciones',
      resourcesTitle: 'Recursos y Estándares',
      githubLink: 'Código en GitHub',
      w3cLink: 'W3C WebMCP Standard',
      kddLink: 'Documentación KDD',
    },
  },

  en: {
    nav: {
      whatIs: 'What is it?',
      tools: 'Tools',
      advantages: 'Advantages vs Others',
      howTo: 'How to Use',
      useCases: 'Use Cases',
      faq: 'FAQ',
      openStudio: '🚀 Open Code Studio',
    },
    hero: {
      pill: '✨ The New Era of Creation with Artificial Intelligence',
      title: 'Build software, databases, and analytics <br class="desktop-only" /><span class="gradient-text">directly in your browser.</span>',
      subtitle: 'Zero installation. No cloud servers. 100% private on your machine.<br />Designed so <strong>non-technical people</strong> can prototype ideas in minutes, and <strong>advanced teams</strong> get native tools for AI Agents.',
      ctaStudioTitle: 'Open WebMCP Code Studio',
      ctaStudioDesc: 'Visual development IDE like VS Code',
      ctaSqliteTitle: 'Open SQLite Studio',
      ctaSqliteDesc: 'Instant relational database in memory',
      ctaMockarooTitle: 'Open Mockaroo WebMCP',
      ctaMockarooDesc: 'Realistic synthetic data generator',
      capZeroInstall: '0 Installation: Open and use in any modern browser',
      capPrivate: '100% Private: Your data never leaves your device',
      capZeroCost: '$0 Cost: No monthly fees or cloud bills',
      capOffline: 'Offline-Ready: Works even without internet',
      capMemory: 'Browser Memory:',
    },
    paradigm: {
      tag: 'THE PARADIGM SHIFT',
      title: 'What is WebMCP and why does it change everything?',
      subtitle: 'Until today, using Artificial Intelligence to build software required heavy installations, server setups, and costly monthly cloud subscriptions.',
      oldBadge: 'Traditional Approach (Complex)',
      oldTitle: 'Before: Friction, Waiting, and Risks',
      oldItem1: '❌ <strong>Exhausting installations:</strong> Downloading Node.js, Python, Docker, 500MB editors, and debugging terminal errors.',
      oldItem2: '❌ <strong>Surprise cloud bills:</strong> Paying for servers, remote databases, and recurring compute usage fees.',
      oldItem3: '❌ <strong>Loss of privacy:</strong> Your sensitive files and databases are uploaded to third-party cloud servers.',
      oldItem4: '❌ <strong>AI with "tied hands":</strong> AI only gave you text; you had to copy, paste, and guess where each file belonged.',
      newBadge: 'The WebMCP Revolution (Local-First)',
      newTitle: 'Now: The Web Platform is your Computer',
      newItem1: '✅ <strong>One single click in the browser:</strong> Open the link and everything is ready in 1 second. Zero downloads.',
      newItem2: '✅ <strong>100% Free and Open Source:</strong> Running inside your own browser means the server cost is exactly $0.',
      newItem3: '✅ <strong>Maximum Security & Privacy:</strong> Your data lives inside your device memory. Nobody else sees it.',
      newItem4: '✅ <strong>AI with "Virtual Hands":</strong> With the W3C WebMCP standard, AI agents create files, run tests, and query data for you autonomously and safely.',
    },
    toolsSection: {
      tag: 'THE INTEGRATED ECOSYSTEM',
      title: 'The 3 Tools in the WebMCP Suite',
      subtitle: 'Three static, standalone apps that communicate with each other to cover the full lifecycle: from data generation to coding and relational storage.',
      badgeDev: 'Development Studio',
      badgeDb: 'Database',
      badgeGen: 'Data Generator',
      codeStudioTagline: 'Your own Visual Studio Code-style IDE in a browser tab.',
      codeStudioDesc: 'Create web pages, interactive apps, and scripts. Includes a virtual file system, real-time live preview, full Git version control, and a Unix terminal to run commands.',
      codeStudioBtn: 'Open Code Studio →',
      sqliteTagline: 'Blazing-fast relational database powered by WebAssembly.',
      sqliteDesc: 'Store data organized in tables, run complex SQL queries, and import or export JSON data with one click. Process millions of rows in milliseconds without installing heavy databases.',
      sqliteBtn: 'Open SQLite Studio →',
      mockarooTagline: 'Create realistic datasets for prototypes and demos.',
      mockarooDesc: 'Never craft sample data by hand again. Generate full lists of customers, sales, products, or addresses in seconds with over 69 realistic data types ready to import.',
      mockarooBtn: 'Open Mockaroo →',
    },
    comparison: {
      tag: 'COMPARATIVE ANALYSIS',
      title: 'Why choose WebMCP over alternatives?',
      subtitle: 'We compare our suite against traditional installed editors and paid cloud platforms.',
      colFeature: 'Feature',
      colTrad: 'Traditional Editors (Installed VS Code)',
      colCloud: 'Cloud Platforms (Replit / Vercel / SaaS)',
      colWebmcp: 'WebMCP Suite (Our Platform)',
      rowStart: 'Startup Time',
      rowStartTrad: '15 - 45 min (download & setup)',
      rowStartCloud: '2 - 5 min (signup & server provisioning)',
      rowStartWebmcp: '⚡ Under 1 second',
      rowCost: 'Operational Cost',
      rowCostTrad: 'Free but drains battery and disk',
      rowCostCloud: '$15 - $50 USD/month per user',
      rowCostWebmcp: '💰 $0 USD forever',
      rowPrivacy: 'Data Privacy',
      rowPrivacyTrad: 'Good on local disk, but no AI bridge',
      rowPrivacyCloud: 'Poor: your data travels to third-party clouds',
      rowPrivacyWebmcp: '🔒 100% Local in your browser',
      rowOffline: 'Offline Operation',
      rowOfflineTrad: 'Partial (requires pre-downloaded packages)',
      rowOfflineCloud: 'No (shuts down if connection drops)',
      rowOfflineWebmcp: '✅ Yes (100% Offline-Ready)',
      rowAi: 'AI Agent Integration',
      rowAiTrad: 'Fragmented plugins that break configurations',
      rowAiCloud: 'Locked behind paywalls or slow APIs',
      rowAiWebmcp: '🤖 Native W3C WebMCP Standard',
      rowNonTech: 'Non-Tech Friendliness',
      rowNonTechTrad: 'Low (fear of breaking system terminal)',
      rowNonTechCloud: 'Medium (complex menus and settings)',
      rowNonTechWebmcp: '🌱 Very friendly and intuitive',
    },
    howTo: {
      tag: 'STEP BY STEP GUIDE',
      title: 'How to get started in 3 simple steps',
      subtitle: 'Anyone can go from an idea in their head to a working prototype in minutes.',
      step1Title: 'Pick a Template or Generate Data',
      step1Desc: 'Open WebMCP Code Studio and choose a prebuilt template or use Mockaroo to create sample customers and sales with one click.',
      step2Title: 'Interact & Edit in Real-Time',
      step2Desc: 'Write or ask your AI agent to make changes for you. Watch the live preview update instantly without reloading the page.',
      step3Title: 'Save, Analyze or Download',
      step3Desc: 'Import your data into SQLite Studio for instant SQL queries and charts. Download your full project as a ZIP file or push to GitHub.',
    },
    roles: {
      tag: 'CUSTOMIZED FOR YOU',
      title: 'How does it help your role?',
      subtitle: 'Click on your profile to discover the key benefit and recommended workflow:',
      tabBiz: '🚀 Entrepreneurs & Business',
      tabAnalyst: '📈 Analysts & Finance',
      tabEdu: '🎓 Students & Educators',
      tabDev: '👨‍💻 Developers & Designers',
      bizTitle: 'For Entrepreneurs and Business Leaders',
      bizTagline: 'Validate ideas and build interactive commercial prototypes in an afternoon without hiring agencies or paying for servers.',
      bizDesc: 'Have an idea for a new app or service? Instead of paying thousands of dollars or spending weeks explaining requirements, you can generate sample data in Mockaroo, have an AI agent build your landing page in Code Studio, and demo it live to clients or investors.',
      bizWorkflow: 'Recommended Flow: Mockaroo (Generate 50 sample customers) ➔ Code Studio (Build product landing page) ➔ Demo and validate sales.',
      bizB1: 'Zero fixed monthly server costs while testing your market.',
      bizB2: 'Your business ideas and proprietary data stay safe on your computer.',
      bizB3: 'Ability to iterate live in front of prospective clients.',
      analystTitle: 'For Data, Operations, and Finance Analysts',
      analystTagline: 'Query, filter, and cross-reference complex relational datasets without depending on the IT department.',
      analystDesc: 'Say goodbye to frozen spreadsheets with thousands of rows. In SQLite Studio you import large JSON or tabular files in seconds and execute complex analytical aggregations that resolve in under 1 millisecond inside your browser memory.',
      analystWorkflow: 'Recommended Flow: SQLite Studio (Import report) ➔ Run SQL queries with AI ➔ Export clean insights.',
      analystB1: 'Instant performance powered by WebAssembly.',
      analystB2: 'Generate portable SQL dumps and JSON exports with one click.',
      analystB3: 'No need to request administrative permissions to install corporate software.',
      eduTitle: 'For Students, Teachers, and Researchers',
      eduTagline: 'The perfect interactive classroom to learn web development, databases, and AI agents without technical hurdles.',
      eduDesc: 'Eliminate "installation hell" in class. Students only need to click a link to access a full VS Code-style environment with a Unix terminal and relational database ready from second one.',
      eduWorkflow: 'Recommended Flow: Pick an educational template ➔ Learn by doing live ➔ Download your project as ZIP for grading.',
      eduB1: 'Works on Chromebooks, modest laptops, and any operating system.',
      eduB2: 'Aligned with the official W3C WebMCP standard for the future of AI.',
      eduB3: 'Zero configuration for the teacher and zero frustration for the student.',
      devTitle: 'For Developers and UI/UX Designers',
      devTagline: 'An agile sandbox to experiment with Artificial Intelligence Agents.',
      devDesc: 'Explore the W3C WebMCP specification firsthand. Test how Claude, GPT-4o, or Gemini can invoke native tools on window.modelContext, manage a virtual filesystem, and handle Git branches without touching your local OS.',
      devWorkflow: 'Recommended Flow: Open Code Studio ➔ Connect with fastwebmcp or headless agents ➔ Inspect live execution traces.',
      devB1: 'KDD Level 1 certified architecture with frozen contracts and test oracles.',
      devB2: 'Integrated POSIX terminal with pipes, redirections, and Git commands.',
      devB3: 'Remote sync with GitHub and Codeberg ready for production.',
      keyBenefitsLabel: 'Key Benefits:',
    },
    faq: {
      tag: 'ANSWERING QUESTIONS',
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know before starting.',
      q1: 'Do I need to know how to code to use this?',
      a1: 'Not at all. You can use Mockaroo to generate realistic datasets for Excel or decks, and SQLite Studio as an interactive data viewer. If you collaborate with AI agents (like Claude, ChatGPT, or Gemini), they can write and debug the code for you inside Code Studio while you direct the vision.',
      q2: 'Where are my files and data stored if I close the tab?',
      a2: 'The platform automatically saves your work in your browser secure local storage (IndexedDB and LocalStorage). Additionally, you can click "Download ZIP" or "Export .sqlite" anytime to keep a physical copy on your disk.',
      q3: 'Is it safe for confidential business data?',
      a3: 'Completely safe. Unlike cloud platforms where your files travel to third-party servers, our execution engine is 100% client-side (Local-First). Nothing leaves your browser; your CPU processes everything locally.',
      q4: 'What does using the W3C WebMCP standard mean?',
      a4: 'WebMCP (Web Model Context Protocol) is an emerging W3C specification standardizing how AI agents interact with web tools. It means that instead of brittle custom plugins, modern AI models can understand and operate these apps via an official open protocol.',
      q5: 'Can I connect my GitHub repository?',
      a5: 'Yes. WebMCP Code Studio includes remote synchronization support with GitHub and Codeberg using personal access tokens with scoped permissions. You can clone, push, and pull directly from your browser.',
    },
    bottomCta: {
      title: 'Ready to experience the future of web creation?',
      subtitle: 'No signups, no credit cards, and no waiting. Open a tab and start right now.',
      btnStudio: '🚀 Launch WebMCP Code Studio',
      btnGithub: '⭐ View Open Source on GitHub',
    },
    footer: {
      text: 'The first 100% static development, database, and analytics suite for modern web browsers.',
      copy: '© 2026 Mauricio Perera & WebMCP Community. MIT License.',
      trilogyTitle: 'Application Trilogy',
      resourcesTitle: 'Resources & Standards',
      githubLink: 'Code on GitHub',
      w3cLink: 'W3C WebMCP Standard',
      kddLink: 'KDD Documentation',
    },
  },

  pt: {
    nav: {
      whatIs: 'O que é?',
      tools: 'Ferramentas',
      advantages: 'Vantagens vs Outros',
      howTo: 'Como Usar',
      useCases: 'Casos de Uso',
      faq: 'Perguntas',
      openStudio: '🚀 Abrir Code Studio',
    },
    hero: {
      pill: '✨ A Nova Era da Criação com Inteligência Artificial',
      title: 'Crie software, bancos de dados e analítica <br class="desktop-only" /><span class="gradient-text">diretamente no seu navegador.</span>',
      subtitle: 'Sem instalar nada. Sem servidores na nuvem. 100% privado no seu computador.<br />Projetado para que <strong>pessoas sem conhecimentos técnicos</strong> prototipem ideias em minutos, e <strong>equipes avançadas</strong> tenham ferramentas nativas para Agentes de IA.',
      ctaStudioTitle: 'Abrir WebMCP Code Studio',
      ctaStudioDesc: 'Estúdio de desenvolvimento visual estilo VS Code',
      ctaSqliteTitle: 'Abrir SQLite Studio',
      ctaSqliteDesc: 'Banco de dados relacional instantâneo na memória',
      ctaMockarooTitle: 'Abrir Mockaroo WebMCP',
      ctaMockarooDesc: 'Gerador de dados sintéticos realistas',
      capZeroInstall: '0 Instalação: Abra e use em qualquer navegador moderno',
      capPrivate: '100% Privado: Seus dados nunca saem da sua máquina',
      capZeroCost: '$0 Custo: Sem mensalidades nem surpresas na nuvem',
      capOffline: 'Pronto Offline: Funciona mesmo sem internet',
      capMemory: 'Memória do Navegador:',
    },
    paradigm: {
      tag: 'A MUDANÇA DE PARADIGMA',
      title: 'O que é WebMCP e por que ele revoluciona tudo?',
      subtitle: 'Até hoje, usar Inteligência Artificial para criar software exigia instalações complexas, servidores e mensalidades caras.',
      oldBadge: 'Abordagem Tradicional (Complexa)',
      oldTitle: 'Antes: Fricção, Espera e Riscos',
      oldItem1: '❌ <strong>Instalações cansativas:</strong> Baixar Node.js, Python, Docker, editores de 500 MB e resolver erros de terminal.',
      oldItem2: '❌ <strong>Faturas surpresa na nuvem:</strong> Pagar por servidores, bancos remotos e cobranças recorrentes por uso de computação.',
      oldItem3: '❌ <strong>Perda de privacidade:</strong> Seus arquivos e dados confidenciais são enviados para servidores de terceiros.',
      oldItem4: '❌ <strong>IA de "mãos atadas":</strong> A IA só fornecia texto; você precisava copiar, colar e adivinhar onde colocar cada arquivo.',
      newBadge: 'A Revolução WebMCP (Local-First)',
      newTitle: 'Agora: A Plataforma Web é o seu Computador',
      newItem1: '✅ <strong>Um único clique no navegador:</strong> Acesse o link e tudo está pronto em 1 segundo. Zero downloads.',
      newItem2: '✅ <strong>100% Gratuito e Código Aberto:</strong> Rodando no seu próprio navegador, o custo de servidor é exatamente $0.',
      newItem3: '✅ <strong>Segurança e Privacidade Máximas:</strong> Seus dados ficam na memória do seu dispositivo. Ninguém mais vê.',
      newItem4: '✅ <strong>IA com "Mãos Virtuais":</strong> Com o padrão W3C WebMCP, agentes de IA criam arquivos, rodam testes e consultam dados por você com segurança.',
    },
    toolsSection: {
      tag: 'O ECOSSISTEMA INTEGRADO',
      title: 'As 3 Ferramentas da Suite WebMCP',
      subtitle: 'Três aplicativos estáticos e independentes que se comunicam entre si para cobrir todo o ciclo: da geração de dados à programação e armazenamento relacional.',
      badgeDev: 'Estúdio de Desenvolvimento',
      badgeDb: 'Banco de Dados',
      badgeGen: 'Gerador de Dados',
      codeStudioTagline: 'Seu próprio ambiente estilo Visual Studio Code numa aba web.',
      codeStudioDesc: 'Crie páginas web, aplicativos interativos e scripts. Inclui sistema de arquivos virtual, pré-visualização em tempo real, controle de versão Git completo e terminal Unix para executar comandos.',
      codeStudioBtn: 'Abrir Code Studio →',
      sqliteTagline: 'Banco de dados relacional ultrarrápido com WebAssembly.',
      sqliteDesc: 'Armazene dados organizados em tabelas, execute consultas SQL complexas e importe ou exporte JSON com um clique. Processe milhões de linhas em milissegundos sem instalar bancos pesados.',
      sqliteBtn: 'Abrir SQLite Studio →',
      mockarooTagline: 'Crie conjuntos de dados realistas para protótipos e demos.',
      mockarooDesc: 'Nunca mais crie dados de amostra manualmente. Gere em segundos listas completas de clientes, vendas, produtos ou endereços com mais de 69 tipos realistas prontos para importar.',
      mockarooBtn: 'Abrir Mockaroo →',
    },
    comparison: {
      tag: 'ANÁLISE COMPARATIVA',
      title: 'Por que escolher WebMCP frente a alternativas?',
      subtitle: 'Comparamos nossa suite contra editores locais tradicionais e plataformas pagas na nuvem.',
      colFeature: 'Característica',
      colTrad: 'Editores Tradicionais (VS Code instalado)',
      colCloud: 'Plataformas Cloud (Replit / Vercel / SaaS)',
      colWebmcp: 'Suite WebMCP (Nossa Plataforma)',
      rowStart: 'Tempo de Inicialização',
      rowStartTrad: '15 - 45 min (download e configuração)',
      rowStartCloud: '2 - 5 min (cadastro e espera de servidor)',
      rowStartWebmcp: '⚡ Menos de 1 segundo',
      rowCost: 'Custo Operacional',
      rowCostTrad: 'Grátis mas consome bateria e disco',
      rowCostCloud: '$15 - $50 USD/mês por usuário',
      rowCostWebmcp: '💰 $0 USD para sempre',
      rowPrivacy: 'Privacidade dos Dados',
      rowPrivacyTrad: 'Boa no disco local, mas sem ponte de IA',
      rowPrivacyCloud: 'Ruim: seus dados viajam para servidores de terceiros',
      rowPrivacyWebmcp: '🔒 100% Local no seu navegador',
      rowOffline: 'Operação Offline',
      rowOfflineTrad: 'Parcial (requer pacotes pré-baixados)',
      rowOfflineCloud: 'Não (desliga se a conexão cair)',
      rowOfflineWebmcp: '✅ Sim (100% Pronto Offline)',
      rowAi: 'Integração com Agentes IA',
      rowAiTrad: 'Plugins fragmentados que quebram configurações',
      rowAiCloud: 'Bloqueado por planos pagos ou APIs lentas',
      rowAiWebmcp: '🤖 Padrão W3C WebMCP Nativo',
      rowNonTech: 'Facilidade para Não Técnicos',
      rowNonTechTrad: 'Baixa (medo de quebrar o terminal do sistema)',
      rowNonTechCloud: 'Média (menus e configurações complexas)',
      rowNonTechWebmcp: '🌱 Muito amigável e intuitivo',
    },
    howTo: {
      tag: 'GUIA PASSO A PASSO',
      title: 'Como começar em 3 passos simples',
      subtitle: 'Qualquer pessoa pode transformar uma ideia em um protótipo funcional em minutos.',
      step1Title: 'Escolha um Modelo ou Gere Dados',
      step1Desc: 'Acesse o WebMCP Code Studio e escolha um modelo pronto ou use o Mockaroo para criar clientes e vendas de teste com um clique.',
      step2Title: 'Interaja e Modifique em Tempo Real',
      step2Desc: 'Escreva ou peça ao seu agente de IA para fazer alterações por você. Veja a pré-visualização atualizar instantaneamente.',
      step3Title: 'Salve, Analise ou Baixe',
      step3Desc: 'Importe seus dados no SQLite Studio para consultas e relatórios. Baixe seu projeto completo em arquivo ZIP ou envie para o GitHub.',
    },
    roles: {
      tag: 'PERSONALIZADO PARA VOCÊ',
      title: 'Como ajuda de acordo com seu perfil?',
      subtitle: 'Clique no seu perfil para descobrir o benefício chave e o fluxo recomendado:',
      tabBiz: '🚀 Empreendedores e Negócios',
      tabAnalyst: '📈 Analistas e Finanças',
      tabEdu: '🎓 Estudantes e Professores',
      tabDev: '👨‍💻 Desenvolvedores e Designers',
      bizTitle: 'Para Empreendedores e Líderes de Negócios',
      bizTagline: 'Valide ideias e crie protótipos comerciais interativos em uma tarde sem gastar com agências ou servidores.',
      bizDesc: 'Tem uma ideia para um novo app ou serviço? Em vez de pagar milhares de dólares ou passar semanas explicando requisitos, você pode gerar dados no Mockaroo, pedir a um agente de IA para criar sua interface no Code Studio e demonstrar ao vivo para clientes ou investidores.',
      bizWorkflow: 'Fluxo Recomendado: Mockaroo (Cria 50 clientes de teste) ➔ Code Studio (Gera a landing page do produto) ➔ Demonstre e valide vendas.',
      bizB1: 'Sem custos fixos mensais de servidor enquanto testa o mercado.',
      bizB2: 'Suas ideias e dados estratégicos ficam protegidos na sua máquina.',
      bizB3: 'Capacidade de iterar ao vivo diante de clientes potenciais.',
      analystTitle: 'Para Analistas de Dados, Operações e Finanças',
      analystTagline: 'Consulte, filtre e cruze dados relacionais complexos sem depender da equipe de TI.',
      analystDesc: 'Esqueça planilhas travadas com milhares de linhas. No SQLite Studio você importa arquivos JSON ou tabelas em segundos e executa agregações analíticas complexas que processam em menos de 1 milissegundo na memória do navegador.',
      analystWorkflow: 'Fluxo Recomendado: SQLite Studio (Importe seu relatório) ➔ Execute consultas SQL com IA ➔ Exporte conclusões limpas.',
      analystB1: 'Desempenho instantâneo potencializado por WebAssembly.',
      analystB2: 'Gere volcados portáteis e exportações JSON com um clique.',
      analystB3: 'Sem necessidade de pedir permissão para instalar softwares corporativos.',
      eduTitle: 'Para Estudantes, Professores e Pesquisadores',
      eduTagline: 'A sala de aula interativa perfeita para aprender desenvolvimento web, bancos de dados e IA sem barreiras técnicas.',
      eduDesc: 'Elimine o "inferno das instalações" em sala de aula. Os alunos só precisam abrir um link para ter um ambiente VS Code completo com terminal Unix e banco de dados relacional pronto.',
      eduWorkflow: 'Fluxo Recomendado: Escolha um modelo educacional ➔ Aprenda praticando ao vivo ➔ Baixe seu projeto em ZIP para entrega.',
      eduB1: 'Funciona em Chromebooks, computadores modestos e qualquer sistema operacional.',
      eduB2: 'Alinhado com o padrão oficial W3C WebMCP para o futuro da IA.',
      eduB3: 'Zero configuração para o professor e zero frustração para o aluno.',
      devTitle: 'Para Desenvolvedores e Designers UI/UX',
      devTagline: 'Um laboratório ágil para experimentar com Agentes de Inteligência Artificial.',
      devDesc: 'Explore a especificação WebMCP do W3C na prática. Teste como Claude, GPT-4o ou Gemini podem invocar ferramentas nativas em window.modelContext, manipular o VFS e gerenciar branches Git com segurança.',
      devWorkflow: 'Fluxo Recomendado: Abra o Code Studio ➔ Conecte com fastwebmcp ou agentes headless ➔ Inspecione logs de execução em tempo real.',
      devB1: 'Arquitetura certificada KDD Nível 1 com contratos e oráculos congelados.',
      devB2: 'Terminal POSIX integrado com pipes, redirecionamentos e comandos Git.',
      devB3: 'Sincronização remota com GitHub e Codeberg pronta para produção.',
      keyBenefitsLabel: 'Vantagens Chave:',
    },
    faq: {
      tag: 'TIRANDO DÚVIDAS',
      title: 'Perguntas Frequentes',
      subtitle: 'Tudo o que você precisa saber antes de começar a usar.',
      q1: 'Preciso saber programar para aproveitar a plataforma?',
      a1: 'Não necessariamente. Você pode usar o Mockaroo para gerar dados realistas para Excel ou apresentações, e o SQLite Studio como visualizador interativo. Se trabalhar com agentes de IA (como Claude, ChatGPT ou Gemini), eles podem escrever e ajustar o código por você no Code Studio.',
      q2: 'Onde meus arquivos e dados ficam salvos se eu fechar a aba?',
      a2: 'A plataforma salva automaticamente seu trabalho no armazenamento local seguro do navegador (IndexedDB e LocalStorage). Além disso, a qualquer momento você pode clicar em "Baixar ZIP" ou "Exportar .sqlite" para manter uma cópia física.',
      q3: 'É seguro para dados confidenciais da minha empresa?',
      a3: 'Totalmente seguro. Ao contrário de plataformas em nuvem onde seus arquivos viajam para servidores de terceiros, nosso motor é 100% client-side (Local-First). Nada sai do seu navegador; seu processador executa tudo localmente.',
      q4: 'O que significa usar o padrão W3C WebMCP?',
      a4: 'WebMCP (Web Model Context Protocol) é uma especificação emergente do W3C que padroniza como agentes de IA interagem com ferramentas web. Isso significa que qualquer modelo moderno pode entender e operar estas aplicações por meio de um protocolo aberto e oficial.',
      q5: 'Posso conectar meu repositório do GitHub?',
      a5: 'Sim. O WebMCP Code Studio inclui suporte a sincronização remota com GitHub e Codeberg usando tokens de acesso pessoal com permissões controladas. Você pode clonar, fazer push e pull diretamente do navegador.',
    },
    bottomCta: {
      title: 'Pronto para experimentar o futuro da criação web?',
      subtitle: 'Sem cadastros, sem cartão de crédito e sem espera. Abra uma aba e comece agora mesmo.',
      btnStudio: '🚀 Entrar no WebMCP Code Studio',
      btnGithub: '⭐ Ver Código Aberto no GitHub',
    },
    footer: {
      text: 'A primeira suite 100% estática de desenvolvimento, bancos de dados e analítica para navegadores modernos.',
      copy: '© 2026 Mauricio Perera & Comunidade WebMCP. Licença MIT.',
      trilogyTitle: 'Trilogia de Aplicativos',
      resourcesTitle: 'Recursos e Padrões',
      githubLink: 'Código no GitHub',
      w3cLink: 'Padrão W3C WebMCP',
      kddLink: 'Documentação KDD',
    },
  },
};
