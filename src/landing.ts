// Interactive behavior for WebMCP Landing Page

interface RoleInfo {
  title: string;
  tagline: string;
  description: string;
  workflow: string;
  keyBenefits: string[];
}

const ROLES_DATA: Record<string, RoleInfo> = {
  emprendedor: {
    title: 'Para Emprendedores y Líderes de Negocio',
    tagline: 'Valida ideas y crea prototipos comerciales interactivos en una tarde sin gastar en agencias ni servidores.',
    description: '¿Tienes una idea para una nueva aplicación o servicio? En lugar de pagar miles de dólares o pasar semanas explicando requerimientos a un tercero, puedes generar un set de datos de prueba en Mockaroo, pedirle a un agente de IA que construya tu interfaz en Code Studio y presentársela a tus clientes o inversores en vivo.',
    workflow: 'Flujo Recomendado: Mockaroo (Crea 50 clientes muestra) ➔ Code Studio (Genera la landing de tu producto) ➔ Comparte y valida ventas.',
    keyBenefits: [
      'Sin costos fijos mensuales de servidores mientras pruebas el mercado.',
      'Tus ideas de negocio y datos estratégicos quedan protegidos en tu máquina.',
      'Capacidad de iterar en vivo frente a clientes potenciales.'
    ]
  },
  analista: {
    title: 'Para Analistas de Datos, Operaciones y Finanzas',
    tagline: 'Consulta, filtra y cruza datasets relacionales complejos sin depender del equipo de TI.',
    description: 'Olvídate de las hojas de cálculo congeladas con miles de filas. Con SQLite Studio importas archivos JSON o tablas masivas en segundos y puedes ejecutar agrupaciones analíticas complejas que se resuelven en menos de 1 milisegundo directamente en la memoria de tu navegador.',
    workflow: 'Flujo Recomendado: SQLite Studio (Importa tu reporte) ➔ Ejecuta consultas SQL con IA ➔ Exporta conclusiones limpias.',
    keyBenefits: [
      'Rendimiento instantáneo impulsado por WebAssembly.',
      'Genera reportes y volcados portables con un clic.',
      'No necesitas solicitar permisos para instalar software corporativo en tu máquina de trabajo.'
    ]
  },
  educacion: {
    title: 'Para Estudiantes, Profesores e Investigadores',
    tagline: 'El aula interactiva perfecta para aprender desarrollo web, bases de datos y agentes de IA sin barreras técnicas.',
    description: 'Elimina el "infierno de las instalaciones" en clase. Los alumnos solo necesitan abrir un enlace para tener un entorno completo tipo VS Code con terminal Unix y base de datos relacional operativa desde el primer segundo.',
    workflow: 'Flujo Recomendado: Elige una plantilla educativa ➔ Aprende haciendo en vivo ➔ Descarga tu proyecto en ZIP para entregar.',
    keyBenefits: [
      'Funciona en Chromebooks, laptops modestas y cualquier sistema operativo.',
      'Alineado con el estándar oficial W3C WebMCP para el futuro de la IA.',
      'Cero configuración para el profesor y cero frustración para el estudiante.'
    ]
  },
  dev: {
    title: 'Para Desarrolladores y Diseñadores UI/UX',
    tagline: 'Un laboratorio ágil para experimentar con Agentes de Inteligencia Artificial.',
    description: 'Explora de primera mano la especificación WebMCP del W3C. Prueba cómo Claude, GPT-4o o Gemini pueden invocar herramientas nativas en `window.modelContext`, controlar un sistema de archivos virtual y gestionar ramas de Git sin tocar tu entorno local.',
    workflow: 'Flujo Recomendado: Abre Code Studio ➔ Conecta con fastwebmcp o agentes headless ➔ Inspecciona trazas de ejecución en vivo.',
    keyBenefits: [
      'Arquitectura KDD Nivel 1 certificada con contratos y oráculos congelados.',
      'Terminal POSIX integrada con tuberías, redirecciones y comandos Git.',
      'Sincronización remota con GitHub y Codeberg lista para producción.'
    ]
  }
};

function initRoleSelector() {
  const tabs = document.querySelectorAll('.role-tab');
  const displayContainer = document.getElementById('role-content');

  function renderRole(roleKey: string) {
    const role = ROLES_DATA[roleKey] || ROLES_DATA.emprendedor;
    if (!displayContainer) return;

    displayContainer.innerHTML = `
      <div class="role-content-box">
        <h3>${role.title}</h3>
        <p class="role-tagline">${role.tagline}</p>
        <p style="margin-bottom: 14px; line-height: 1.6;">${role.description}</p>
        <div class="role-workflow">
          <strong>💡 ${role.workflow}</strong>
        </div>
        <h4 style="font-size: 14px; color: #fff; margin-bottom: 10px;">Ventajas Clave:</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">
          ${role.keyBenefits.map(b => `<li style="font-size: 13px;">✨ ${b}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const roleKey = tab.getAttribute('data-role') || 'emprendedor';
      renderRole(roleKey);
    });
  });

  // Render initial
  renderRole('emprendedor');
}

function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      if (!item) return;

      const isOpen = item.classList.contains('active');
      const answer = item.querySelector('.faq-answer') as HTMLElement;

      // Close all others
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

function initLiveCapabilities() {
  const bar = document.getElementById('capabilities-bar');
  if (!bar) return;

  // Detect memory estimate if supported
  if ('performance' in window && (performance as any).memory) {
    const mem = Math.round((performance as any).memory.jsHeapSizeLimit / (1024 * 1024));
    const memEl = document.createElement('div');
    memEl.className = 'cap-item';
    memEl.innerHTML = `<span class="cap-dot green"></span> <strong>Memoria Navegador:</strong> ~${mem} MB disponibles`;
    bar.appendChild(memEl);
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initRoleSelector();
  initFaqAccordion();
  initLiveCapabilities();
});
