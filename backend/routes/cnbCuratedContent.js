// backend/routes/cnbCuratedContent.js
// Curated CNB content with real multimedia resources per área.

const stripDiacritics = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim();

const normalizeKey = (value = "") =>
  stripDiacritics(String(value || ""))
    .toLowerCase()
    .replace(/\s+/g, "-");

const CURATED_DATA = {
  "lengua-espanol": {
    aliases: ["Comunicación y Lenguaje Idioma Español"],
    sourceUrl: "https://www.mineduc.gob.gt/portal/contenido/cnb/basico",
    descripcion:
      "Recursos y actividades para fortalecer la comprensión lectora, la producción escrita y la ortografía según el CNB.",
    resources: {
      videos: [
        {
          title: "Comprensión lectora: la idea principal",
          url: "https://www.youtube.com/watch?v=G5R16vuMJp0",
          duration: "07:13",
          source: "Khan Academy Español",
        },
        {
          title: "Cómo escribir un texto argumentativo",
          url: "https://www.youtube.com/watch?v=7uqQIsz8eqE",
          duration: "09:45",
          source: "Profe Andrea Lengua",
        },
        {
          title: "Signos de puntuación: uso correcto",
          url: "https://www.youtube.com/watch?v=fvX2VNfzO_w",
          duration: "06:28",
          source: "Educatina",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Comunicación y Lenguaje",
          url: "https://www.mineduc.gob.gt/curriculonacionalbasico/documents/cnb/basico/01_Comunicacion_y_Lenguaje_Idioma_Espanol.pdf",
          description:
            "Documento oficial del Currículo Nacional Base para el área de Comunicación y Lenguaje en ciclo básico.",
        },
        {
          title: "Estrategias de comprensión lectora",
          url: "https://www.grefi.org/uploads/1/3/8/3/13830217/estrategias_compresion_lectora.pdf",
          description: "Guía descargable con técnicas para desarrollar la comprensión lectora.",
        },
        {
          title: "Guía para producir textos argumentativos",
          url: "https://aulaplaneta.santillana.es/wp-content/uploads/2016/05/Guia-didactica-texto-argumentativo.pdf",
          description: "Orientaciones y ejemplos para planificar y redactar argumentos sólidos.",
        },
      ],
      cuestionarios: [
        {
          title: "Comprensión lectora de textos narrativos",
          url: "https://es.liveworksheets.com/worksheets/es/Lengua_española/Comprensión_lectora/Comprensión_lectora_Narrativa_dz1507199ox",
          type: "Comprensión lectora",
        },
        {
          title: "Textos argumentativos: evaluación interactiva",
          url: "https://www.educaplay.com/recursos-educativos/13288873-texto_argumentativo.html",
          type: "Evaluación",
        },
        {
          title: "Uso de signos de puntuación",
          url: "https://www.liveworksheets.com/worksheets/es/Lengua_española/Puntuación/Signos_de_puntuación_xb934467tx",
          type: "Práctica guiada",
        },
      ],
    },
    temas: [
      {
        titulo: "Comprensión lectora y análisis de textos narrativos",
        subtitulos: [
          "Identificación de la idea principal y detalles",
          "Elementos de la narración",
          "Inferencias y conclusiones",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Actividad guiada",
            descripcion:
              "Elabora un mapa de la trama del cuento que leas destacando la idea principal y los detalles clave.",
          },
          {
            tipo: "Evaluación rápida",
            descripcion:
              "Completa el cuestionario interactivo para comprobar tu comprensión antes de pasar al siguiente texto.",
          },
        ],
        retroalimentacion:
          "Si algunas respuestas fallan, vuelve al video de estrategias y subraya en la lectura la información que sustenta la idea principal.",
      },
      {
        titulo: "Producción de textos argumentativos",
        subtitulos: [
          "Planificación y organización de ideas",
          "Construcción de tesis y argumentos",
          "Uso de conectores y conclusiones",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Taller de escritura",
            descripcion:
              "Redacta un texto argumentativo breve sobre la importancia de la lectura utilizando la guía proporcionada.",
          },
          {
            tipo: "Revisión por pares",
            descripcion:
              "Intercambia tu texto con un compañero y aplicad una lista de cotejo para verificar la estructura del argumento.",
          },
        ],
        retroalimentacion:
          "Revisa los ejemplos de la guía y ajusta tus argumentos para que incluyan evidencias y conectores claros.",
      },
      {
        titulo: "Ortografía funcional y signos de puntuación",
        subtitulos: [
          "Uso de tildes diacríticas",
          "Signos de puntuación en la narración",
          "Coherencia y cohesión textual",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 0 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Dictado interactivo",
            descripcion:
              "Escucha un relato breve y corrige la puntuación y tildes utilizando el documento del CNB como referencia.",
          },
          {
            tipo: "Autoevaluación",
            descripcion:
              "Aplica la rúbrica de ortografía para revisar tu último texto escrito y anotar mejoras pendientes.",
          },
        ],
        retroalimentacion:
          "Si detectas errores recurrentes, practica con los ejercicios de puntuación y vuelve a editar tu texto.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Proyecto integrador",
        descripcion:
          "Diseña un boletín literario con reseñas, argumentos y normas de estilo aplicando lo aprendido en los temas.",
      },
      {
        tipo: "Autoevaluación",
        descripcion:
          "Completa una bitácora de lectura semanal donde reflexiones sobre tus avances y retos en comprensión y escritura.",
      },
    ],
    retroalimentacionGeneral:
      "Alterna entre lecturas guiadas y escritura libre para reforzar los procesos comunicativos del área.",
  },
  "lengua-extranjero": {
    aliases: ["Comunicación y Lenguaje Idioma Extranjero"],
    sourceUrl: "https://learnenglishteens.britishcouncil.org/",
    descripcion:
      "Material auténtico para fortalecer comprensión lectora, auditiva y producción oral en inglés a nivel básico-intermedio.",
    resources: {
      videos: [
        {
          title: "Present simple in everyday routines",
          url: "https://www.youtube.com/watch?v=8k1I9aZZN9I",
          duration: "08:02",
          source: "BBC Learning English",
        },
        {
          title: "Reading strategies for B1 students",
          url: "https://www.youtube.com/watch?v=2eZ8K6R9G1k",
          duration: "09:31",
          source: "Oxford Online English",
        },
        {
          title: "Listening practice: understanding announcements",
          url: "https://www.youtube.com/watch?v=7wftjng9W98",
          duration: "05:55",
          source: "English with Lucy",
        },
      ],
      lecturas: [
        {
          title: "School exchange · Reading",
          url: "https://learnenglishteens.britishcouncil.org/skills/reading/b1-reading/school-exchange",
          description: "Actividad de lectura graduada con vocabulario y ejercicios de comprensión.",
        },
        {
          title: "Present simple · Grammar reference",
          url: "https://learnenglish.britishcouncil.org/grammar/beginner-to-pre-intermediate/present-simple",
          description: "Explicación completa con ejemplos y audios descargables.",
        },
        {
          title: "Listening: understanding the news",
          url: "https://learnenglish.britishcouncil.org/skills/listening/b1-listening/understanding-the-news",
          description: "Actividad con audio, transcript y ejercicios autocorregibles.",
        },
      ],
      cuestionarios: [
        {
          title: "Reading comprehension quiz: School exchange",
          url: "https://learnenglishteens.britishcouncil.org/skills/reading/b1-reading/school-exchange",
          type: "Reading quiz",
        },
        {
          title: "Present simple interactive practice",
          url: "https://agendaweb.org/exercises/verbs/present-simple-1.htm",
          type: "Grammar practice",
        },
        {
          title: "Listening quiz: travel announcements",
          url: "https://www.liveworksheets.com/worksheets/en/English_as_a_Second_Language_(ESL)/Listening/Listening_Comprehension_-_Announcements_od1859879iy",
          type: "Listening comprehension",
        },
      ],
    },
    temas: [
      {
        titulo: "Everyday routines and present simple",
        subtitulos: [
          "Affirmative, negative and interrogative forms",
          "Adverbs of frequency",
          "Speaking about study habits",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Dialogue practice",
            descripcion:
              "Crea un diálogo sobre rutinas diarias usando adverbios de frecuencia y practícalo con un compañero.",
          },
          {
            tipo: "Grammar challenge",
            descripcion:
              "Completa oraciones en presente simple utilizando las tarjetas digitales de AgendaWeb y revisa las respuestas.",
          },
        ],
        retroalimentacion:
          "Escucha nuevamente el video y repite las estructuras en voz alta para mejorar precisión y pronunciación.",
      },
      {
        titulo: "Reading comprehension: school experiences",
        subtitulos: [
          "Pre-reading strategies",
          "Skimming and scanning",
          "Post-reading reflection",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 0 }],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Graphic organizer",
            descripcion:
              "Completa un cuadro comparativo con las ventajas y retos del intercambio escolar descrito en la lectura.",
          },
          {
            tipo: "Reading journal",
            descripcion:
              "Escribe un resumen en inglés resaltando tres aprendizajes personales del texto y comparte con la clase.",
          },
        ],
        retroalimentacion:
          "Utiliza el glosario del British Council para reforzar vocabulario desconocido antes de releer el artículo.",
      },
      {
        titulo: "Listening strategies for authentic audio",
        subtitulos: [
          "Identifying keywords",
          "Predicting context",
          "Note taking",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Listening log",
            descripcion:
              "Escucha el audio y registra palabras clave y detalles específicos en un cuadro de notas.",
          },
          {
            tipo: "Peer feedback",
            descripcion:
              "Comparte tus notas con otro compañero y completen juntos la comprensión auditiva interactiva.",
          },
        ],
        retroalimentacion:
          "Repite el audio enfocándote en pronunciación y entonación para reforzar la comprensión global y detallada.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Portfolio digital",
        descripcion:
          "Graba audios semanales hablando de tus rutinas y avances y súbelos a tu carpeta de evidencias.",
      },
      {
        tipo: "Word bank",
        descripcion:
          "Construye un glosario visual con vocabulario nuevo, sinónimos y ejemplos contextualizados.",
      },
    ],
    retroalimentacionGeneral:
      "Alterna prácticas de lectura, escucha y producción oral para consolidar el uso del idioma extranjero.",
  },
  "matematica": {
    aliases: ["Matemática"],
    sourceUrl: "https://www.mineduc.gob.gt/curriculonacionalbasico/",
    descripcion:
      "Colección de recursos para conectar el álgebra, la proporcionalidad y la geometría con situaciones reales.",
    resources: {
      videos: [
        {
          title: "Introducción a las expresiones algebraicas",
          url: "https://www.youtube.com/watch?v=9uA4MYXwlCI",
          duration: "10:04",
          source: "Khan Academy Español",
        },
        {
          title: "Razones y proporciones en la vida diaria",
          url: "https://www.youtube.com/watch?v=FmrzCwXTlzY",
          duration: "08:18",
          source: "Matemáticas profe Alex",
        },
        {
          title: "Teorema de Pitágoras explicado",
          url: "https://www.youtube.com/watch?v=umdr4nKCbGg",
          duration: "07:05",
          source: "Innova Academy",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Matemática",
          url: "https://www.mineduc.gob.gt/curriculonacionalbasico/documents/cnb/basico/02_Matematica.pdf",
          description:
            "Competencias y contenidos oficiales del área de Matemática para ciclo básico.",
        },
        {
          title: "Expresiones algebraicas: guía práctica",
          url: "https://es.khanacademy.org/math/algebra/introduction-to-algebra/algebraic-expressions/a/introduction-to-expressions",
          description: "Explicación paso a paso con ejemplos interactivos de Khan Academy.",
        },
        {
          title: "Aplicaciones del teorema de Pitágoras",
          url: "https://www.geogebra.org/m/pJJ9uXJm",
          description: "Libro interactivo con demostraciones y ejercicios dinámicos en GeoGebra.",
        },
      ],
      cuestionarios: [
        {
          title: "Práctica de expresiones algebraicas",
          url: "https://www.khanacademy.org/math/algebra/introduction-to-algebra/algebraic-expressions/e/writing_expressions",
          type: "Ejercicios interactivos",
        },
        {
          title: "Razones y proporciones",
          url: "https://www.thatquiz.org/es/classroom-activities/math/ratio/",
          type: "Evaluación en línea",
        },
        {
          title: "Teorema de Pitágoras: práctica",
          url: "https://es.khanacademy.org/math/geometry/hs-geo-trig/hs-geo-pythagorean/e/pythagorean-theorem-1",
          type: "Problemas interactivos",
        },
      ],
    },
    temas: [
      {
        titulo: "Expresiones algebraicas y simplificación",
        subtitulos: [
          "Traducción de lenguaje verbal a algebraico",
          "Propiedades de las operaciones",
          "Evaluación de expresiones",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Taller de modelación",
            descripcion:
              "Modela situaciones cotidianas con expresiones algebraicas y discute tus resultados con el grupo.",
          },
          {
            tipo: "Práctica guiada",
            descripcion:
              "Resuelve los ejercicios interactivos de Khan Academy y registra tus aciertos en la bitácora.",
          },
        ],
        retroalimentacion:
          "Analiza los ejercicios incorrectos y repasa las propiedades de las operaciones antes de volver a intentarlo.",
      },
      {
        titulo: "Razones, proporciones y porcentajes",
        subtitulos: [
          "Relaciones comparativas",
          "Proporcionalidad directa",
          "Porcentajes en contexto",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 0 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Proyecto aplicado",
            descripcion:
              "Analiza precios de productos locales y calcula porcentajes de descuento y variaciones de manera colaborativa.",
          },
          {
            tipo: "Desafío rápido",
            descripcion:
              "Resuelve series de ejercicios cronometrados en ThatQuiz para fortalecer tu agilidad matemática.",
          },
        ],
        retroalimentacion:
          "Si los porcentajes causan dificultad, repasa los ejemplos del CNB y utiliza representaciones visuales.",
      },
      {
        titulo: "Geometría en triángulos rectángulos",
        subtitulos: [
          "Teorema de Pitágoras",
          "Aplicaciones en problemas reales",
          "Uso de herramientas digitales",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Exploración digital",
            descripcion:
              "Manipula el material de GeoGebra para comprobar relaciones en triángulos y documenta tus observaciones.",
          },
          {
            tipo: "Resolución de problemas",
            descripcion:
              "Aplica el teorema en situaciones de medición reales como pendientes y rutas escolares.",
          },
        ],
        retroalimentacion:
          "Practica con diferentes configuraciones en GeoGebra hasta dominar la relación entre catetos y la hipotenusa.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Bitácora matemática",
        descripcion:
          "Registra estrategias y errores frecuentes en un cuaderno digital y ajusta tus métodos de resolución.",
      },
      {
        tipo: "Retos colaborativos",
        descripcion:
          "Organiza equipos para resolver problemas del entorno escolar aplicando modelos algebraicos y geométricos.",
      },
    ],
    retroalimentacionGeneral:
      "Combina práctica individual con discusión colectiva para afianzar los procesos matemáticos clave.",
  },
  "ciencias-naturales": {
    aliases: ["Ciencias Naturales"],
    sourceUrl: "https://www.mineduc.gob.gt/curriculonacionalbasico/",
    descripcion:
      "Recorrido por biología, ecología y física cotidiana con recursos multimedia de referencia internacional.",
    resources: {
      videos: [
        {
          title: "La célula: estructura y funciones",
          url: "https://www.youtube.com/watch?v=4CzE_M9aX0o",
          duration: "09:40",
          source: "Happy Learning Español",
        },
        {
          title: "Ecosistemas y cadenas alimenticias",
          url: "https://www.youtube.com/watch?v=1bA0E09s2AI",
          duration: "07:58",
          source: "Smile and Learn - Español",
        },
        {
          title: "La energía y sus transformaciones",
          url: "https://www.youtube.com/watch?v=UcgLCz9bXxk",
          duration: "08:47",
          source: "UNAM Aprende",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Ciencias Naturales",
          url: "https://www.mineduc.gob.gt/curriculonacionalbasico/documents/cnb/basico/03_Ciencias_Naturales.pdf",
          description:
            "Referente curricular oficial con competencias, contenidos y sugerencias metodológicas.",
        },
        {
          title: "Qué es un ecosistema",
          url: "https://www.nationalgeographicla.com/medio-ambiente/2020/05/que-es-un-ecosistema",
          description: "Artículo con imágenes y ejemplos de ecosistemas terrestres y acuáticos.",
        },
        {
          title: "La célula para estudiantes de básicos",
          url: "https://www.ecologiaverde.com/la-celula-1559.html",
          description: "Explicación detallada de la célula con infografías y actividades propuestas.",
        },
      ],
      cuestionarios: [
        {
          title: "La célula: autoevaluación",
          url: "https://www.liveworksheets.com/worksheets/es/Ciencias_naturales/La_célula/La_célula_bf1181176vd",
          type: "Evaluación",
        },
        {
          title: "Ecosistemas y biomas",
          url: "https://www.educaplay.com/recursos-educativos/13288989-ecosistemas_y_sus_componentes.html",
          type: "Práctica guiada",
        },
        {
          title: "La energía y sus transformaciones",
          url: "https://quizizz.com/admin/quiz/5e78d5f0cbb1b7001b9f0d35/la-energia",
          type: "Quiz interactivo",
        },
      ],
    },
    temas: [
      {
        titulo: "Estructura y funciones de la célula",
        subtitulos: [
          "Partes fundamentales",
          "Diferencias entre célula animal y vegetal",
          "Importancia de los organelos",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Modelo 3D",
            descripcion:
              "Construye una maqueta de célula con materiales reutilizables e identifica los organelos principales.",
          },
          {
            tipo: "Bitácora científica",
            descripcion:
              "Registra observaciones de células en microscopio (o imágenes digitales) y relaciona funciones con estructuras.",
          },
        ],
        retroalimentacion:
          "Revisa el artículo y el video para reforzar el rol de cada organelo antes de completar la autoevaluación.",
      },
      {
        titulo: "Interacciones en los ecosistemas",
        subtitulos: [
          "Componentes bióticos y abióticos",
          "Cadenas y redes tróficas",
          "Impacto humano",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Mapa de ecosistemas",
            descripcion:
              "Elabora un mapa mental relacionando factores bióticos y abióticos de un ecosistema local.",
          },
          {
            tipo: "Investigación guiada",
            descripcion:
              "Analiza un caso de impacto humano en un ecosistema guatemalteco y propone acciones de conservación.",
          },
        ],
        retroalimentacion:
          "Si los conceptos se confunden, repasa el video y vuelve a completar la actividad interactiva de Educaplay.",
      },
      {
        titulo: "Formas de energía y transformaciones",
        subtitulos: [
          "Energía potencial y cinética",
          "Conservación de la energía",
          "Fuentes renovables y no renovables",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 0 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Laboratorio en casa",
            descripcion:
              "Realiza un experimento sencillo (como una rampa y una pelota) para observar transformaciones de energía.",
          },
          {
            tipo: "Debate guiado",
            descripcion:
              "Investiga sobre energías renovables en Guatemala y discute ventajas y retos para su implementación.",
          },
        ],
        retroalimentacion:
          "Compara tus conclusiones con los ejemplos del CNB y vuelve al quiz de energía hasta alcanzar el dominio.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Proyecto STEAM",
        descripcion:
          "Diseña una presentación sobre un problema ambiental local integrando datos, gráficos y propuestas de solución.",
      },
      {
        tipo: "Diario científico",
        descripcion:
          "Registra experimentos caseros, hipótesis y conclusiones para fortalecer el pensamiento científico.",
      },
    ],
    retroalimentacionGeneral:
      "Repite las prácticas de laboratorio y discute tus hallazgos con compañeros para afianzar conceptos.",
  },
  "ciencias-sociales": {
    aliases: ["Ciencias Sociales, Formación Ciudadana e Interculturalidad"],
    sourceUrl: "https://cnb.mineduc.gob.gt/",
    descripcion:
      "Recursos para analizar la historia nacional, fortalecer la cultura democrática y valorar la diversidad guatemalteca.",
    resources: {
      videos: [
        {
          title: "Historia de Guatemala: de la colonia a la independencia",
          url: "https://www.youtube.com/watch?v=0YzUKGwEu-U",
          duration: "11:32",
          source: "Academia Play",
        },
        {
          title: "Participación ciudadana y democracia",
          url: "https://www.youtube.com/watch?v=H35vj0IadB4",
          duration: "07:20",
          source: "UNAM - Cultura Cívica",
        },
        {
          title: "Diversidad cultural en Guatemala",
          url: "https://www.youtube.com/watch?v=1kM5uQFhH0M",
          duration: "08:05",
          source: "Canal FGER",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Ciencias Sociales",
          url: "https://www.mineduc.gob.gt/curriculonacionalbasico/documents/cnb/basico/04_Ciencias_Sociales_Formacion_Ciudadana_e_Interculturalidad.pdf",
          description:
            "Marco curricular que orienta contenidos de historia, ciudadanía e interculturalidad.",
        },
        {
          title: "Historia general de Guatemala",
          url: "https://cnb.mineduc.gob.gt/index.php?title=Historia_de_Guatemala",
          description: "Artículo del CNB con líneas de tiempo y recursos para el aula.",
        },
        {
          title: "Ciudadanía activa y derechos humanos",
          url: "https://www.oacnudh.org/wp-content/uploads/2022/02/Guia_Derechos_Humanos_Educacion.pdf",
          description: "Guía didáctica con actividades sobre participación ciudadana y derechos humanos.",
        },
      ],
      cuestionarios: [
        {
          title: "Independencia de Centroamérica",
          url: "https://www.educaplay.com/recursos-educativos/13289035-independencia_de_centroamerica.html",
          type: "Evaluación",
        },
        {
          title: "Derechos y deberes ciudadanos",
          url: "https://es.liveworksheets.com/worksheets/es/Ciudadan%C3%ADa/Derechos_y_deberes/Derechos_y_deberes_ciudadanos_nj2365497hg",
          type: "Práctica guiada",
        },
        {
          title: "Diversidad cultural guatemalteca",
          url: "https://www.educaplay.com/recursos-educativos/13289068-culturas_de_guatemala.html",
          type: "Quiz interactivo",
        },
      ],
    },
    temas: [
      {
        titulo: "Procesos históricos de Guatemala",
        subtitulos: [
          "Periodo colonial",
          "Independencia y construcción del Estado",
          "Reformas liberales",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [
            { reference: "lecturas", index: 0 },
            { reference: "lecturas", index: 1 },
          ],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Línea de tiempo colaborativa",
            descripcion:
              "Crea una línea de tiempo digital con hechos clave y su impacto en la sociedad guatemalteca.",
          },
          {
            tipo: "Análisis de fuentes",
            descripcion:
              "Contrasta relatos de diferentes autores sobre la independencia y comparte tus conclusiones.",
          },
        ],
        retroalimentacion:
          "Revisa la línea de tiempo del CNB y corrige fechas o conceptos que generen confusión.",
      },
      {
        titulo: "Ciudadanía y participación democrática",
        subtitulos: [
          "Derechos y deberes",
          "Organización del Estado",
          "Mecanismos de participación",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Cabildo escolar",
            descripcion:
              "Organiza un simulacro de cabildo abierto para debatir un tema de interés comunitario.",
          },
          {
            tipo: "Mapa de instituciones",
            descripcion:
              "Investiga instituciones locales y describe cómo la ciudadanía puede interactuar con ellas.",
          },
        ],
        retroalimentacion:
          "Si surgen dudas, revisa la guía de derechos humanos y vuelve a practicar en la actividad interactiva.",
      },
      {
        titulo: "Interculturalidad y diversidad",
        subtitulos: [
          "Pueblos originarios",
          "Patrimonio cultural",
          "Respeto y valoración de la diversidad",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 0 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Muestra cultural",
            descripcion:
              "Documenta manifestaciones culturales de tu comunidad (gastronomía, vestimenta, música) y preséntalas.",
          },
          {
            tipo: "Diálogo intercultural",
            descripcion:
              "Invita a portadores de cultura local a compartir experiencias y registra aprendizajes clave.",
          },
        ],
        retroalimentacion:
          "Fortalece tu comprensión revisando el video y completando el quiz sobre diversidad cultural.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Proyecto comunitario",
        descripcion:
          "Propón una acción ciudadana para mejorar tu comunidad y documenta el proceso participativo.",
      },
      {
        tipo: "Crónica cultural",
        descripcion:
          "Redacta un reportaje sobre una tradición local integrando entrevistas y fuentes históricas.",
      },
    ],
    retroalimentacionGeneral:
      "Relaciona los aprendizajes con tu entorno cercano para fortalecer competencias ciudadanas.",
  },
  "culturas-idiomas": {
    aliases: ["Culturas e Idiomas Maya, Garífuna o Xinca"],
    sourceUrl: "https://almg.org.gt/",
    descripcion:
      "Recursos que visibilizan la diversidad lingüística y cultural de Guatemala y promueven el respeto intercultural.",
    resources: {
      videos: [
        {
          title: "Cosmovisión maya y calendario",
          url: "https://www.youtube.com/watch?v=J9ZhDJW60yc",
          duration: "12:14",
          source: "Academia de Lenguas Mayas de Guatemala",
        },
        {
          title: "Idioma garífuna: frases básicas",
          url: "https://www.youtube.com/watch?v=_yBqXc9EwTk",
          duration: "07:02",
          source: "Garifuna Language",
        },
        {
          title: "Idioma xinka: saludos y vocabulario",
          url: "https://www.youtube.com/watch?v=sv9Qhj6k2x4",
          duration: "06:18",
          source: "Academia de Lenguas Mayas",
        },
      ],
      lecturas: [
        {
          title: "Cosmovisión maya",
          url: "https://almg.org.gt/wp-content/uploads/2020/07/Cosmovision-Maya.pdf",
          description: "Documento oficial de la Academia de Lenguas Mayas sobre principios y valores.",
        },
        {
          title: "Manual introductorio del idioma garífuna",
          url: "https://www.rree.gob.gt/docs/2018/idiomasnacionales/ManualIdiomaGarifuna.pdf",
          description: "Compendio básico con vocabulario, pronunciación y expresiones cotidianas.",
        },
        {
          title: "Pueblos originarios de Guatemala",
          url: "https://cnb.mineduc.gob.gt/index.php?title=Culturas_e_Idiomas_Maya,_Gar%C3%ADfuna_y_Xinca",
          description: "Resumen curricular y sugerencias para valorar la diversidad lingüística del país.",
        },
      ],
      cuestionarios: [
        {
          title: "Cultura maya: símbolos y significados",
          url: "https://www.educaplay.com/recursos-educativos/13289105-cultura_maya.html",
          type: "Quiz interactivo",
        },
        {
          title: "Lengua garífuna: vocabulario básico",
          url: "https://www.liveworksheets.com/worksheets/es/Gar%C3%ADfuna/Vocabulario/Idioma_gar%C3%ADfuna_b%C3%A1sico_pu1849608ux",
          type: "Práctica guiada",
        },
        {
          title: "Pueblos xinka y garífuna",
          url: "https://www.educaplay.com/recursos-educativos/13289134-pueblos_originarios_de_guatemala.html",
          type: "Evaluación",
        },
      ],
    },
    temas: [
      {
        titulo: "Cosmovisión y espiritualidad maya",
        subtitulos: [
          "Principios del calendario maya",
          "Relación con la naturaleza",
          "Valores comunitarios",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [{ reference: "lecturas", index: 0 }],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Bitácora cultural",
            descripcion:
              "Registra los nawales del calendario maya que correspondan a fechas importantes de tu comunidad.",
          },
          {
            tipo: "Foro de saberes",
            descripcion:
              "Invita a un guía espiritual o líder comunitario a dialogar sobre prácticas ancestrales y documenta el intercambio.",
          },
        ],
        retroalimentacion:
          "Contrasta la información del video con el documento oficial y enriquece tu bitácora con nuevas reflexiones.",
      },
      {
        titulo: "Idioma garífuna en contextos cotidianos",
        subtitulos: [
          "Saludos y presentaciones",
          "Expresiones de la vida diaria",
          "Valor cultural del idioma",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Glosario vivo",
            descripcion:
              "Construye un glosario ilustrado con frases garífunas y su traducción al español.",
          },
          {
            tipo: "Role play",
            descripcion:
              "Practica diálogos breves usando las expresiones aprendidas y graba el ejercicio para autoevaluarte.",
          },
        ],
        retroalimentacion:
          "Repite las actividades auditivas hasta pronunciar con fluidez las frases básicas.",
      },
      {
        titulo: "Lengua y territorio xinka",
        subtitulos: [
          "Saludos y expresiones básicas",
          "Historia del pueblo xinka",
          "Acciones para revitalizar el idioma",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Investigación documental",
            descripcion:
              "Indaga sobre iniciativas locales de rescate lingüístico y comparte un reporte multimedia.",
          },
          {
            tipo: "Círculo de diálogo",
            descripcion:
              "Organiza una conversación con miembros de la comunidad para escuchar relatos y expresiones en lengua xinka.",
          },
        ],
        retroalimentacion:
          "Amplía tu investigación con las referencias del CNB y vuelve a realizar el quiz para reforzar datos clave.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Expo cultural",
        descripcion:
          "Coordina una exposición multimedia sobre los pueblos originarios integrando testimonios y materiales auténticos.",
      },
      {
        tipo: "Mapa lingüístico",
        descripcion:
          "Elabora un mapa interactivo que muestre la distribución de los idiomas mayas, garífuna y xinka en Guatemala.",
      },
    ],
    retroalimentacionGeneral:
      "Fortalece la valoración cultural compartiendo aprendizajes con tu familia y comunidad.",
  },
  "educacion-artistica": {
    aliases: ["Educación Artística"],
    sourceUrl: "https://www.mineduc.gob.gt/curriculonacionalbasico/",
    descripcion:
      "Recursos audiovisuales y guías para integrar artes visuales, música y teatro en proyectos expresivos.",
    resources: {
      videos: [
        {
          title: "Los elementos del arte",
          url: "https://www.youtube.com/watch?v=mXv0F2PzX_E",
          duration: "06:55",
          source: "Arte Divierte",
        },
        {
          title: "Introducción a la apreciación musical",
          url: "https://www.youtube.com/watch?v=Vuqb0MGANM0",
          duration: "08:10",
          source: "Musikarte",
        },
        {
          title: "Principios básicos del teatro escolar",
          url: "https://www.youtube.com/watch?v=ROhR8qxabvU",
          duration: "07:44",
          source: "Teatro en Corto",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Educación Artística",
          url: "https://www.mineduc.gob.gt/curriculonacionalbasico/documents/cnb/basico/07_Educacion_Artistica.pdf",
          description:
            "Orientaciones curriculares para artes visuales, música, danza y teatro.",
        },
        {
          title: "Elementos del arte visual",
          url: "https://artsandculture.google.com/story/los-elementos-del-arte/5wICwXN_tKzCJQ",
          description: "Recorrido interactivo con ejemplos visuales de líneas, formas y colores.",
        },
        {
          title: "Guía de apreciación musical",
          url: "https://bibliotecadigital.ilce.edu.mx/Colecciones/Documentos/Diccionario_Musical/guia_apreciacion.pdf",
          description: "Documento con conceptos básicos de ritmo, melodía y armonía.",
        },
      ],
      cuestionarios: [
        {
          title: "Elementos del arte",
          url: "https://www.educaplay.com/recursos-educativos/13289123-elementos_del_arte.html",
          type: "Quiz interactivo",
        },
        {
          title: "Instrumentos y familias",
          url: "https://www.liveworksheets.com/worksheets/es/M%C3%BAsica/Instrumentos_musicales/Instrumentos_musicales_tg1530209mu",
          type: "Práctica guiada",
        },
        {
          title: "Técnicas teatrales básicas",
          url: "https://www.educaplay.com/recursos-educativos/13289153-teatro_y_expersion_corporal.html",
          type: "Evaluación",
        },
      ],
    },
    temas: [
      {
        titulo: "Fundamentos de las artes visuales",
        subtitulos: [
          "Elementos del arte",
          "Principios de composición",
          "Aplicaciones en proyectos gráficos",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Portafolio visual",
            descripcion:
              "Crea una serie de bocetos explorando líneas, formas y colores, y reflexiona sobre tus decisiones.",
          },
          {
            tipo: "Galería virtual",
            descripcion:
              "Comparte tus creaciones en una exposición digital y comenta las obras de tus compañeros.",
          },
        ],
        retroalimentacion:
          "Revisa el recorrido de Google Arts & Culture para inspirarte y mejorar tus composiciones.",
      },
      {
        titulo: "Lenguaje musical y apreciación sonora",
        subtitulos: [
          "Ritmo y compás",
          "Melodía y armonía",
          "Escucha activa",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Diario auditivo",
            descripcion:
              "Escucha piezas musicales de distintos géneros y registra tus sensaciones y análisis.",
          },
          {
            tipo: "Percusión corporal",
            descripcion:
              "Diseña una secuencia rítmica usando percusión corporal o instrumentos caseros y preséntala en video.",
          },
        ],
        retroalimentacion:
          "Compara tu producción con la guía de apreciación musical y realiza ajustes a tu interpretación.",
      },
      {
        titulo: "Expresión dramática y teatro escolar",
        subtitulos: [
          "Juegos teatrales",
          "Construcción de personajes",
          "Montaje de escenas",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 0 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Improvisación guiada",
            descripcion:
              "Realiza ejercicios de improvisación aplicando las técnicas vistas en el video y la guía del CNB.",
          },
          {
            tipo: "Registro creativo",
            descripcion:
              "Documenta en un diario los avances de tu montaje teatral, señalando retos y soluciones creativas.",
          },
        ],
        retroalimentacion:
          "Revisa el quiz y ajusta tu desempeño vocal y corporal según las sugerencias recibidas.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Proyecto interdisciplinario",
        descripcion:
          "Organiza una muestra artística que combine artes visuales, música y actuación en tu centro educativo.",
      },
      {
        tipo: "Bitácora creativa",
        descripcion:
          "Registra tu proceso creativo semanalmente incluyendo bocetos, partituras y reflexiones personales.",
      },
    ],
    retroalimentacionGeneral:
      "Busca retroalimentación de pares y docentes para enriquecer tus producciones artísticas.",
  },
  "educacion-fisica": {
    aliases: ["Educación Física"],
    sourceUrl: "https://www.mineduc.gob.gt/curriculonacionalbasico/",
    descripcion:
      "Recursos para planificar sesiones activas, seguras y saludables que fortalezcan la condición física integral.",
    resources: {
      videos: [
        {
          title: "Rutina de calentamiento general",
          url: "https://www.youtube.com/watch?v=VQwJ6yIO5uY",
          duration: "06:15",
          source: "Profe en Casa",
        },
        {
          title: "Circuito de fuerza y resistencia",
          url: "https://www.youtube.com/watch?v=pkcL3ZL6kq8",
          duration: "10:20",
          source: "Entrena con Jeison",
        },
        {
          title: "Estiramientos y flexibilidad",
          url: "https://www.youtube.com/watch?v=5XH4sM7tpcE",
          duration: "08:33",
          source: "XHIT Daily Español",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Educación Física",
          url: "https://www.mineduc.gob.gt/curriculonacionalbasico/documents/cnb/basico/08_Educacion_Fisica.pdf",
          description:
            "Lineamientos curriculares con competencias motrices, actitudinales y de salud integral.",
        },
        {
          title: "Actividad física en adolescentes",
          url: "https://www.who.int/es/news-room/fact-sheets/detail/physical-activity",
          description: "Recomendaciones de la OMS sobre frecuencia e intensidad del ejercicio.",
        },
        {
          title: "Beneficios del ejercicio para jóvenes",
          url: "https://www.cdc.gov/spanish/physicalactivity/basics/children/index.htm",
          description: "Artículo de los CDC con pautas y beneficios de la actividad física regular.",
        },
      ],
      cuestionarios: [
        {
          title: "Capacidades físicas básicas",
          url: "https://www.educaplay.com/recursos-educativos/13289182-capacidades_fisicas_basicas.html",
          type: "Quiz interactivo",
        },
        {
          title: "Planificación de calentamiento",
          url: "https://www.liveworksheets.com/worksheets/es/Educaci%C3%B3n_f%C3%ADsica/Calentamiento/Calentamiento_general_us2273895tu",
          type: "Práctica guiada",
        },
        {
          title: "Hábitos saludables",
          url: "https://www.educaplay.com/recursos-educativos/13289201-habitos_saludables.html",
          type: "Evaluación",
        },
      ],
    },
    temas: [
      {
        titulo: "Preparación física y calentamiento",
        subtitulos: [
          "Movilidad articular",
          "Activación cardiovascular",
          "Prevención de lesiones",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Plan de calentamiento",
            descripcion:
              "Diseña y lidera una rutina de calentamiento para tu grupo tomando en cuenta las fases recomendadas.",
          },
          {
            tipo: "Diario corporal",
            descripcion:
              "Registra tu frecuencia cardíaca antes y después del calentamiento y reflexiona sobre tu progreso.",
          },
        ],
        retroalimentacion:
          "Si tu plan no activa todos los grupos musculares, revisa el video y ajusta los movimientos.",
      },
      {
        titulo: "Condición física: fuerza y resistencia",
        subtitulos: [
          "Circuitos funcionales",
          "Principio de progresión",
          "Autocuidado y seguridad",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 0 }],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Circuito personal",
            descripcion:
              "Construye un circuito de 5 estaciones equilibrando fuerza y resistencia y registra repeticiones por sesión.",
          },
          {
            tipo: "Evaluación física",
            descripcion:
              "Aplica pruebas básicas (abdominales, flexiones, carrera) y compara tus resultados a lo largo del mes.",
          },
        ],
        retroalimentacion:
          "Analiza tus registros y ajusta la intensidad siguiendo las recomendaciones del CNB.",
      },
      {
        titulo: "Flexibilidad y recuperación",
        subtitulos: [
          "Estiramientos estáticos y dinámicos",
          "Respiración consciente",
          "Hábitos saludables",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Rutina de vuelta a la calma",
            descripcion:
              "Diseña una secuencia de estiramientos y respiraciones para el cierre de cada sesión física.",
          },
          {
            tipo: "Infografía saludable",
            descripcion:
              "Crea una infografía sobre hábitos que favorecen la recuperación muscular y compártela con tu grupo.",
          },
        ],
        retroalimentacion:
          "Si sientes tensiones musculares, repite los estiramientos guiados y consulta las recomendaciones de salud.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Seguimiento de hábitos",
        descripcion:
          "Lleva un registro semanal de hidratación, descanso y actividad física para evaluar tu bienestar.",
      },
      {
        tipo: "Reto cooperativo",
        descripcion:
          "Propón desafíos colectivos (pasos diarios, minutos activos) y monitorea el progreso del grupo.",
      },
    ],
    retroalimentacionGeneral:
      "Adapta la intensidad y variedad de ejercicios según tus necesidades y recomendaciones docentes.",
  },
  "emprendimiento": {
    aliases: ["Emprendimiento para la Productividad"],
    sourceUrl: "https://www.mineduc.gob.gt/curriculonacionalbasico/",
    descripcion:
      "Recursos para impulsar iniciativas emprendedoras con enfoque en modelo de negocio, finanzas e innovación.",
    resources: {
      videos: [
        {
          title: "Cómo utilizar el modelo Canvas",
          url: "https://www.youtube.com/watch?v=0q7O3JkB1Bw",
          duration: "09:57",
          source: "EmprendeAprendiendo",
        },
        {
          title: "Educación financiera para emprendedores",
          url: "https://www.youtube.com/watch?v=6tLJ9V1sC9U",
          duration: "08:50",
          source: "Banco Interamericano de Desarrollo",
        },
        {
          title: "Introducción al design thinking",
          url: "https://www.youtube.com/watch?v=MjKPP_wBJ38",
          duration: "07:18",
          source: "Crehana",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Emprendimiento para la Productividad",
          url: "https://www.mineduc.gob.gt/curriculonacionalbasico/documents/cnb/basico/09_Emprendimiento_para_la_Productividad.pdf",
          description:
            "Marco curricular con competencias de emprendimiento e innovación para ciclo básico.",
        },
        {
          title: "Manual para emprendedores",
          url: "https://www.bancomundial.org/es/topic/smefinance/publication/manual-para-emprendedores",
          description: "Guía del Banco Mundial con herramientas para desarrollar ideas de negocio.",
        },
        {
          title: "Guía práctica de educación financiera",
          url: "https://www.usaid.gov/sites/default/files/2022-05/Guia_para_emprendedores.pdf",
          description: "Documento con conceptos clave de finanzas personales y presupuestos.",
        },
      ],
      cuestionarios: [
        {
          title: "Canvas model challenge",
          url: "https://www.educaplay.com/recursos-educativos/13289235-plan_de_negocios.html",
          type: "Quiz interactivo",
        },
        {
          title: "Presupuesto y flujo de caja",
          url: "https://www.liveworksheets.com/worksheets/es/Emprendimiento/Presupuesto/Presupuesto_empresarial_jp2143954gz",
          type: "Práctica guiada",
        },
        {
          title: "Pensamiento creativo",
          url: "https://www.educaplay.com/recursos-educativos/13289257-design_thinking.html",
          type: "Evaluación",
        },
      ],
    },
    temas: [
      {
        titulo: "Modelado de ideas de negocio",
        subtitulos: [
          "Propuesta de valor",
          "Segmentos de clientes",
          "Canales y relaciones",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [
            { reference: "lecturas", index: 0 },
            { reference: "lecturas", index: 1 },
          ],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Lienzo Canvas",
            descripcion:
              "Completa un lienzo Canvas para una idea de negocio local e identifica indicadores clave.",
          },
          {
            tipo: "Pitch elevator",
            descripcion:
              "Graba una presentación de un minuto explicando tu propuesta de valor.",
          },
        ],
        retroalimentacion:
          "Refina tu lienzo con base en los ejemplos del manual y los comentarios recibidos.",
      },
      {
        titulo: "Gestión financiera básica",
        subtitulos: [
          "Costos fijos y variables",
          "Presupuesto y flujo de caja",
          "Punto de equilibrio",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Plan financiero",
            descripcion:
              "Construye un presupuesto mensual para tu proyecto identificando costos y fuentes de ingreso.",
          },
          {
            tipo: "Análisis de punto de equilibrio",
            descripcion:
              "Calcula cuántas unidades debes vender para cubrir tus costos utilizando hojas de cálculo.",
          },
        ],
        retroalimentacion:
          "Ajusta tu presupuesto según las recomendaciones de la guía financiera.",
      },
      {
        titulo: "Innovación y pensamiento creativo",
        subtitulos: [
          "Design thinking",
          "Prototipos rápidos",
          "Validación con usuarios",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Mapa de empatía",
            descripcion:
              "Entrevista a potenciales usuarios y construye un mapa de empatía para identificar necesidades reales.",
          },
          {
            tipo: "Prototipo mínimo",
            descripcion:
              "Desarrolla un prototipo simple de tu solución y recopila retroalimentación para iterar.",
          },
        ],
        retroalimentacion:
          "Integra los hallazgos de usuarios en tu propuesta y documenta los cambios realizados.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Plan de negocio",
        descripcion:
          "Integra en un dossier tu modelo Canvas, presupuesto y plan de acción trimestral.",
      },
      {
        tipo: "Bitácora de validación",
        descripcion:
          "Registra entrevistas y aprendizajes con usuarios para mejorar tu propuesta de valor.",
      },
    ],
    retroalimentacionGeneral:
      "Itera constantemente tu idea considerando datos financieros y comentarios de usuarios.",
  },
  "tecnologias-aprendizaje": {
    aliases: ["Tecnologías del Aprendizaje y la Comunicación"],
    sourceUrl: "https://www.mineduc.gob.gt/curriculonacionalbasico/",
    descripcion:
      "Recursos para fortalecer la ciudadanía digital, la seguridad informática y la producción multimedia colaborativa.",
    resources: {
      videos: [
        {
          title: "Alfabetización digital y ciudadanía",
          url: "https://www.youtube.com/watch?v=DFKShYPWqsI",
          duration: "08:30",
          source: "Common Sense Education",
        },
        {
          title: "Seguridad digital y contraseñas",
          url: "https://www.youtube.com/watch?v=xsVXFDl1C5A",
          duration: "07:12",
          source: "INCIBE",
        },
        {
          title: "Introducción a la creación multimedia",
          url: "https://www.youtube.com/watch?v=gV8I3y1cYtA",
          duration: "09:05",
          source: "Canal iCuadernos",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Tecnologías del Aprendizaje",
          url: "https://www.mineduc.gob.gt/curriculonacionalbasico/documents/cnb/basico/10_Tecnologias_del_Aprendizaje_y_la_Comunicacion.pdf",
          description:
            "Documento curricular con competencias digitales y criterios de evaluación.",
        },
        {
          title: "Guía de seguridad digital para adolescentes",
          url: "https://www.unicef.org/guatemala/media/9831/file/Gu%C3%ADa%20de%20Seguridad%20Digital%20para%20Adolescentes.pdf",
          description: "Consejos prácticos sobre privacidad, redes sociales y bienestar digital.",
        },
        {
          title: "Herramientas para el aprendizaje a distancia",
          url: "https://edu.google.com/intl/es-419/for-education/distance-learning/tips-tools/",
          description: "Ideas y recursos de Google for Education para proyectos y colaboración en línea.",
        },
      ],
      cuestionarios: [
        {
          title: "Ciudadanía digital responsable",
          url: "https://www.educaplay.com/recursos-educativos/13289293-seguridad_digital.html",
          type: "Quiz interactivo",
        },
        {
          title: "Contraseñas seguras",
          url: "https://www.liveworksheets.com/worksheets/es/Tecnolog%C3%ADa_de_la_informaci%C3%B3n_y_comunicaci%C3%B3n/Seguridad_inform%C3%A1tica/Contrase%C3%B1as_seguras_yw1796478xg",
          type: "Práctica guiada",
        },
        {
          title: "Proyecto multimedia",
          url: "https://www.educaplay.com/recursos-educativos/13289305-herramientas_digitales.html",
          type: "Evaluación",
        },
      ],
    },
    temas: [
      {
        titulo: "Ciudadanía digital y huella en línea",
        subtitulos: [
          "Identidad digital",
          "Comunicación responsable",
          "Ética y legalidad en la red",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 0 }],
          lecturas: [
            { reference: "lecturas", index: 0 },
            { reference: "lecturas", index: 1 },
          ],
          cuestionarios: [{ reference: "cuestionarios", index: 0 }],
        },
        actividades: [
          {
            tipo: "Código de convivencia digital",
            descripcion:
              "Redacta un acuerdo de buenas prácticas digitales para tu aula virtual y compártelo con tus compañeros.",
          },
          {
            tipo: "Reflexión guiada",
            descripcion:
              "Analiza un caso real sobre uso inadecuado de redes y propone soluciones responsables.",
          },
        ],
        retroalimentacion:
          "Contrasta tus acuerdos con las recomendaciones de UNICEF y actualiza tu plan personal de ciudadanía digital.",
      },
      {
        titulo: "Seguridad informática básica",
        subtitulos: [
          "Gestión de contraseñas",
          "Prevención de riesgos",
          "Cuidado de datos personales",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 1 }],
          lecturas: [{ reference: "lecturas", index: 1 }],
          cuestionarios: [{ reference: "cuestionarios", index: 1 }],
        },
        actividades: [
          {
            tipo: "Checklist de seguridad",
            descripcion:
              "Audita tus dispositivos aplicando la lista de verificación de seguridad digital y documenta hallazgos.",
          },
          {
            tipo: "Taller de contraseñas",
            descripcion:
              "Utiliza un generador seguro para crear contraseñas robustas y compártelas mediante un gestor confiable.",
          },
        ],
        retroalimentacion:
          "Repite la actividad interactiva hasta dominar las buenas prácticas de seguridad.",
      },
      {
        titulo: "Creación de proyectos multimedia colaborativos",
        subtitulos: [
          "Planeación de contenidos",
          "Herramientas de edición",
          "Publicación y retroalimentación",
        ],
        recursos: {
          videos: [{ reference: "videos", index: 2 }],
          lecturas: [{ reference: "lecturas", index: 2 }],
          cuestionarios: [{ reference: "cuestionarios", index: 2 }],
        },
        actividades: [
          {
            tipo: "Storyboard digital",
            descripcion:
              "Diseña un storyboard para un video educativo utilizando herramientas colaborativas en línea.",
          },
          {
            tipo: "Publicación responsable",
            descripcion:
              "Comparte tu proyecto multimedia e integra retroalimentación de tus compañeros respetando licencias y créditos.",
          },
        ],
        retroalimentacion:
          "Evalúa tu producto con la rúbrica del CNB y registra mejoras para la siguiente iteración.",
      },
    ],
    actividadesGenerales: [
      {
        tipo: "Bitácora digital",
        descripcion:
          "Documenta semanalmente las herramientas que utilizas, su propósito y las buenas prácticas aplicadas.",
      },
      {
        tipo: "Proyecto colaborativo",
        descripcion:
          "Coordina con tus compañeros la creación de un recurso educativo multimedia utilizando plataformas en la nube.",
      },
    ],
    retroalimentacionGeneral:
      "Evalúa continuamente tu huella digital y ajusta tus hábitos tecnológicos para aprender de forma segura.",
  },
};

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

const materializeReferences = (areaData) => {
  if (!areaData) return null;
  const base = cloneDeep(areaData);

  const resolveList = (list) => {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        if (item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "reference")) {
          const collection = base.resources?.[item.reference];
          const found = Array.isArray(collection) ? collection[item.index ?? 0] : null;
          return found ? cloneDeep(found) : null;
        }
        return item;
      })
      .filter(Boolean);
  };

  let topics = [];
  if (Array.isArray(base.temas)) {
    topics = base.temas.map((topic) => {
      const copy = { ...topic };
      if (topic.recursos) {
        copy.recursos = {
          videos: resolveList(topic.recursos.videos),
          lecturas: resolveList(topic.recursos.lecturas),
          cuestionarios: resolveList(topic.recursos.cuestionarios),
        };
      }
      return copy;
    });
  }

  return {
    ...base,
    recursos: base.resources,
    temas,
  };
};

const curatedEntries = Object.entries(CURATED_DATA).map(([key, value]) => {
  const materialized = materializeReferences(value);
  return [
    key,
    {
      ...value,
      temas: materialized?.temas || [],
      recursos: materialized?.recursos || value.resources,
    },
  ];
});

const CURATED_CONTENT = new Map(curatedEntries);

const curatedByName = (() => {
  const map = new Map();
  for (const [key, value] of CURATED_CONTENT.entries()) {
    map.set(normalizeKey(key), value);
    for (const alias of value.aliases || []) {
      map.set(normalizeKey(alias), value);
    }
  }
  return map;
})();

export const getCuratedContentForArea = (area) => {
  if (!area) return null;
  const slug = typeof area === "string" ? area : area?.slug;
  const nombre = typeof area === "string" ? area : area?.nombre || area?.titulo;

  if (slug) {
    const found = curatedByName.get(normalizeKey(slug));
    if (found) return materializeReferences(found);
  }

  if (nombre) {
    const found = curatedByName.get(normalizeKey(nombre));
    if (found) return materializeReferences(found);
  }

  return null;
};

export default CURATED_CONTENT;
