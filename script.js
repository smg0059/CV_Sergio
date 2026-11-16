/* ===== DATOS EDITABLES: rellena esto cuando los tengas ===== */
const CONFIG = {
  age: "",            // Ejemplo: "20" (el chatbot lo usará al responder sobre tu edad)
  extra: [],          // Respuestas propias. Ejemplo: { keys: "aficiones|hobbies", answer: "Me gusta..." }
  email: "moragregasergio@gmail.com",          // Ejemplo: "tunombre@correo.com"
  cvFile: "CV_Sergio_Moragrega_Gracia.pdf",  // PDF del CV (debe estar en la misma carpeta que index.html)
  links: [            // Enlaces profesionales. Ejemplo: { label: "LinkedIn", url: "https://..." }
  ]
};

/* ===== Utilidades ===== */
const $ = (s, c = document) => c.querySelector(s);
const toast = $(".toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 3500);
}

document.documentElement.classList.add("js");
$("#year").textContent = new Date().getFullYear();

/* ===== Menú móvil ===== */
const burger = $(".burger");
const menu = $("#menu");
function closeMenu() {
  menu.classList.remove("open");
  burger.setAttribute("aria-expanded", "false");
}
burger.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
});
menu.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

/* ===== Aparición al hacer scroll ===== */
const items = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
} else {
  items.forEach(el => el.classList.add("visible"));
}

/* ===== Correo ===== */
const emailBtn = $("#emailBtn");
const emailText = $("#emailText");
if (CONFIG.email) {
  emailBtn.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent("Contacto desde tu currículum web");
  emailBtn.removeAttribute("data-pending");
  emailText.textContent = CONFIG.email;
  emailText.classList.remove("placeholder");
}

/* ===== Descarga de CV ===== */
const cvBtn = $("#cvBtn");
if (CONFIG.cvFile) {
  cvBtn.href = CONFIG.cvFile;
  cvBtn.setAttribute("download", CONFIG.cvFile.split("/").pop());
  cvBtn.removeAttribute("data-pending");
}
/* Antes de descargar, comprueba que el PDF existe; si no, avisa con un mensaje amable */
let cvOk = false;
cvBtn.addEventListener("click", async e => {
  if (cvOk) { cvOk = false; return; }
  e.preventDefault();
  let ok = true;
  try { ok = (await fetch(cvBtn.getAttribute("href"), { method: "HEAD", cache: "no-store" })).ok; } catch (err) { ok = true; }
  if (!ok) { showToast(T("El CV no está disponible ahora mismo. Escríbeme y te lo envío.", "The CV isn't available right now. Email me and I'll send it.")); console.warn("No se encuentra el PDF del CV:", cvBtn.href); return; }
  cvOk = true; cvBtn.click();
});

/* ===== Otros enlaces profesionales ===== */
const linksList = $("#links");
CONFIG.links.forEach(l => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = l.url; a.textContent = l.label; a.target = "_blank"; a.rel = "noopener noreferrer";
  li.appendChild(a); linksList.appendChild(li);
});

/* ===== Botones que aún no tienen destino ===== */
document.querySelectorAll('[data-pending="true"]').forEach(el => {
  el.addEventListener("click", e => {
    e.preventDefault();
    showToast("Este enlace todavía no está configurado.");
  });
});

/* ===== Resalta en el menú la sección visible ===== */
if ("IntersectionObserver" in window) {
  const links = [...menu.querySelectorAll("a")];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach(s => spy.observe(s));
}

/* ===== Barra de progreso de lectura ===== */
const bar = $(".progress");
addEventListener("scroll", () => {
  const h = document.documentElement;
  bar.style.transform = "scaleX(" + h.scrollTop / (h.scrollHeight - h.clientHeight || 1) + ")";
}, { passive: true });

/* =========================================================
   CHATBOT: buscador semántico ligero (sin servidor)
   Entiende errores de escritura, sinónimos y preguntas no previstas,
   y lee automáticamente el contenido de la propia web.
   Para añadir respuestas: K("palabras|clave", "respuesta").
   ========================================================= */
let LANG = "es";
const T = (es, en) => (LANG === "en" ? en : es);
const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(("el la los las un una unos unas de del al a en y o u que es son ser se su sus lo le les me mi te tu por para con sin sobre como cual cuales hay ha han tiene tienen tengo hizo hace hacer este esta esto ese esa eso fue muy mas pero si no ya nos yo quien donde cuando cuanto cuantos cuantas sergio puede puedo puedes podria quiero saber dime cuentame favor gustaria").split(" "));
"i the is are was were what does do did he his him she her it its of in on to and for with about tell can you your how which who where when why an be been has have had at by from this that these those there their them they we our us my am or but if so as than then just also very much any some please could would should will".split(" ").forEach(w => STOP.add(w));
const SYN = {
  ordenador: "pc pcs ordenata computadora computadoras maquina informatico",
  formacion: "carrera titulo titulacion estudiar estudia estudias cursa curso academica universidad instituto",
  trabajo: "chamba curro empleo laboral profesional",
  habilidad: "capaz domina maneja manejar competencia aptitud conoce conocimiento",
  contacto: "contactar escribir escribirle llamar mensaje correo email mail telefono contratar fichar reclutar entrevista llamarle llamarlo contactarle contactarlo escribirlo",
  idioma: "lengua lenguas hablar habla",
  reparar: "arreglar averia averias soporte tecnico mantenimiento",
  proyecto: "app aplicacion creacion desarrollado creado",
  gimnasio: "gym fitness entreno entrenamiento dieta rutina nutricion",
  cualidad: "virtud fortaleza fortalezas personalidad caracter actitud"
};
const REV = {};
Object.entries(SYN).forEach(([k, v]) => v.split(" ").forEach(w => (REV[w] = k)));
const toks = t => norm(t).split(" ").filter(w => w && !STOP.has(w));
const expand = w => (REV[w] ? [w, REV[w]] : [w]);
const stem = w => w.slice(0, 4);
const lev = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};

const docs = [], vocab = new Set(), df = {};
function addDoc(keys, answer, auto, lang) {
  const bag = {};
  const add = (t, w) => toks(t).flatMap(expand).forEach(x => { if (x.length > 4) vocab.add(x); const s = stem(x); bag[s] = Math.max(bag[s] || 0, w); });
  add(keys.join(" "), 3);
  if (typeof answer === "string") add(answer, 1);
  Object.keys(bag).forEach(s => (df[s] = (df[s] || 0) + 1));
  docs.push({ keys: keys.map(norm), answer, bag, auto, lang: lang || "es" });
}
const K = (k, a) => addDoc(k.split("|"), a);
const val = s => { const e = document.querySelector(s); return e && !e.classList.contains("placeholder") ? e.textContent.trim() : ""; };
const techs = () => [...document.querySelectorAll(".project .chips span:not(.placeholder)")].map(e => e.textContent.trim());

/* ---- Respuestas preparadas ---- */
CONFIG.extra.forEach(e => K(e.keys, e.answer));
K("hola|que tal|como estas|buenas|hey|saludos|buenos dias|buenas tardes|buenas noches", "¡Hola! Soy el asistente de la web de Sergio. Pregúntame por su formación, experiencia, habilidades, idiomas, proyecto o lo que busca.");
K("quien eres|como te llamas|tu nombre|eres una ia|eres un robot|eres humano|chatbot|bot|asistente", "Soy un asistente automático de esta web. No uso IA externa: respondo con la información del currículum de Sergio y, si algo no consta, te lo digo.");
K("quien es sergio|presentate|presentacion|descripcion|perfil|sobre el|como es|nombre completo|como se llama|apellidos|datos personales", "Sergio Moragrega Gracia es un joven de Zaragoza con formación en informática y mucha iniciativa. Es simpático, amable, con sentido del humor, entregado y se maneja muy bien en equipo. Le gusta aprender cosas nuevas e implicarse en lo que hace.");
K("resumen|resumeme|en pocas palabras|brevemente|en resumen|sintesis|informacion|info|cuentame|hablame|que sabes|dime algo|datos", "En breve: Sergio (Zaragoza) estudia el Grado Superior DAM y tiene el Grado Medio de Sistemas Microinformáticos y Redes. Hizo 3 meses de prácticas en Arquisocial, sabe de hardware, redes básicas y desarrollo web, y creó una web de gimnasio con IA. Habla español (nativo), inglés (medio), catalán y francés (bajo). Busca soporte informático o desarrollo web.");
K("donde vive|ubicacion|ciudad|zaragoza|reside|vive|de donde|localidad|pais|espana", "Sergio vive en Zaragoza, España.");
K("formacion|estudios|estudia|titulo|titulacion|academica|grado|formado|educacion|que ha estudiado|universitarios|universidad|carrera|bachillerato|fp|formacion profesional|ciclo|ciclos|master|cursos", "Sergio estudia actualmente el Grado Superior de Desarrollo de Aplicaciones Multiplataforma (DAM). Además tiene el Grado Medio de Sistemas Microinformáticos y Redes y la ESO.");
K("dam|multiplataforma|grado superior|desarrollo de aplicaciones|cuando termina|terminara|acabar|finalizar|fecha de fin|graduacion|curso actual", "Sergio cursa ahora el Grado Superior de Desarrollo de Aplicaciones Multiplataforma (DAM). Está en curso y no consta su fecha de finalización.");
K("smr|microinformaticos|grado medio|sistemas microinformaticos", "Sergio tiene el Grado Medio de Sistemas Microinformáticos y Redes.");
K("eso|secundaria", "Sergio tiene la Educación Secundaria Obligatoria (ESO).");
K("experiencia|trabajo|trabajado|practicas|arquisocial|empresa|laboral|funciones|tareas|responsabilidades|duracion|meses|cuanto duro|anos de experiencia|cuanta experiencia|experiencia previa|junior|senior|principiante|primer empleo|cuanto tiempo|estuvo|cuanto estuvo", "Sergio hizo tres meses de prácticas en Arquisocial, su primer contacto con el entorno laboral. Allí:\n• Colaboró en la instalación de cerca de 100 antivirus, o más, en toda la empresa.\n• Participó en el montaje y desmontaje de portátiles y torres.\n• Configuró móviles para la empresa.");
K("antivirus|instalacion|instalar|seguridad", "En Arquisocial, Sergio colaboró en la instalación de cerca de 100 antivirus, o más, en los equipos de toda la empresa.");
K("movil|moviles|configurar|configuracion|iphone|tablets|impresoras|dispositivos", "En Arquisocial, Sergio configuró móviles para la empresa. También sabe manejar móviles, tablets, impresoras y otros dispositivos.");
K("hardware|montaje|montar|desmontaje|portatil|portatiles|torre|torres|ordenador|ordenadores|mantenimiento|reparar|soporte|componentes", "Sergio sabe montar y mantener hardware de ordenadores, y en sus prácticas participó en el montaje y desmontaje de portátiles y torres. Busca trabajo en montaje, mantenimiento y soporte de equipos.");
K("habilidades|sabe hacer|que sabe|conocimientos|skills|informatica|competencias|capacidades|que sabe hacer|aptitudes", "Habilidades técnicas de Sergio:\n• Manejo avanzado de Visual Studio Code.\n• Montaje y mantenimiento de hardware.\n• Conocimientos generales de informática.\n• Manejo de ordenadores, móviles, tablets, impresoras y otros dispositivos.\n• Conocimientos básicos de redes, routers y switches.\n• Interés y conocimientos en desarrollo web.");
K("redes|red|router|routers|switch|switches|networking", "Sergio tiene conocimientos básicos de redes informáticas y conoce routers y switches. Su Grado Medio es de Sistemas Microinformáticos y Redes.");
K("visual studio|vscode|vs code|editor|herramientas|programas|software", "Sergio tiene un manejo avanzado de Visual Studio Code.");
K("web|paginas web|frontend|front|diseno web|programacion|programar|desarrollo web|desarrollador|diseno|disenar|disenador|ui|ux|interfaz", "Sergio tiene interés y conocimientos en desarrollo de páginas web. Le interesa especialmente el diseño web y el frontend, y estudia el DAM. Además creó su propia web de gimnasio y bienestar.");
K("lenguajes|tecnologias|stack|java|python|javascript|html|css|php|sql|react|angular|kotlin|flutter|framework|frameworks|windows|linux|office|word|excel|mac|android|ios|sistemas operativos|git|photoshop|figma|bases de datos", () => { const t = techs(); return (t.length ? "En su proyecto " + (val(".project h3") || "de gimnasio") + " ha usado: " + t.join(", ") + ". " : "") + "Su currículum no detalla más lenguajes ni tecnologías concretas: indica conocimientos e interés en desarrollo web y que estudia el DAM. Puedes preguntárselo desde la sección Contacto."; });
K("idiomas|idioma|lenguas|cuantos idiomas|que idiomas|bilingue|traducir|extranjero", "Idiomas de Sergio:\n• Español: nativo.\n• Inglés: nivel medio.\n• Catalán: nivel bajo.\n• Francés: nivel bajo.");
K("ingles|english|habla ingles|nivel de ingles", "Sergio tiene un nivel medio de inglés.");
K("catalan|catala|habla catalan|nivel de catalan", "Sergio tiene un nivel bajo de catalán.");
K("frances|francais|habla frances|nivel de frances", "Sergio tiene un nivel bajo de francés.");
K("espanol|castellano|lengua materna|nativo", "El español es la lengua nativa de Sergio.");
K("personales|cualidades|personalidad|actitud|equipo|fortalezas|virtudes|caracter|persona|comunicacion|amable|simpatico|humor|soft skills|puntos fuertes|trabajo en equipo|iniciativa|responsable|cercano|joven|motivado|motivacion|trabajador|dedicado|entregado|colaborador|sociable|grupo|trabajar en grupo|companeros|aprender|aprendizaje|aprende|curioso", "Sergio es una persona simpática, amable, con sentido del humor y entregada. Destaca por el trabajo en equipo, la comunicación y expresión escrita, la amabilidad y el trato cercano, la implicación y el compromiso, la capacidad de aprendizaje y su actitud positiva. Siempre quiere mejorar y adquirir nuevos conocimientos.");
K("proyecto|proyectos|gimnasio|gym|nutricion|entrenamiento|inteligencia artificial|ia|bienestar|dieta|plan semanal|app|aplicacion|portfolio|enlace del proyecto|ver el proyecto|visitar|capturas|imagenes|fotos|logro|logros|orgulloso|orgullo|creacion propia|como se llama su proyecto|nombre del proyecto|como se llama el proyecto|nombre de su proyecto|fitness pro|fitbot|chatbot el proyecto|chatbot del proyecto|chatbot de su proyecto|asistente del proyecto|calculadoras|graficos|glosario|recetas|groq", () => {
  const n = val(".project h3"), t = techs();
  return "Sergio ha desarrollado " + (n ? "«" + n + "»" : "una web") + " sobre gimnasio y bienestar. El usuario introduce datos sobre su forma física y la web propone un plan semanal de nutrición y una planificación semanal de entrenamiento, con una pequeña inteligencia artificial integrada. Incluye calculadoras, seguimiento con gráficos, plan de comidas semanal, temporizador, glosario y recetas; su asistente FitBot funciona con un cerebro local y, opcionalmente, con una clave de Groq. " + (t.length ? "Tecnologías: " + t.join(", ") + "." : "Todavía no ha indicado las tecnologías utilizadas.") + " " + (/^#?$/.test(document.querySelector(".project .btn")?.getAttribute("href") || "#") ? "El enlace del proyecto aún no está publicado." : "Puedes visitarla desde el botón «Visitar proyecto» de la sección Proyectos.");
});
K("busca|objetivo|oportunidad|puesto|quiere|interesa|buscando|empleo|ofertas|aspira|futuro|metas", "Sergio busca una oportunidad en dos ámbitos:\n1. Montaje, mantenimiento y soporte de equipos informáticos.\n2. Diseño y desarrollo de páginas web.\nEstá al inicio de su trayectoria, pero aporta formación informática, iniciativa y muchas ganas de aprender.");
K("por que contratarle|por que contratar|deberia|elegirle|que aporta|valor anadido|ventajas|diferencia|motivos|razones|especial|destaca|mejor|bueno|candidato|recomiendas|recomendarias|merece|vale la pena|buen|fiable|confianza|ofrece|ofrecer|por mi empresa|aportar|puede hacer por", "Sergio aporta formación informática (DAM en curso y Grado Medio de Sistemas Microinformáticos y Redes), experiencia real de prácticas (antivirus, montaje de equipos, configuración de móviles), un proyecto propio de desarrollo web, iniciativa, trabajo en equipo y muchas ganas de aprender.");
K("contacto|contactarle|contactarlo|llamarle|llamarlo|donde contactar|como contactar|como contacto|contactar|email|correo|mail|escribir|telefono|llamar|linkedin|github|enlaces|redes sociales", () =>
  (CONFIG.email ? "Puedes escribir a Sergio a " + CONFIG.email + " o usar el formulario de la sección Contacto, que le llega directamente." : "Puedes contactar con Sergio desde la sección Contacto de esta web (su correo aún no está publicado).") +
  (CONFIG.links.length ? " Otros enlaces: " + CONFIG.links.map(l => l.label).join(", ") + "." : ""));
K("cv|curriculum|pdf|descargar|descarga", () => CONFIG.cvFile ? "Puedes descargar el CV de Sergio en PDF con el botón «Descargar CV» de la portada, del menú Contacto o de la sección Contacto." : "El PDF del CV todavía no está disponible. Mientras tanto, toda su información está en esta web.");
K("edad|cuantos anos tiene|anos tiene|cumpleanos|nacimiento|nacio|fecha de nacimiento", () => CONFIG.age ? "Sergio tiene " + CONFIG.age + " años." : "La edad de Sergio no figura en su currículum. Lo que sí transmite es que es una persona joven, con iniciativa y con muchas ganas de crecer. Puedes preguntárselo desde la sección Contacto.");
K("donde hizo las practicas|donde practico|donde ha trabajado|donde trabajo|donde trabaja|en que empresa|que empresa|lugar de las practicas|donde estuvo", "Sergio hizo sus prácticas en la empresa Arquisocial, durante tres meses. Es su primera experiencia laboral.");
K("hecha|hecho|hecha con|como esta hecha|como se ha hecho|tecnologias de esta web|codigo de la web|responsive|adaptable|se ve bien|compatible", "Esta web está hecha con HTML, CSS y JavaScript puros, sin librerías externas, y se adapta a móvil, tablet y ordenador.");
K("navegar|navegacion|moverme|como uso|como funciona esta web|como funciona", "Puedes moverte con el menú superior, preguntarme lo que quieras en este chat y escribirle a Sergio desde la sección Contacto.");
K("idioma de la web|web en ingles|version en ingles|en que idioma esta", "La web está en español y, por ahora, no tiene versión en otro idioma.");
K("trabaja actualmente|en que trabaja|trabaja ahora|a que se dedica|ocupacion|profesion|que hace actualmente|situacion actual|estudia o trabaja|que hace ahora", "Actualmente Sergio estudia el Grado Superior DAM y busca su oportunidad profesional en soporte informático o desarrollo web. Antes hizo tres meses de prácticas en Arquisocial.");
K("ayuda|que te puedo preguntar|que puedo preguntar|que puedes hacer|que sabes hacer|para que sirves|como funcionas|opciones|temas", "Puedes preguntarme por la formación de Sergio, sus prácticas en Arquisocial, habilidades, idiomas, su proyecto de gimnasio, lo que busca, cómo contactarle o cómo funciona esta web. Escribe con tus propias palabras.");
K("esta web|esta pagina|secciones|que hay aqui|que puedo ver|contenido|menu", "Esta web recoge: Sobre mí, Formación, Experiencia, Habilidades, Idiomas, Proyectos y Contacto. Puedes moverte con el menú superior y preguntarme lo que quieras aquí.");
K("sueldo|hombre|mujer|sexo|genero|puntual|puntualidad|defectos|puntos debiles|debilidades|hermanos|padres|casado|novia|novio|amigos|salario|cobrar|pretensiones|carnet|coche|vehiculo|conducir|jornada|politica|religion|opinion|piensa|horario|turno|mudarse|reubicacion|teletrabajo|remoto|hobbies|aficiones|sus gustos|gusta hacer|tiempo libre|ocio|deporte|musica|favorito|favorita|preferido|comida|mascotas|viajes|direccion|dni|nacionalidad|estado civil|hijos|familia|pareja|certificaciones|certificados|referencias|premios|notas|expediente", "Ese dato no figura en el currículum de Sergio y prefiero no inventarlo. Puedes preguntárselo directamente desde la sección Contacto.");
K("gracias|genial|perfecto|vale|adios|hasta luego|ok|muchas gracias|chao", "¡A ti! Si quieres saber algo más sobre Sergio, aquí estoy.");

K("que es arquisocial|sobre arquisocial|a que se dedica arquisocial|donde hizo las practicas", "Arquisocial es la empresa donde Sergio hizo sus tres meses de prácticas. No tengo más información de la empresa, pero sí de lo que hizo allí: instalación de antivirus, montaje y desmontaje de equipos y configuración de móviles.");
K("disponible|disponibilidad|incorporacion|incorporarse|cuando puede empezar|empezar a trabajar", "Sergio está buscando una oportunidad laboral, pero su currículum no indica fecha de incorporación ni horario. Puedes consultárselo desde la sección Contacto.");

/* ---- English knowledge base ---- */
const KE = (k, a, go) => { addDoc(k.split("|"), a, false, "en"); if (go) docs[docs.length - 1].go = go; };
KE("hello|hi|hey|good morning|good evening|how are you", "Hi! I'm Sergio's assistant. Ask me about his education, internship, skills, languages, project or what he's looking for.");
KE("who are you|your name|are you a bot|are you ai|are you human|chatbot|bot|assistant", "I'm an automatic assistant for this website. I don't use external AI: I answer from Sergio's CV and tell you when something isn't there.");
KE("who is sergio|about him|tell me about him|profile|full name|his name|introduce|describe|personal details", "Sergio Moragrega Gracia is a young man from Zaragoza with IT training and lots of initiative. He is friendly, kind, has a sense of humor, gives his all and works very well in a team. He loves learning new things and getting involved in what he does.", "#sobre-mi");
KE("summary|in short|briefly|overview|sum up|information|info", "In short: Sergio (Zaragoza) is studying the Higher Vocational Degree DAM and holds the Intermediate Degree in Microcomputer Systems and Networks. He did a 3-month internship at Arquisocial, knows hardware, basic networking and web development, speaks Spanish (native), English (intermediate), Catalan and French (basic), and built a gym website with AI. He is looking for IT support or web development.", "#sobre-mi");
KE("where does he live|location|city|based|country|spain|zaragoza|from where", "Sergio lives in Zaragoza, Spain.");
KE("education|studies|study|studying|degree|qualifications|school|academic|training|university|vocational|dam|multiplatform|cross platform|microcomputer|intermediate degree|secondary", "Sergio is currently studying the Higher Vocational Degree in Cross-Platform Application Development (DAM), which is in progress. He also holds the Intermediate Vocational Degree in Microcomputer Systems and Networks and Compulsory Secondary Education (ESO).", "#formacion");
KE("experience|work|worked|job|internship|internships|arquisocial|company|employer|tasks|duties|responsibilities|how long|months|antivirus|where did he work", "Sergio did a three-month internship at Arquisocial, his first contact with the working world. There he:\n• Helped install around 100 antivirus programs, or more, across the company.\n• Took part in assembling and disassembling laptops and towers.\n• Configured mobile phones for the company.", "#experiencia");
KE("skills|abilities|can do|knowledge|competences|technical|good at|knows|visual studio|vs code|tools", "Sergio's technical skills:\n• Advanced use of Visual Studio Code.\n• Computer hardware assembly and maintenance.\n• General IT knowledge.\n• Handling computers, phones, tablets, printers and other devices.\n• Basic knowledge of networks, routers and switches.\n• Interest and knowledge in web development.", "#habilidades");
KE("hardware|assemble|assembly|build pc|computers|laptops|repair|maintenance|support|it support|devices|mobile|phones|configure|tablets|printers", "Sergio can assemble and maintain computer hardware, and during his internship he helped assemble and disassemble laptops and towers and configured mobile phones for the company. He is looking for work in computer assembly, maintenance and support.", "#habilidades");
KE("network|networks|router|routers|switch|switches|networking", "Sergio has basic knowledge of computer networks and knows routers and switches. His Intermediate Degree is in Microcomputer Systems and Networks.", "#habilidades");
KE("web|website|frontend|front end|programming|code|coding|developer|design|html|css|javascript|python|java|php|sql|react", "Sergio has interest and knowledge in web development. He is especially interested in web design and frontend, and is studying the DAM. His CV doesn't list specific programming languages. He also built his own gym and wellness website.", "#proyectos");
KE("languages|language|speak|english|spanish|catalan|french|bilingual|fluent|level of english", "Sergio's languages:\n• Spanish: native.\n• English: intermediate.\n• Catalan: basic.\n• French: basic.", "#idiomas");
KE("personal|qualities|personality|soft skills|strengths|teamwork|team|friendly|character|humor|attitude|kind|likable|learn|learning|motivated|responsible|initiative", "Sergio is friendly, kind, has a sense of humor and gives his all. He stands out for teamwork, written communication, a warm manner, commitment, ability to learn and a positive attitude, and he always wants to improve.", "#sobre-mi");
KE("project|projects|gym|fitness|nutrition|training plan|diet|app|artificial intelligence|ai|portfolio|achievement|proud|technologies|tech stack|what is the project called|project name|fitness pro|fitbot|project chatbot|chatbot in the project|assistant in the project|calculators|charts|glossary|recipes|groq", () => {
  const n = val(".project h3"), t = techs();
  return "Sergio has built " + (n ? "“" + n + "”" : "a website") + " about gym training and wellness. Users enter information about their physical condition and the site suggests a weekly nutrition plan and a weekly workout plan, with a small built-in artificial intelligence. It includes calculators, progress charts, a weekly meal plan, a rest timer, a glossary and recipes; its FitBot assistant works with a local brain and, optionally, a Groq key. " + (t.length ? "Technologies: " + t.join(", ") + "." : "He hasn't listed the technologies yet.") + " See the Projects section.";
}, "#proyectos");
KE("looking for|goal|objective|seeking|opportunity|position|wants|career|job search|available|availability|plans", "Sergio is looking for an opportunity in two areas:\n1. Computer assembly, maintenance and IT support.\n2. Web design and development.\nHe is at the start of his career, but brings IT training, initiative and a strong will to learn.", "#contacto");
KE("why hire|hire|hiring|offers|value|candidate|recommend|why choose|special|benefit|bring", "Sergio brings IT training (DAM in progress and an Intermediate Degree in Microcomputer Systems and Networks), real internship experience (antivirus, hardware assembly, phone configuration), his own web development project, initiative, teamwork and a strong will to learn.", "#contacto");
KE("contact|email|mail|reach|write|phone|call|linkedin|github|message|get in touch", () => (CONFIG.email ? "You can write to Sergio at " + CONFIG.email + " or use the contact form in the Contact section, which reaches him directly." : "You can contact Sergio from the Contact section (his email isn't published yet).") + (CONFIG.links.length ? " Other links: " + CONFIG.links.map(l => l.label).join(", ") + "." : ""), "#contacto");
KE("cv|resume|curriculum|pdf|download", () => CONFIG.cvFile ? "You can download Sergio's CV as a PDF with the “Download CV” button on the home screen, in the Contact menu or in the Contact section." : "The CV PDF isn't available yet. Meanwhile, all his information is on this page.", "#contacto");
KE("age|old|birthday|born|how old", () => CONFIG.age ? "Sergio is " + CONFIG.age + " years old." : "Sergio's age isn't listed in his CV. What it does convey is that he's young, proactive and eager to grow. You can ask him in the Contact section.");
KE("salary|pay|driving|license|licence|hobbies|family|married|religion|politics|certificates|certifications|references|favorite|free time|gender|siblings|girlfriend|weakness|weaknesses|punctual", "That isn't in Sergio's CV and I'd rather not make it up. You can ask him directly from the Contact section.");
KE("this website|this site|this page|sections|menu|built with|made with|responsive|mobile friendly|navigate", "This page has: About me, Education, Experience, Skills, Languages, Projects and Contact. It is built with plain HTML, CSS and JavaScript and adapts to mobile, tablet and desktop. Use the top menu to move around, or ask me anything here.");
KE("thanks|thank you|great|perfect|bye|goodbye|ok|cheers", "You're welcome! If you want to know anything else about Sergio, I'm here.");
KE("help|what can you do|what can i ask|options|topics", "You can ask me about Sergio's education, his internship at Arquisocial, skills, languages, his gym project, what he's looking for, how to contact him, or how this page works. Write in your own words.");

/* ---- Lee automáticamente el contenido de la web (así sabe lo que añadas) ---- */
try { document.querySelectorAll("main article, .timeline li, .langs li, .about-cols > div, .hero-roles li, .facts li, .hero-lead, .big").forEach(el => {
  const c = el.cloneNode(true);
  c.querySelectorAll(".placeholder, .btn, .shots, button").forEach(x => x.remove());
  const p = [...c.querySelectorAll("*")].filter(e => !e.children.length).map(e => e.textContent.trim()).filter(Boolean);
  if (!p.length) return;
  const sid = el.closest("section")?.id;
  addDoc([p[0]], "En la web figura así:\n" + (p.length === 1 ? p[0] : p.length === 2 ? p[0] + ": " + p[1] : p[0] + ":\n• " + p.slice(1).join("\n• ")), true);
  const dd = docs[docs.length - 1]; dd.title = p[0]; if (sid) dd.go = "#" + sid;
}); } catch (e) { console.warn("Índice de la web no disponible", e); }

/* ---- Motor de búsqueda ---- */
function resolve(t) {
  const s = stem(t);
  if (df[s]) return [s, 1];
  if (t.length < 5) return null;
  let best = null, bd = t.length > 7 ? 3 : 2;
  vocab.forEach(v => { if (Math.abs(v.length - t.length) < 3) { const d = lev(t, v); if (d < bd) { bd = d; best = v; } } });
  return best ? [stem(best), 0.7] : null;
}
function rank(text, onlyAuto) {
  const n = " " + norm(text) + " ", q = toks(text).map(w => expand(w).map(resolve).filter(Boolean));
  return docs.filter(d => d.lang === LANG && (!onlyAuto || d.auto)).map(d => {
    let s = 0;
    q.forEach(g => { s += Math.max(0, ...g.map(([st, w]) => (d.bag[st] ? d.bag[st] * w * Math.log(1 + docs.length / df[st]) : 0))); });
    d.keys.forEach(k => { if (k && n.includes(" " + k + " ")) s += 3 + k.split(" ").length; });
    return { d, s: d.auto ? s * 0.8 : s };
  }).sort((a, b) => b.s - a.s);
}
const FALLBACK = "No he encontrado ese dato en el currículum de Sergio. Puedo hablarte de su formación, experiencia, habilidades, idiomas, proyecto u objetivo profesional, o puedes preguntárselo desde la sección Contacto.";
const FALLBACK_EN = "I couldn't find that in Sergio's CV. I can tell you about his education, internship, skills, languages, project or career goal, or you can ask him directly from the Contact section.";
let last = null, ctx = {};
const ans = d => (typeof d.answer === "function" ? d.answer() : d.answer);
function getAnswer(q) {
  const n = norm(q);
  ctx = { st: "none" };
  if (!n) return T("Escribe tu pregunta y te respondo con lo que sé de Sergio.", "Type your question and I'll answer with what I know about Sergio.");
  if (!toks(q).length && rank(q)[0].s < 3.5) { last = docs.find(d => d.keys.includes(LANG === "en" ? "summary" : "resumen")); ctx = { st: "ok", doc: last }; return ans(last); }
  const r = rank(q);
  let top = r[0];
  if (last && top.s < 6 && toks(q).length < 2 && /\b(mas|detalle|detalles|amplia|profundiza|explica|sigue|more|details|elaborate)\b/.test(n)) {
    ctx = { st: "ok", doc: last };
    const a = rank(last.keys.join(" "), true)[0];
    return a && a.d !== last && a.s > 3 ? a.d.answer : T("Esa es toda la información que hay en la web sobre este tema. ¿Quieres saber otra cosa?", "That is all the information the page has on this topic. Anything else?");
  }
  if (last && top.s < 4 && /^(y|pero|entonces|and|but|then)\b|\b(eso|esa|ese|ello|ahi|that)\b/.test(n)) {
    const r2 = rank(q + " " + last.keys[0])[0];
    if (r2.s > top.s) top = r2;
  }
  if (top.s >= 3.5) {
    last = top.d; ctx = { st: "ok", doc: top.d };
    let out = ans(top.d);
    const sec = r[1];
    if (sec !== top && /\b(y|tambien|ademas)\b/.test(n) && sec.s >= 3.5 && sec.s >= top.s * 0.7 && !sec.d.auto && !top.d.auto) out += "\n\n" + ans(sec.d);
    return out;
  }
  if (top.s >= 1.2) { ctx = { st: "low", alts: r.slice(0, 3).filter(x => x.s >= 1.2).map(x => x.d) }; return T("No estoy seguro de haberte entendido del todo. ¿Te refieres a alguno de estos temas?", "I'm not sure I understood. Do you mean one of these topics?"); }
  return T(FALLBACK, FALLBACK_EN);
}

/* UI */
const chatToggle = $("#chatToggle"), chatPanel = $("#chatPanel"), chatLog = $("#chatLog");
const chatForm = $("#chatForm"), chatInput = $("#chatInput"), chatChips = $("#chatChips");
const SECTIONS = { "#sobre-mi": "Sobre mí", "#formacion": "Formación", "#experiencia": "Experiencia", "#habilidades": "Habilidades", "#idiomas": "Idiomas", "#proyectos": "Proyectos", "#contacto": "Contacto" };
/* Primera clave de cada respuesta -> [etiqueta, sección de la web, preguntas relacionadas] */
const TOPIC = {
  "formacion": ["Formación", "#formacion", "¿Qué es el DAM?|¿Qué hizo en las prácticas?"],
  "dam": ["Grado Superior DAM", "#formacion", "¿Qué estudió antes?|¿Qué busca?"],
  "smr": ["Grado Medio", "#formacion", "¿Qué estudia ahora?|¿Qué sabe de redes?"],
  "eso": ["ESO", "#formacion", "¿Qué estudia?"],
  "experiencia": ["Prácticas", "#experiencia", "¿Cuántos antivirus instaló?|¿Qué habilidades tiene?"],
  "antivirus": ["Antivirus", "#experiencia", "¿Qué más hizo en las prácticas?"],
  "movil": ["Móviles", "#experiencia", "¿Qué sabe de hardware?"],
  "hardware": ["Hardware", "#habilidades", "¿Qué sabe de redes?|¿Qué busca?"],
  "habilidades": ["Habilidades", "#habilidades", "¿Qué sabe de redes?|¿Qué idiomas habla?"],
  "redes": ["Redes", "#habilidades", "¿Qué sabe de hardware?"],
  "web": ["Desarrollo web", "#proyectos", "¿Qué proyecto ha creado?"],
  "idiomas": ["Idiomas", "#idiomas", "¿Qué nivel de inglés tiene?|¿Qué estudia?"],
  "personales": ["Cualidades", "#sobre-mi", "¿Por qué contratarle?|¿Cómo contactarle?"],
  "proyecto": ["Proyecto", "#proyectos", "¿Qué tecnologías usa?|¿Qué busca?"],
  "busca": ["Objetivo", "#contacto", "¿Por qué contratarle?|¿Cómo contactarle?"],
  "por que contratarle": ["Por qué contratarle", "#contacto", "¿Cómo contactarle?|¿Puedo descargar su CV?"],
  "contacto": ["Contacto", "#contacto", "¿Puedo descargar su CV?|¿Qué busca?"],
  "cv": ["CV", "#contacto", "¿Cómo contactarle?"],
  "quien es sergio": ["Perfil", "#sobre-mi", "¿Qué estudia?|¿Qué hizo en las prácticas?"],
  "resumen": ["Resumen", "#sobre-mi", "¿Qué estudia?|¿Qué busca?"]
};
docs.forEach(d => { const t = TOPIC[d.keys[0]]; if (t && !d.go) d.go = t[1]; });
const SECTIONS_EN = { "#sobre-mi": "About me", "#formacion": "Education", "#experiencia": "Experience", "#habilidades": "Skills", "#idiomas": "Languages", "#proyectos": "Projects", "#contacto": "Contact" };
const secName = g => (LANG === "en" ? SECTIONS_EN : SECTIONS)[g];
const label = d => (LANG === "es" && TOPIC[d.keys[0]]?.[0]) || d.title || secName(d.go) || T("Otro tema", "Other topic");
const SUGG_EN = ["What does he study?", "What did he do in his internship?", "What skills does he have?", "Which languages does he speak?", "What project has he built?", "What is he looking for?", "Why hire him?", "How can I contact him?"];
const SUGG = ["¿Qué estudia?", "¿Qué hizo en las prácticas?", "¿Qué habilidades tiene?", "¿Qué idiomas habla?", "¿Qué proyecto ha creado?", "¿Qué busca?", "¿Por qué contratarle?", "¿Cómo contactarle?"], asked = new Set();

function addMsg(text, who) {
  const d = document.createElement("div");
  d.className = "msg " + who; d.textContent = text;
  chatLog.appendChild(d); chatLog.scrollTop = chatLog.scrollHeight;
  return d;
}
function typeOut(el, text, done) {
  const parts = text.split(/(\s+)/);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || parts.length < 4) { el.textContent = text; done(); return; }
  let i = 0;
  const t = setInterval(() => {
    i = Math.min(parts.length, i + 3);
    el.textContent = parts.slice(0, i).join("");
    chatLog.scrollTop = chatLog.scrollHeight;
    if (i >= parts.length) { clearInterval(t); done(); }
  }, 30);
}
function goTo(sel) {
  const el = document.querySelector(sel);
  if (!el) return;
  if (matchMedia("(max-width: 520px)").matches) setChat(false);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1800);
}
function actions(c, q) {
  const box = document.createElement("div");
  box.className = "msg-actions";
  const btn = (text, fn, cls) => { const b = document.createElement("button"); b.type = "button"; b.textContent = text; if (cls) b.className = cls; b.onclick = fn; box.appendChild(b); };
  if (c.st === "ok" && c.doc && c.doc.go) btn(T("Ver " + (secName(c.doc.go) || "sección") + " en la web →", "See " + (secName(c.doc.go) || "section") + " on the page →"), () => goTo(c.doc.go), "go");
  if (c.st === "low") c.alts.forEach(d => btn(label(d), () => { asked.add(norm(label(d))); addMsg(label(d), "user"); last = d; reply(ans(d), { st: "ok", doc: d }, ""); }));
  if (c.st === "none" && q) {
    if (CONFIG.email) btn(T("Enviar esta pregunta a Sergio", "Send this question to Sergio"), () => { const t = $("#fMsg"); if (t) t.value = q; goTo("#contacto"); }, "go");
    else btn(T("Ir a Contacto", "Go to Contact"), () => goTo("#contacto"), "go");
  }
  if (box.children.length) { chatLog.appendChild(box); chatLog.scrollTop = chatLog.scrollHeight; }
}
function chips(c) {
  const rel = LANG === "en" ? [] : c && c.doc && TOPIC[c.doc.keys[0]]?.[2].split("|") || [];
  const list = [...rel, ...(LANG === "en" ? SUGG_EN : SUGG)].filter((s, i, a) => !asked.has(norm(s)) && a.indexOf(s) === i).slice(0, 4);
  chatChips.replaceChildren(...list.map(s => { const b = document.createElement("button"); b.type = "button"; b.textContent = s; b.onclick = () => ask(s); return b; }));
}
function reply(text, c, q, el) {
  typeOut(el || addMsg("", "bot"), text, () => { actions(c, q); speak(text); chips(c); });
}
function ask(text) {
  text = text.trim();
  if (!text) return;
  asked.add(norm(text)); addMsg(text, "user");
  const m = addMsg("", "bot"); m.classList.add("typing"); m.innerHTML = "<i></i><i></i><i></i>";
  setTimeout(() => {
    let a;
    try { a = getAnswer(text); } catch (e) { a = T("Ha habido un problema al responder. Inténtalo de nuevo.", "Something went wrong. Please try again."); ctx = { st: "none" }; }
    m.classList.remove("typing"); m.textContent = "";
    reply(a, ctx, text, m);
  }, 450);
}

/* Voz: dictado de preguntas y lectura de respuestas (si el navegador lo permite) */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn = $("#chatMic"), ttsBtn = $("#chatTts");
let speakOn = false;
if (!SR) micBtn.hidden = true;
else micBtn.onclick = () => {
  try {
    const r = new SR();
    r.lang = T("es-ES", "en-US");
    r.onstart = () => micBtn.classList.add("listening");
    r.onend = () => micBtn.classList.remove("listening");
    r.onerror = () => addMsg(T("No he podido usar el micrófono. Revisa los permisos del navegador.", "I couldn't use the microphone. Check your browser permissions."), "bot");
    r.onresult = e => ask(e.results[0][0].transcript);
    r.start();
  } catch (e) { addMsg(T("No he podido usar el micrófono.", "I couldn't use the microphone."), "bot"); }
};
if (!("speechSynthesis" in window)) ttsBtn.hidden = true;
ttsBtn.onclick = () => { speakOn = !speakOn; ttsBtn.setAttribute("aria-pressed", String(speakOn)); if (!speakOn) speechSynthesis.cancel(); };
function speak(t) {
  if (!speakOn) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t.replace(/[•\n]+/g, ". ")); u.lang = T("es-ES", "en-US");
  speechSynthesis.speak(u);
}

function setChat(open) {
  chatPanel.hidden = !open;
  document.body.classList.toggle("chat-open", open);
  chatToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    if (!chatLog.children.length) { addMsg(T("¡Hola! Soy el asistente de Sergio. Pregúntame lo que quieras saber sobre él, con tus propias palabras. También puedes dictarme la pregunta con el micrófono.", "Hi! I'm Sergio's assistant. Ask me anything about him in your own words. You can also dictate your question with the microphone."), "bot"); chips(); }
    chatInput.focus();
  } else chatToggle.focus();
}
chatToggle.addEventListener("click", () => setChat(chatPanel.hidden));
$("#chatClose").addEventListener("click", () => setChat(false));
document.addEventListener("keydown", e => { if (e.key === "Escape" && !chatPanel.hidden) setChat(false); });
chatForm.addEventListener("submit", e => { e.preventDefault(); ask(chatInput.value); chatInput.value = ""; });

/* ===== Formulario de contacto (servicio FormSubmit: el mensaje llega a CONFIG.email) ===== */
const cform = $("#cform");
cform.addEventListener("submit", async e => {
  e.preventDefault();
  const st = $("#fStatus"), btn = $("#fBtn");
  if ($("#fHoney").value) return; // antispam: un robot rellena este campo oculto
  if (!CONFIG.email) { st.textContent = T("El formulario aún no está configurado.", "The form isn't set up yet."); return; }
  btn.disabled = true; st.textContent = T("Enviando…", "Sending…");
  try {
    const r = await fetch("https://formsubmit.co/ajax/" + CONFIG.email, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: $("#fName").value, email: $("#fEmail").value, message: $("#fMsg").value, _subject: "Nuevo mensaje desde tu currículum web", _template: "table", _captcha: "false" })
    });
    const j = await r.json();
    if (!r.ok || j.success === false || j.success === "false") throw new Error("send");
    cform.reset();
    st.textContent = T("¡Mensaje enviado! Te responderé lo antes posible.", "Message sent! I'll reply as soon as possible.");
  } catch (err) {
    const a = document.createElement("a");
    a.href = "mailto:" + CONFIG.email; a.textContent = CONFIG.email;
    st.textContent = T("No se ha podido enviar el mensaje. Escríbeme directamente a ", "The message couldn't be sent. Email me directly at ");
    st.append(a, ".");
  } finally { btn.disabled = false; }
});

/* ===== Menús desplegables ===== */
const closeDD = () => document.querySelectorAll(".dd.open").forEach(x => { x.classList.remove("open"); $(".dd-toggle", x).setAttribute("aria-expanded", "false"); });
document.querySelectorAll(".dd").forEach(dd => {
  const t = $(".dd-toggle", dd);
  t.addEventListener("click", e => {
    e.stopPropagation();
    const open = !dd.classList.contains("open");
    closeDD();
    dd.classList.toggle("open", open);
    t.setAttribute("aria-expanded", String(open));
  });
});
document.addEventListener("click", closeDD);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDD(); });
if (CONFIG.email) $("#ddMail").href = "mailto:" + CONFIG.email;
$("#ddForm").addEventListener("click", () => setTimeout(() => $("#fName").focus({ preventScroll: true }), 800));
$("#ddCv").addEventListener("click", () => { closeMenu(); $("#cvBtn").click(); });
$("#heroCv").addEventListener("click", () => $("#cvBtn").click());

/* ===== Copiar correo, volver arriba y tema claro/oscuro ===== */
$("#copyMail").addEventListener("click", async () => {
  const txt = CONFIG.email;
  if (!txt) { showToast(T("Todavía no hay correo configurado.", "No email configured yet.")); return; }
  try { await navigator.clipboard.writeText(txt); }
  catch (e) { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e2) {} ta.remove(); }
  showToast(T("Correo copiado", "Email copied"));
});
const toTop = $("#toTop");
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
addEventListener("scroll", () => { toTop.hidden = scrollY < 700; }, { passive: true });
const themeBtn = $("#themeBtn");
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]').content = t === "light" ? "#f4f6fb" : "#0a1020";
  themeBtn.setAttribute("aria-label", t === "light" ? T("Cambiar a tema oscuro", "Switch to dark theme") : T("Cambiar a tema claro", "Switch to light theme"));
}
themeBtn.addEventListener("click", () => {
  const t = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(t);
  try { localStorage.setItem("theme", t); } catch (e) {}
});
applyTheme(document.documentElement.dataset.theme || "dark");

/* =========================================================
   TRADUCCIÓN ES <-> EN (botón del menú). Para cambiar una traducción,
   edita el texto inglés de la derecha. Los textos nuevos que añadas
   en español se quedan en español hasta que los añadas aquí.
   ========================================================= */
const EN = {
  "Incluye calculadoras, seguimiento de progreso con gráficos, plan de comidas semanal, temporizador de descanso, glosario y recetas. Su asistente FitBot funciona con un «cerebro» local y, opcionalmente, con una clave de Groq.": "Includes calculators, progress tracking with charts, a weekly meal plan, a rest timer, a glossary and recipes. Its FitBot assistant works with a local 'brain' and, optionally, a Groq key.", "API de Groq (opcional)": "Groq API (optional)", "Ver vista previa en vivo": "Watch live preview", "Vista previa del proyecto": "Project preview",
  "Perfil": "Profile", "Copiar correo": "Copy email", "Bajar a la siguiente sección": "Scroll to the next section",
  "Saltar al contenido": "Skip to content", "Sobre mí": "About me", "Formación": "Education", "Experiencia": "Experience", "Habilidades": "Skills", "Idiomas": "Languages", "Proyectos": "Projects", "Contacto": "Contact",
  "Zaragoza, España": "Zaragoza, Spain", "España": "Spain",
  "Informática, tecnología y desarrollo web. Joven, con iniciativa y con ganas de seguir creciendo.": "IT, technology and web development. Young, proactive and eager to keep growing.",
  "Soporte informático": "IT support", "Montaje, mantenimiento y configuración de equipos": "Assembly, maintenance and configuration of computers",
  "Desarrollo web": "Web development", "Diseño y frontend, con el DAM en curso": "Design and frontend, currently studying the DAM",
  "Explorar mi perfil": "Explore my profile", "Contactar": "Get in touch", "Grado Superior en curso": "Higher Vocational Degree in progress",
  "3 meses": "3 months", "de prácticas en Arquisocial": "of internship at Arquisocial", "idiomas": "languages",
  "Soy una persona simpática, amable y con sentido del humor. Me entrego en lo que hago y disfruto trabajando en equipo.": "I'm a friendly, kind person with a sense of humor. I give my all in what I do and enjoy working in a team.",
  "Cómo trabajo": "How I work",
  "Me implico, colaboro con quien tengo al lado y trato a las personas de forma cercana. Me gusta que el trabajo salga bien y que el ambiente sea bueno.": "I get involved, I collaborate with those around me and I treat people warmly. I like work to turn out well and the atmosphere to be good.",
  "Qué me mueve": "What drives me",
  "Aprender cosas nuevas. Estoy al principio de mi trayectoria, pero con formación informática, iniciativa y ganas de mejorar cada día.": "Learning new things. I'm at the start of my career, but with IT training, initiative and the drive to improve every day.",
  "Trabajo en equipo": "Teamwork", "Comunicación y expresión escrita": "Communication and written expression", "Amabilidad y trato cercano": "Kindness and a warm manner", "Implicación y compromiso": "Commitment and dedication",
  "Capacidad de aprendizaje": "Ability to learn", "Actitud positiva": "Positive attitude", "Ganas de mejorar": "Drive to improve",
  "Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)": "Higher Vocational Degree in Cross-Platform Application Development (DAM)", "En curso": "In progress",
  "Grado Medio en Sistemas Microinformáticos y Redes": "Intermediate Vocational Degree in Microcomputer Systems and Networks", "Educación Secundaria Obligatoria (ESO)": "Compulsory Secondary Education (ESO)",
  "Prácticas en Arquisocial": "Internship at Arquisocial",
  "Mi primer contacto con el entorno laboral, donde he podido desarrollar habilidades profesionales y ver cómo se trabaja en el día a día de una empresa.": "My first contact with the working world, where I was able to develop professional skills and see how a company works day to day.",
  "Funciones y responsabilidades": "Duties and responsibilities",
  "Colaboré en la instalación de cerca de 100 antivirus, o más, en los equipos de toda la empresa.": "Helped install around 100 antivirus programs, or more, across the whole company's computers.",
  "Participé en el montaje y desmontaje de ordenadores portátiles y torres.": "Took part in assembling and disassembling laptops and desktop towers.",
  "Configuré dispositivos móviles para su uso en la empresa.": "Configured mobile devices for company use.",
  "Montaje de ordenadores": "Computer assembly", "Mantenimiento de hardware": "Hardware maintenance", "Manejo de móviles, tablets, impresoras y otros dispositivos": "Handling phones, tablets, printers and other devices",
  "Sistemas informáticos": "Computer systems", "Conocimientos generales de informática": "General IT knowledge", "Manejo de ordenadores y dispositivos": "Handling computers and devices",
  "Redes": "Networks", "Conocimientos básicos de redes informáticas": "Basic knowledge of computer networks", "Routers y switches": "Routers and switches",
  "Herramientas de desarrollo": "Development tools", "Manejo avanzado de Visual Studio Code": "Advanced use of Visual Studio Code", "Interés y conocimientos en desarrollo de páginas web": "Interest and knowledge in web development",
  "Español": "Spanish", "Nativo": "Native", "Inglés": "English", "Nivel medio": "Intermediate", "Catalán": "Catalan", "Nivel bajo": "Basic", "Francés": "French",
  "Proyecto personal": "Personal project", "[Nombre del proyecto]": "[Project name]",
  "Una web sobre gimnasio y bienestar. El usuario introduce datos sobre su forma física y la web le propone un plan semanal de nutrición, una planificación semanal de entrenamiento y cuenta con una pequeña inteligencia artificial integrada.": "A website about gym training and wellness. Users enter information about their physical condition and the site suggests a weekly nutrition plan and a weekly workout plan, and includes a small built-in artificial intelligence.",
  "Tecnologías": "Technologies", "[Tecnología 1]": "[Technology 1]", "[Tecnología 2]": "[Technology 2]", "[Tecnología 3]": "[Technology 3]", "Visitar proyecto": "Visit project",
  "Captura 1": "Screenshot 1", "Captura 2": "Screenshot 2", "Captura 3": "Screenshot 3",
  "Busco una oportunidad en montaje, mantenimiento y soporte de equipos informáticos, o en diseño y desarrollo de páginas web.": "I'm looking for an opportunity in computer assembly, maintenance and support, or in web design and development.",
  "Envíame un mensaje": "Send me a message", "Nombre": "Name", "Tu correo": "Your email", "Mensaje": "Message", "Enviar mensaje": "Send message", "Usaré tus datos solo para responderte.": "I'll only use your details to reply to you.",
  "Escribirme un email": "Email me", "Descargar CV": "Download CV", "Volver arriba": "Back to top",
  "Pregúntame": "Ask me", "Asistente de Sergio": "Sergio's assistant", "Responde con la información de su CV": "Answers using the information in his CV",
  "Ir al inicio": "Go to top", "Abrir menú": "Open menu", "Principal": "Main", "Áreas de especialidad": "Areas of expertise", "Datos clave": "Key facts", "Habilidades personales": "Personal skills",
  "Capturas de pantalla": "Screenshots", "Asistente sobre Sergio": "Assistant about Sergio", "Leer las respuestas en voz alta": "Read answers aloud", "Leer en voz alta": "Read aloud",
  "Cerrar chat": "Close chat", "Escribe tu pregunta": "Type your question", "Escribe tu pregunta…": "Type your question…", "Preguntar por voz": "Ask by voice", "Enviar": "Send"
};
const ES_TITLE = document.title, ES_DESC = document.querySelector('meta[name="description"]').content;
const EN_TITLE = "Sergio Moragrega Gracia · IT and web development", EN_DESC = "Interactive CV of Sergio Moragrega Gracia: IT, technical support and web development. Zaragoza, Spain.";
const origText = new Map(), langBtn = $("#langBtn");
function translatePage(toEn) {
  LANG = toEn ? "en" : "es";
  document.documentElement.lang = LANG;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => {
    if (n.parentElement.closest("script, style, #chatLog, #chatChips, .msg-actions")) return;
    if (toEn) {
      const es = origText.has(n) ? origText.get(n) : n.nodeValue, k = es.trim();
      if (EN[k]) { origText.set(n, es); n.nodeValue = es.replace(k, EN[k]); }
    } else if (origText.has(n)) n.nodeValue = origText.get(n);
  });
  document.querySelectorAll("[aria-label], [title], [placeholder]").forEach(e => ["aria-label", "title", "placeholder"].forEach(k => {
    const v = e.getAttribute(k);
    if (v === null) return;
    const d = "data-es-" + k;
    if (toEn) { const o = e.hasAttribute(d) ? e.getAttribute(d) : v; if (EN[o]) { e.setAttribute(d, o); e.setAttribute(k, EN[o]); } }
    else if (e.hasAttribute(d)) e.setAttribute(k, e.getAttribute(d));
  }));
  document.title = toEn ? EN_TITLE : ES_TITLE;
  document.querySelector('meta[name="description"]').content = toEn ? EN_DESC : ES_DESC;
  langBtn.textContent = toEn ? "ES" : "EN";
  langBtn.setAttribute("aria-label", toEn ? "Traducir la página al español" : "Translate the page to English");
  langBtn.title = toEn ? "Español" : "English";
  if (!chatPanel.hidden) chips();
  applyTheme(document.documentElement.dataset.theme || "dark");
}
langBtn.addEventListener("click", () => {
  translatePage(LANG !== "en");
  try { localStorage.setItem("lang", LANG); } catch (e) {}
});
try { if (localStorage.getItem("lang") === "en") translatePage(true); } catch (e) {}

/* ===== Vista previa en vivo del proyecto (se carga solo al pulsar el botón) ===== */
$("#previewBtn").addEventListener("click", () => {
  const f = document.createElement("iframe");
  f.src = $(".project .btn-primary").href;
  f.title = T("Vista previa de Fitness Pro", "Fitness Pro preview");
  f.loading = "lazy";
  $("#preview").replaceChildren(f);
});
