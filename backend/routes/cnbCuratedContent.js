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
    sourceUrl: "https://cnbguatemala.org/wiki/CNB_Ciclo_B%C3%A1sico/Comunicaci%C3%B3n_y_Lenguaje_Idioma_Espa%C3%B1ol",
    descripcion:
      "Recursos y actividades para fortalecer la comprensión lectora, la producción escrita y la ortografía según el CNB.",
    resources: {
      videos: [
        {
          title: "Cómo identificar el TEMA CENTRAL, IDEA PRINCIPAL Y SECUNDARIAS de un texto",
          url: "https://youtu.be/_g7Wjnm4PEE?si=jcX2AdOC5xsSYx-X",
          duration: "03:28",
          source: "Profe Paolo Astorga",
        },
        {
          title: "Cómo redactar un TEXTO ARGUMENTATIVO de manera fácil ",
          url: "https://youtu.be/IS3yTxP6EEk?si=x0r99slg3zA-I8k4",
          duration: "05:26",
          source: "Profe Paolo Astorga",
        },
        {
          title: "Signos de puntuación: uso correcto",
          url: "https://youtu.be/2Bs6tknaLJQ?si=lT43d4ZkVqPjUded",
          duration: "06:27",
          source: "Clases particulares en avila",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Comunicación y Lenguaje",
          url: "https://digecur.mineduc.gob.gt/wp-content/uploads/2025/01/CNB-Comunicacion-y-Lenguaje-IDIOMA-ESPANOL-Ciclo-Basico-2-1.pdf",
          description:
            "Documento oficial del Currículo Nacional Base para el área de Comunicación y Lenguaje en ciclo básico.",
        },
        {
          title: "Estrategias de comprensión lectora",
          url: "https://acceso.mineduc.cl/wp-content/uploads/2021/06/Cuadernillo-Comprension-Lectora-adm2021.pdf",
          description: "Guía descargable con técnicas para desarrollar la comprensión lectora.",
        },
        {
          title: "Guía para producir textos argumentativos",
          url: "https://leo.uniandes.edu.co/guia-para-la-elaboracion-de-textos-argumentativos/",
          description: "Orientaciones y ejemplos para planificar y redactar argumentos sólidos.",
        },
      ],
      cuestionarios: [
        {
          title: "Comprensión lectora de textos narrativos",
          url: "https://www.pedrodevaldivia-temuco.cl/wp-content/uploads/2020/04/4%C2%B0-Lenguaje-Textos-Narrativos.pdf",
          type: "Comprensión lectora",
        },
        {
          title: "Textos argumentativos: evaluación interactiva",
          url: "https://es.educaplay.com/recursos-educativos/2375070-texto_argumentativo.html",
          type: "Evaluación",
        },
        {
          title: "Uso de signos de puntuación",
          url: "https://aprenderespanol.org/gramatica/ortografia-signos-puntuacion.html",
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
          title: "Present simple",
          url: "https://youtu.be/nvVdIJ0las0?si=Ip3-Z5IUR2Sn7a2I",
          duration: "04:49",
          source: "ELLI",
        },
        {
          title: "How to improve your reading skills",
          url: "https://youtu.be/KLKZdMo7cLE?si=K3gm2hc4RdhdreRN",
          duration: "01:55",
          source: "british",
        },
        {
          title: "Understand FAST English",
          url: "https://youtu.be/mxDA_WjsRt0?si=EihqhTvKu-7kCSPS",
          duration: "05:55",
          source: "English with Lucy",
        },
      ],
      lecturas: [
        {
          title: "School exchange · Reading",
          url: "https://sites.reading.ac.uk/t-and-l-exchange/",
          description: "explicacion ",
        },
        {
          title: "Present simple · Grammar reference",
          url: "https://learnenglish.britishcouncil.org/grammar/english-grammar-reference/present-simple",
          description: "Explicación completa con ejemplos.",
        },
        {
          title: "Listening: understanding the news",
          url: "https://breakingnewsenglish.com/",
          description: "Actividad con audio, transcript y ejercicios autocorregibles.",
        },
      ],
      cuestionarios: [
        {
          title: "Reading comprehension quiz: School exchange",
          url: "https://learnenglishteens.britishcouncil.org/skills/reading/b1-reading/foreign-exchange-emails",
          type: "Reading quiz",
        },
        {
          title: "Present simple interactive practice",
          url: "https://www.gamestolearnenglish.com/present-simple/",
          type: "Grammar practice",
        },
        {
          title: "Listening quiz: travel announcements",
          url: "https://learnenglish.britishcouncil.org/skills/listening/a2-listening/transport-announcements",
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
    sourceUrl: "https://digecur.mineduc.gob.gt/wp-content/uploads/2025/01/CNB-Matematica-Ciclo-Basico-1.pdf",
    descripcion:
      "Colección de recursos para conectar el álgebra, la proporcionalidad y la geometría con situaciones reales.",
    resources: {
      videos: [
        {
          title: "Introducción a las expresiones algebraicas",
          url: "https://youtu.be/F32kPpq7YHc?si=R4qMd_cyklOhrhnF",
          duration: "06:01",
          source: "Prof agramonte",
        },
        {
          title: "Razones y proporciones",
          url: "https://youtu.be/3eYwW4sDlxM?si=JCCIr1s-hjYkv2al",
          duration: "04:56",
          source: "Daniel carreon",
        },
        {
          title: "Teorema de Pitágoras explicado",
          url: "https://youtu.be/eTEBvBIz8Ok?si=O3K8gXnK73DNb__7",
          duration: "08:50",
          source: "Daniel carreon",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Matemática",
          url: "https://cnbguatemala.org/wiki/Bachillerato_en_Ciencias_y_Letras_con_Orientaci%C3%B3n_en_Computaci%C3%B3n/%C3%81rea_de_Matem%C3%A1ticas",
          description:
            "Competencias y contenidos oficiales del área de Matemática para ciclo básico.",
        },
        {
          title: "Expresiones algebraicas: guía práctica",
          url: "https://es.scribd.com/document/524866739/1-GA-Expresiones-Algebraicas",
          description: "Explicación paso a paso.",
        },
        {
          title: "Aplicaciones del teorema de Pitágoras",
          url: "https://www.superprof.es/apuntes/escolar/matematicas/geometria/basica/teorema-de-pitagoras.html",
          description: "pagina interactiva con demostraciones y ejercicios dinámicos en GeoGebra.",
        },
      ],
      cuestionarios: [
        {
          title: "Práctica de expresiones algebraicas",
          url: "https://www.matematicasonline.es/pdf/ejercicios/3_ESO/Ejercicios%20de%20expresiones%20algebraicas.pdf",
          type: "Ejercicios interactivos",
        },
        {
          title: "Razones y proporciones",
          url: "https://gc.scalahed.com/recursos/files/r161r/w24670w/1%20razones%20proporciones.pdf",
          type: "Evaluación paso a paso ",
        },
        {
          title: "Teorema de Pitágoras: práctica",
          url: "https://es.khanacademy.org/math/geometry/hs-geo-trig/hs-geo-pyth-theorem/e/pythagorean-theorem-word-problems",
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
          url: "https://youtu.be/tdY1HaWbYQY?si=7EzPPttfOZtNCEr9",
          duration: "16:58",
          source: "arriba la ciencia",
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
          url: "https://digecur.mineduc.gob.gt/wp-content/uploads/2025/01/CNB-Ciencias-Naturales-Ciclo-Basico.pdf",
          description:
            "Referente curricular oficial con competencias, contenidos y sugerencias metodológicas.",
        },
        {
          title: "Qué es un ecosistema",
          url: "https://www.biodiversidad.gob.mx/ecosistemas/quees",
          description: "Artículo con imágenes y ejemplos de ecosistemas terrestres y acuáticos.",
        },
        {
          title: "La célula para estudiantes de básicos",
          url: "https://medlineplus.gov/spanish/genetica/entender/basica/celula/",
          description: "Explicación detallada de la célula con infografías y actividades propuestas.",
        },
      ],
      cuestionarios: [
        {
          title: "La célula: autoevaluación",
          url: "https://www.biologia.edu.ar/cel_euca/autoevaluacion/evacel2.htm",
          type: "Evaluación",
        },
        {
          title: "Ecosistemas y biomas",
          url: "https://es.khanacademy.org/science/ap-college-environmental-science/x0b0e430a38ebd23f:the-living-world-ecosystems-and-biodiversity/x0b0e430a38ebd23f:ecosystems-and-biomes/e/ecosystems-and-biomes",
          type: "Práctica",
        },
        {
          title: "La energía y sus transformaciones",
          url: "https://wordwall.net/resource/19327486/la-energ%C3%ACa-y-sus-transformaciones",
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
    sourceUrl: "https://cnbguatemala.org/wiki/CNB_Ciclo_B%C3%A1sico/Ciencias_Sociales,_Formaci%C3%B3n_Ciudadana_e_Interculturalidad",
    descripcion:
      "Recursos para analizar la historia nacional, fortalecer la cultura democrática y valorar la diversidad guatemalteca.",
    resources: {
      videos: [
        {
          title: "Historia de Guatemala: de la colonia a la independencia",
          url: "https://youtu.be/hwd-8IWV3uU?si=d53xdfRzEMrr40Ea",
          duration: "03:56",
          source: "Seño lis",
        },
        {
          title: "Participación ciudadana y democracia",
          url: "https://youtu.be/HZmu92lM9f0?si=8YzRjRHmwGWj0xrg",
          duration: "03:12",
          source: "Canal encuentro",
        },
        {
          title: "Diversidad cultural en Guatemala",
          url: "https://youtu.be/psiqKh_uoPY?si=iNCQ9aISwsDqXcQc",
          duration: "07:05",
          source: "Lourdes lepe",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Ciencias Sociales",
          url: "https://digecur.mineduc.gob.gt/wp-content/uploads/2025/01/CNB-Ciencias-Sociales-Ciclo-Basico-1.pdf",
          description:
            "Marco curricular que orienta contenidos de historia, ciudadanía e interculturalidad.",
        },
        {
          title: "Historia general de Guatemala",
          url: "hatgpt.com/c/689c1149-45c0-8324-8336-55716ca88e03",
          description: "Libro de la historia de guatemala",
        },
        {
          title: "Ciudadanía activa y derechos humanos",
          url: "https://www.coe.int/es/web/compass/citizenship-and-participation",
          description: "manual de educacion de los derechos humanos",
        },
      ],
      cuestionarios: [
        {
          title: "Independencia de Centroamérica",
          url: "https://wordwall.net/es/resource/69583431/independencia-en-centroam%c3%a9rica",
          type: "Evaluación",
        },
        {
          title: "Derechos y deberes ciudadanos",
          url: "https://wordwall.net/es-cl/community/deberes-y-derechos-como-ciudadanos",
          type: "juegos",
        },
        {
          title: "Diversidad cultural guatemalteca",
          url: "https://wayground.com/admin/quiz/61f57028078150001d85c0fb/la-diversidad-cultural-en-guatemala",
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
    sourceUrl: "https://cnbguatemala.org/wiki/CNB_Ciclo_B%C3%A1sico/Culturas_e_Idiomas_Maya,_Gar%C3%ADfuna_o_Xinca",
    descripcion:
      "Recursos que visibilizan la diversidad lingüística y cultural de Guatemala y promueven el respeto intercultural.",
    resources: {
      videos: [
        {
          title: "Los ciclos en la cosmovisión maya",
          url: "https://youtu.be/8Zwgux0nGXk?si=RP0BUWHI07s4IQUq",
          duration: "2:34",
          source: "Hunub ku",
        },
        {
          title: "Palabras En La Lengua Del Pueblo Garífuna",
          url: "https://youtu.be/EgO2GyjZ_nI?si=PGe7NcW6Orv6Wp7v",
          duration: "03:03",
          source: "Eli laBan",
        },
        {
          title: "¡Aprendamos EL IDIOMA XINKA - Vocabulario de La Familia!",
          url: "https://youtu.be/EOuswZQHPOQ?si=ROYX5-JmnKVkQobV",
          duration: "01:11",
          source: "Maestro innovando idiomas",
        },
      ],
      lecturas: [
        {
          title: "Cosmovisión maya",
          url: "https://gomundomaya.com/cosmovision/",
          description: "Definciond e la cosmovision maya.",
        },
        {
          title: "idioma garífuna",
          url: "https://es.scribd.com/document/159227084/Idioma-de-Los-Garifunas",
          description: "El documento describe el idioma Garífuna.",
        },
        {
          title: "Pueblos originarios de Guatemala",
          url: "https://aprende.guatemala.com/cultura-guatemalteca/etnias/pueblos-originarios-de-guatemala/",
          description: "aprende sobre los pueblos originarios de guatemala.",
        },
      ],
      cuestionarios: [
        {
          title: "Cultura maya: símbolos y significados",
          url: "https://wayground.com/admin/quiz/672cf4dad66a7860abaa8737/simbolismo-en-la-cultura-maya",
          type: "Quiz interactivo",
        },
        {
          title: "Lengua garífuna: vocabulario básico",
          url: "https://es.scribd.com/document/376288795/Vocabulario-Garifuna-Arina",
          type: "Práctica guiada",
        },
        {
          title: "Pueblos xinka y garífuna",
          url: "https://es.scribd.com/document/749599129/CEEX-2-Etapa-evaluacion-Cultura-e-Idioma-Maya-Garifuna-o-Xinka-Formularios-de-Google",
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
    sourceUrl: "https://digecur.mineduc.gob.gt/wp-content/uploads/2025/01/CNB-Educacion-Artistica-Ciclo-basico-1.pdf",
    descripcion:
      "Recursos audiovisuales y guías para integrar artes visuales, música y teatro en proyectos expresivos.",
    resources: {
      videos: [
        {
          title: "Los elementos del arte",
          url: "https://youtu.be/5ydd0WRSLjs?si=j70EQNrAqATJ6t8j",
          duration: "12:11",
          source: "Art with Ms.mann",
        },
        {
          title: "apreciación musical efectiva",
          url: "https://youtu.be/r0sBhkeUYf4?si=q77jBW7OEWfQDbCH",
          duration: "05:29",
          source: "educarchile",
        },
        {
          title: "¿Qué es el TEATRO y cuáles son sus elementos? Características y tipos",
          url: "https://youtu.be/OdzNr0pzoC0?si=HXpcNejP5KodGAb1",
          duration: "07:19",
          source: "astraway",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Educación Artística",
          url: "https://cnbguatemala.org/wiki/CNB_Ciclo_B%C3%A1sico/Educaci%C3%B3n_Art%C3%ADstica",
          description:
            "Orientaciones curriculares para artes visuales, música, danza y teatro.",
        },
        {
          title: "Elementos del arte visual",
          url: "https://es.slideshare.net/slideshow/elementos-del-arte-visual/2381007#2",
          description: "presentacion de los elementos del arte.",
        },
        {
          title: "Guía de apreciación musical",
          url: "https://eduardolozowsky.com/apreciacion-musical-lozowsky/",
          description: "Documento con conceptos básicos de ritmo, melodía y armonía.",
        },
      ],
      cuestionarios: [
        {
          title: "Elementos del arte",
          url: "https://quizlet.com/pr/422324472/elementos-del-arte-flash-cards/",
          type: "Quiz interactivo",
        },
        {
          title: "Instrumentos y familias",
          url: "https://teachy.ai/es/plan-de-leccion/contenido/familias-de-instrumentos-musicales",
          type: "Práctica guiada",
        },
        {
          title: "Técnicas teatrales básicas",
          url: "https://www.epnewman.edu.pe/revista/ciencias-sociales/tecnicas-teatrales/",
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
    sourceUrl: "https://www.munideporte.com/imagenes/documentacion/ficheros/20101124173147anexo_plan_csd.pdf",
    descripcion:
      "Recursos para planificar sesiones activas, seguras y saludables que fortalezcan la condición física integral.",
    resources: {
      videos: [
        {
          title: "Rutina de calentamiento general",
          url: "https://youtu.be/MPzfQMxrjdQ?si=IFirXJYUI53DhGF1",
          duration: "05:34",
          source: "viviendo fit",
        },
        {
          title: "Circuito de fuerza y resistencia",
          url: "https://youtu.be/NeQ61BhNO60?si=uoHSL69ouI9svLWo",
          duration: "11:43",
          source: "Deportesuncomo",
        },
        {
          title: "Estiramientos y flexibilidad",
          url: "https://youtu.be/xNXcOU8lM2s?si=uAsI2eTYGNRDp5FR",
          duration: "16:16",
          source: "gym virtual",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Educación Física",
          url: "https://digecur.mineduc.gob.gt/wp-content/uploads/2025/01/CNB-Educacion-Fisica-Ciclo-Basico-1.pdf",
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
          url: "https://www.stanfordchildrens.org/es/topic/default?id=exercise-and-teenagers-90-P04702",
          description: "Pagina para el ejercicio para los jovenes",
        },
      ],
      cuestionarios: [
        {
          title: "Capacidades físicas básicas",
          url: "https://es.educaplay.com/recursos-educativos/3786541-capacidades_fisicas_basicas.html",
          type: "Quiz interactivo",
        },
        {
          title: "Planificación de calentamiento",
          url: "https://es.scribd.com/document/669038129/PROGRAMA-DE-CALENTAMIENTO",
          type: "Práctica guiada",
        },
        {
          title: "Hábitos saludables",
          url: "https://colegiolainmaculada.com/downloads/5p-test-de-habitos-saludables.pdf",
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
    sourceUrl: "https://digecur.mineduc.gob.gt/wp-content/uploads/2025/01/CNB-Emprendimiento-para-la-Productividad-Ciclo-Basico-2.pdf",
    descripcion:
      "Recursos para impulsar iniciativas emprendedoras con enfoque en modelo de negocio, finanzas e innovación.",
    resources: {
      videos: [
        {
          title: "Cómo utilizar el modelo Canvas",
          url: "https://youtu.be/i1Le5GYkBT8?si=m0NR27ioswtItm-h",
          duration: "09:36",
          source: "trabajar desde casa",
        },
        {
          title: "Educación financiera para emprendedores",
          url: "https://youtu.be/29iU2NA0rDQ?si=VR4KuS_8m_95eOyY",
          duration: "11:55",
          source: "better wallet en español",
        },
        {
          title: "Introducción al design thinking",
          url: "https://youtu.be/LeoEnRjAYM0?si=8aqp6VcTaxNrSCKt",
          duration: "08:34",
          source: "IEBS BUSINESS SCHOOL",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Emprendimiento para la Productividad",
          url: "https://cnbguatemala.org/wiki/CNB_Ciclo_B%C3%A1sico/Emprendimiento_para_la_Productividad",
          description:
            "Marco curricular con competencias de emprendimiento e innovación para ciclo básico.",
        },
        {
          title: "Manual para emprendedores",
          url: "https://www.jica.go.jp/Resource/paraguay/espanol/office/others/c8h0vm0000ad5gke-att/info_11_01.pdf",
          description: "Guía del Banco Mundial con herramientas para desarrollar ideas de negocio.",
        },
        {
          title: "Guía práctica de educación financiera",
          url: "https://www.enif.gt/wp-content/uploads/2025/02/Guia-del-docente-Programa-de-educacion-financiera-BR-003.pdf",
          description: "Documento con conceptos clave de finanzas personales y presupuestos.",
        },
      ],
      cuestionarios: [
        {
          title: "Canvas model challenge",
          url: "https://es.educaplay.com/recursos-educativos/17882969-quiz_del_modelo_canvas.html",
          type: "Quiz interactivo",
        },
        {
          title: "Presupuesto y flujo de caja",
          url: "https://www.studocu.com/es-mx/document/universidad-del-desarrollo-profesional/plan-de-negocios/ejemplos-de-ejercicios-de-flujo-de-efectivo-explicados-modelo-ejercicio-de-presupuesto-de-caja/35026736",
          type: "Práctica guiada",
        },
        {
          title: "Pensamiento creativo",
          url: "https://es.educaplay.com/recursos-educativos/4007717-pensamiento_creativo.html",
          type: "quizz",
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
    sourceUrl: "https://digecur.mineduc.gob.gt/wp-content/uploads/2025/01/CNB-Tecnologias-del-Aprendizaje-y-la-Comunicacion-Ciclo-Basico-1.pdf",
    descripcion:
      "Recursos para fortalecer la ciudadanía digital, la seguridad informática y la producción multimedia colaborativa.",
    resources: {
      videos: [
        {
          title: "Alfabetización digital y ciudadanía digital",
          url: "https://youtu.be/KIETTvojFW4?si=796WAzDg6_bxF90A",
          duration: "03:04",
          source: "leo condori",
        },
        {
          title: "Ciberseguridad: Contraseñas seguras",
          url: "https://youtu.be/boQKl5BkPfs?si=CYDnNWUgISB51ngp",
          duration: "02:36",
          source: "AltumX Studios",
        },
        {
          title: "Introducción a la creación multimedia",
          url: "https://youtu.be/UQjrPTrQDT8?si=vSwT6HZHEPauXBJx",
          duration: "07:52",
          source: "youtube",
        },
      ],
      lecturas: [
        {
          title: "CNB Guatemala · Tecnologías del Aprendizaje",
          url: "https://cnbguatemala.org/wiki/CNB_Ciclo_B%C3%A1sico/Tecnolog%C3%ADas_del_Aprendizaje_y_la_Comunicaci%C3%B3n",
          description:
            "Documento curricular con competencias digitales y criterios de evaluación.",
        },
        {
          title: "Guía de seguridad digital para adolescentes",
          url: "https://edu.mineduc.gob.gt/documents/recursos/Miniguia-seguridad-Guatemala.pdf",
          description: "Consejos prácticos sobre privacidad, redes sociales y bienestar digital.",
        },
        {
          title: "Herramientas para el aprendizaje a distancia",
          url: "https://studyatgenuine.com/blog/herramientas-digitales-educativas/",
          description: "descripcion de las herramientas digitales.",
        },
      ],
      cuestionarios: [
        {
          title: "Ciudadanía digital responsable",
          url: "https://www.educaplay.com/learning-resources/18626120-ciudadania_digital.html",
          type: "Quiz interactivo",
        },
        {
          title: "Contraseñas seguras",
          url: "https://es.scribd.com/document/481103143/BUENAS-PRACTICAS-PARA-CREAR-CONTRASENAS-GUIA-2",
          type: "Práctica guiada",
        },
        {
          title: "Proyecto multimedia",
          url: "https://wayground.com/admin/quiz/67f7d2feefda5d231fdf4421/creacion-de-proyectos-multimedia",
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
    temas: topics,
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