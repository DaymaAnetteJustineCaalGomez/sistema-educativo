// frontend/src/dashboard/TeacherDashboard.jsx
import React, { useCallback, useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader.jsx';
import { getFirstName } from '../utils/user.js';

function escapePdfText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function approximateTextWidth(text, fontSize) {
  const averageCharWidth = fontSize * 0.55;
  return text.length * averageCharWidth;
}

function wrapTextInColumn(value, fontSize, maxWidth) {
  if (value === null || value === undefined) return ['—'];
  const stringValue = String(value);
  if (stringValue.trim() === '') return ['—'];
  if (stringValue === '—') return ['—'];

  const words = stringValue.split(/\s+/).filter(Boolean);
  const lines = [];

  const pushLine = (line) => {
    if (line && line.trim()) {
      lines.push(line.trim());
    }
  };

  let currentLine = '';
  const maxAllowedWidth = Math.max(maxWidth, fontSize * 1.5);

  words.forEach((word) => {
    const wordWidth = approximateTextWidth(word, fontSize);
    if (wordWidth > maxAllowedWidth) {
      if (currentLine) {
        pushLine(currentLine);
        currentLine = '';
      }

      let segment = '';
      for (const char of word) {
        const nextSegment = segment + char;
        if (approximateTextWidth(nextSegment, fontSize) > maxAllowedWidth && segment) {
          pushLine(segment);
          segment = char;
        } else {
          segment = nextSegment;
        }
      }
      currentLine = segment;
      return;
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (approximateTextWidth(candidate, fontSize) <= maxAllowedWidth) {
      currentLine = candidate;
    } else {
      pushLine(currentLine);
      currentLine = word;
    }
  });

  pushLine(currentLine);

  if (!lines.length) {
    return ['—'];
  }

  return lines;
}

function buildTeacherReportPdf({ teacherName, history }) {
  const title = 'Informe estudiantil';
  const subtitle = 'Currículo Nacional Base · Guatemala';
  const systemName = 'Sistema Educativo';
  const generatedFor = `Docente: ${teacherName}`;
  const timestamp = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());
  const generatedOn = `Generado el: ${timestamp}`;
  const systemStamp = `Emitido por: ${systemName}`;
  const pageWidth = 842; // A4 landscape
  const pageHeight = 595;
  const marginX = 56;
  const marginBottom = 56;
  const headerHeight = 128;
  const bannerTop = pageHeight - headerHeight;
  const tableHeaderHeight = 58;
  const textBlocks = [];

  const tableLeft = marginX;
  const tableRight = pageWidth - marginX;
  const tableWidth = tableRight - tableLeft;

  const columns = [
    { label: 'Estudiante', accessor: 'name', weight: 2.55, fontSize: 15, color: '0.09 0.13 0.24', fontKey: 'F2' },
    { label: 'Promedio', accessor: 'average', weight: 1.1, fontSize: 14 },
    { label: 'Cobertura', accessor: 'coverage', weight: 1.05, fontSize: 14 },
    { label: 'Progreso', accessor: 'progress', weight: 1.05, fontSize: 14 },
    { label: 'Completados', accessor: 'completions', weight: 1.1, fontSize: 14 },
    { label: 'Abandono', accessor: 'dropout', weight: 1.05, fontSize: 14 },
    { label: 'Foco débil', accessor: 'focus', weight: 1.55, fontSize: 14 },
    { label: 'Frecuencia', accessor: 'frequency', weight: 1.2, fontSize: 14 },
  ];

  const totalWeight = columns.reduce((sum, col) => sum + col.weight, 0);
  let runningX = tableLeft;
  columns.forEach((col, index) => {
    const isLast = index === columns.length - 1;
    const computedWidth = (tableWidth * col.weight) / totalWeight;
    const width = isLast ? tableRight - runningX : Math.max(computedWidth, 86);
    col.width = width;
    col.startX = runningX;
    col.textX = Math.round(runningX + 16);
    col.textMaxWidth = Math.max(width - 32, 40);
    runningX += col.width;
  });

  const addText = (text, x, y, size = 12, color = '0 0 0', fontKey = 'F1') => {
    textBlocks.push(`${color} rg`);
    textBlocks.push('0 Tr');
    textBlocks.push(`BT /${fontKey} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`);
    if (color !== '0 0 0') {
      textBlocks.push('0 0 0 rg');
    }
  };

  const drawRect = (x, y, width, height, fillColor) => {
    textBlocks.push(`${fillColor} rg`);
    textBlocks.push(`${x} ${y} ${width} ${height} re f`);
    textBlocks.push('0 0 0 rg');
  };

  const drawLine = (x1, y1, x2, y2, color = '0.2 0.32 0.49', width = 1) => {
    textBlocks.push(`${color} RG`);
    textBlocks.push(`${width} w`);
    textBlocks.push(`${x1} ${y1} m ${x2} ${y2} l S`);
    textBlocks.push('0 0 0 RG');
    textBlocks.push('1 w');
  };

  // Background and header banner
  drawRect(0, 0, pageWidth, pageHeight, '1 1 1');
  drawRect(0, bannerTop, pageWidth, headerHeight, '0.16 0.36 0.64');
  drawRect(0, bannerTop + headerHeight / 2, pageWidth, headerHeight / 2, '0.13 0.3 0.54');

  const bannerTitleY = bannerTop + headerHeight - 40;
  addText(systemName.toUpperCase(), marginX, bannerTitleY + 24, 20, '1 1 1', 'F2');
  addText(title, marginX, bannerTitleY, 34, '1 1 1', 'F2');
  addText(subtitle, marginX, bannerTitleY - 26, 17, '1 1 1');

  const metaStartY = bannerTop - 28;
  drawRect(tableLeft - 20, metaStartY - 70, tableWidth + 40, 88, '0.96 0.98 1');
  drawRect(tableLeft - 20, metaStartY - 70, 6, 88, '0.16 0.36 0.64');
  addText(generatedFor, tableLeft, metaStartY + 10, 16, '0.07 0.12 0.22', 'F2');
  addText(generatedOn, tableLeft, metaStartY - 14, 15, '0.14 0.21 0.35');
  addText(systemStamp, tableLeft, metaStartY - 38, 15, '0.14 0.21 0.35');

  const tableTop = metaStartY - 90;
  const tableBottom = marginBottom;
  const tableFrameLeft = tableLeft - 20;
  const tableFrameWidth = tableWidth + 40;

  drawRect(tableFrameLeft, tableBottom - 20, tableFrameWidth, tableTop - tableBottom + 64, '1 1 1');
  drawRect(tableFrameLeft, tableTop + 44, tableFrameWidth, 20, '0.87 0.92 0.98');
  drawRect(tableLeft, tableTop - tableHeaderHeight, tableWidth, tableHeaderHeight, '0.19 0.39 0.66');
  drawLine(tableLeft, tableTop, tableRight, tableTop, '0.13 0.3 0.54', 1.6);
  drawLine(tableLeft, tableTop - tableHeaderHeight, tableRight, tableTop - tableHeaderHeight, '0.13 0.3 0.54', 1.6);

  columns.forEach((col, index) => {
    if (index > 0) {
      drawLine(col.startX, tableBottom, col.startX, tableTop, '0.8 0.85 0.92', 1);
    }
    addText(col.label, col.textX, tableTop - 24, 17, '1 1 1', 'F2');
  });
  drawLine(tableRight, tableBottom, tableRight, tableTop, '0.8 0.85 0.92', 1);

  let rowTop = tableTop - tableHeaderHeight;
  const rowPaddingY = 14;
  const lineHeight = 18;

  history.forEach((row, rowIndex) => {
    const cellLayouts = columns.map((col) => {
      const value = row[col.accessor] ?? '—';
      const fontSize = col.fontSize || 14;
      const lines = wrapTextInColumn(value, fontSize, col.textMaxWidth);
      return {
        lines,
        fontKey: col.fontKey || 'F1',
        color: col.color || '0 0 0',
        fontSize,
      };
    });

    const maxLines = cellLayouts.reduce((max, cell) => Math.max(max, cell.lines.length), 1);
    const computedHeight = Math.max(rowPaddingY * 2 + maxLines * lineHeight, 48);
    const nextRowBottom = rowTop - computedHeight;

    if (nextRowBottom < tableBottom) {
      return;
    }

    const fillColor = rowIndex % 2 === 0 ? '0.96 0.98 1' : '1 1 1';
    drawRect(tableLeft, nextRowBottom, tableWidth, computedHeight, fillColor);

    columns.forEach((col, index) => {
      const cell = cellLayouts[index];
      let textY = rowTop - rowPaddingY - 2;
      cell.lines.forEach((line) => {
        addText(line, col.textX, textY, cell.fontSize, cell.color, cell.fontKey);
        textY -= lineHeight;
      });
    });

    drawLine(tableLeft, nextRowBottom, tableRight, nextRowBottom, '0.82 0.86 0.92', 1);
    rowTop = nextRowBottom;
  });

  drawLine(tableLeft, tableBottom, tableRight, tableBottom, '0.82 0.86 0.92', 1.2);

  addText('Datos de referencia para seguimiento pedagógico.', marginX, marginBottom - 28, 14, '0.14 0.21 0.35', 'F2');
  addText(
    'Generado automáticamente desde el panel docente del Sistema Educativo.',
    marginX,
    marginBottom - 50,
    12,
    '0.25 0.32 0.44',
  );

  const content = textBlocks.join('\n');
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);

  const objects = [];
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  objects.push(
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj`,
  );
  objects.push(
    `4 0 obj << /Length ${contentBytes.length} >> stream\n${content}\nendstream\nendobj`,
  );
  objects.push('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');
  objects.push('6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj');

  let pdf = '%PDF-1.4\n';
  const offsets = ['0000000000 65535 f \n'];
  objects.forEach((obj) => {
    const offset = pdf.length;
    offsets.push(String(offset).padStart(10, '0') + ' 00000 n \n');
    pdf += `${obj}\n`;
  });
  const xrefPosition = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  offsets.forEach((entry) => {
    pdf += entry;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefPosition}\n%%EOF`;

  return new Blob([encoder.encode(pdf)], { type: 'application/pdf' });
}

function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${Math.round(number)}%`;
}

function normalizeStudentRow(item, index) {
  return {
    id: item?.id || index,
    name: item?.nombre || item?.name || 'Estudiante sin nombre',
    average: formatPercent(item?.promedio ?? item?.average),
    coverage: formatPercent(item?.cobertura ?? item?.coverage),
    progress: formatPercent(item?.progreso ?? item?.progress),
    completions: item?.completados ?? item?.completed ?? '—',
    dropout: formatPercent(item?.abandono ?? item?.dropout),
    focus: item?.focoDebil || item?.weakSpot || '—',
    frequency: item?.frecuenciaUso || item?.usageFrequency || '—',
  };
}

const SAMPLE_STUDENTS = [
  {
    id: 'sample-1',
    name: 'Ejemplo: Ana López',
    average: formatPercent(92),
    coverage: formatPercent(86),
    progress: formatPercent(78),
    completions: 18,
    dropout: formatPercent(4),
    focus: 'Álgebra',
    frequency: 'Alta',
  },
  {
    id: 'sample-2',
    name: 'Ejemplo: Carlos Pérez',
    average: formatPercent(88),
    coverage: formatPercent(80),
    progress: formatPercent(72),
    completions: 15,
    dropout: formatPercent(6),
    focus: 'Comprensión lectora',
    frequency: 'Media',
  },
];

const SAMPLE_HISTORY = [
  {
    id: 'history-1',
    title: 'Entrega destacada',
    description: 'Ana López completó "Proyecto de fracciones" con calificación sobresaliente.',
    date: '12 de marzo',
  },
  {
    id: 'history-2',
    title: 'Seguimiento requerido',
    description: 'Carlos Pérez necesita repasar "Comprensión de lectura - Unidad 2".',
    date: '09 de marzo',
  },
  {
    id: 'history-3',
    title: 'Nueva recomendación enviada',
    description: 'Se asignó refuerzo de Álgebra para el grupo de Matemática.',
    date: '06 de marzo',
  },
];

function TeacherStudentHistory({ entries, sectionId }) {
  return (
    <section id={sectionId} className="teacher-section teacher-section--history">
      <header className="section-header">
        <div>
          <h2>Historial de estudiantes</h2>
          <p>Últimos eventos registrados por la clase.</p>
        </div>
      </header>
      {entries.length ? (
        <ul className="teacher-history__list">
          {entries.map((item) => (
            <li key={item.id}>
              <div className="teacher-history__date">{item.date}</div>
              <div className="teacher-history__content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="teacher-empty">Aún no hay eventos registrados.</p>
      )}
    </section>
  );
}

export default function TeacherDashboard({ user, onLogout }) {
  const report = user?.reporteEstudiantil || user?.studentReport || {};
  const focusAreas = useMemo(() => {
    const focos = user?.focosDebiles || user?.weakFocus || [];
    if (Array.isArray(focos) && focos.length) return focos;
    return ['Álgebra', 'Geometría', 'Comprensión lectora'];
  }, [user]);

  const history = useMemo(() => {
    const historial = user?.historialEstudiantes || user?.studentHistory || [];
    if (Array.isArray(historial) && historial.length) {
      return historial.map(normalizeStudentRow);
    }
    return SAMPLE_STUDENTS;
  }, [user]);

  const activityHistory = useMemo(() => {
    const events = user?.historialAprendizaje || user?.studentActivityHistory || [];
    if (Array.isArray(events) && events.length) {
      return events.map((item, index) => ({
        id: item.id || index,
        title: item?.titulo || item?.title || 'Evento',
        description: item?.descripcion || item?.description || 'Actualización registrada.',
        date: item?.fecha || item?.date || '',
      }));
    }
    return SAMPLE_HISTORY;
  }, [user]);

  const metrics = [
    {
      label: 'Promedio general',
      value: formatPercent(report?.promedioGeneral || report?.average),
      hint: 'Promedio consolidado de tu grupo.',
    },
    {
      label: 'Cobertura',
      value: formatPercent(report?.cobertura || report?.coverage),
      hint: 'Porcentaje de contenidos abordados.',
    },
    {
      label: 'Progreso activo',
      value: formatPercent(report?.progreso || report?.progress),
      hint: 'Avance promedio de los estudiantes.',
    },
    {
      label: 'Completados',
      value: report?.completados ?? report?.completed ?? '—',
      hint: 'Actividades finalizadas por la clase.',
    },
    {
      label: 'Abandono',
      value: formatPercent(report?.abandono || report?.dropout),
      hint: 'Porcentaje de actividades abandonadas.',
    },
  ];

  const frequency = useMemo(() => {
    const freq = user?.frecuenciaUso || user?.usageFrequency;
    if (!freq) {
      return [
        { label: 'Semanal', value: '4 sesiones' },
        { label: 'Diaria', value: '35 min promedio' },
      ];
    }
    if (Array.isArray(freq)) return freq;
    return Object.entries(freq).map(([label, value]) => ({ label, value }));
  }, [user]);

  const firstName = getFirstName(user);

  const handleDownloadReport = useCallback(() => {
    if (!history.length) return;
    try {
      const teacherName = user?.nombre || user?.name || firstName;
      const pdfBlob = buildTeacherReportPdf({ teacherName, history });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'informe-estudiantil.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('No se pudo generar el informe en PDF', err);
      window.alert('No se pudo generar el PDF. Intenta nuevamente.');
    }
  }, [history, firstName, user]);

  return (
    <div className="dashboard dashboard--teacher">
      <DashboardHeader user={user} onLogout={onLogout} badge="Docente" />

      <div className="dashboard-layout">
        <main className="dashboard-main">
          <section id="informe-estudiantil" className="teacher-section teacher-section--report">
            <header className="section-header">
              <div>
                <h2>Informe estudiantil</h2>
                <p>Promedios, coberturas, avances y focos de atención por estudiante.</p>
              </div>
              <span className="section-note">Datos ilustrativos mientras se sincroniza la información.</span>
            </header>
            <div className="teacher-table">
              <div className="teacher-table__head">
                <span>Estudiante</span>
                <span>Promedio</span>
                <span>Cobertura</span>
                <span>Progreso</span>
                <span>Completados</span>
                <span>Abandono</span>
                <span>Foco débil</span>
                <span>Frecuencia</span>
              </div>
              <div className="teacher-table__body">
                {history.map((row) => (
                  <div className="teacher-table__row" key={row.id}>
                    <span>{row.name}</span>
                    <span>{row.average}</span>
                    <span>{row.coverage}</span>
                    <span>{row.progress}</span>
                    <span>{row.completions}</span>
                    <span>{row.dropout}</span>
                    <span>{row.focus}</span>
                    <span>{row.frequency}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="metricas-docente" className="teacher-section teacher-section--metrics">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <div className="metric-card__label">{metric.label}</div>
                <div className="metric-card__value">{metric.value}</div>
                <p className="metric-card__hint">{metric.hint}</p>
              </article>
            ))}
          </section>

          <TeacherStudentHistory sectionId="historial-estudiantes" entries={activityHistory} />

          <section id="focos" className="teacher-section teacher-section--focus">
            <div className="teacher-focus">
              <h2>Focos débiles</h2>
              <p>Temas que requieren refuerzo adicional.</p>
              <ul>
                {focusAreas.map((focus) => (
                  <li key={focus}>{focus}</li>
                ))}
              </ul>
            </div>
            <div className="teacher-frequency">
              <h2>Frecuencia de uso</h2>
              <p>Seguimiento del tiempo de conexión y sesiones por periodo.</p>
              <ul>
                {frequency.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>

        <aside className="dashboard-aside">
          <section className="dashboard-hero-card dashboard-hero-card--teacher">
            <p className="dashboard-hero__eyebrow">Panel docente</p>
            <h1>Hola, {firstName}</h1>
            <p>
              Supervisa el aprendizaje de tus estudiantes, identifica focos débiles y descarga
              informes listos para compartir.
            </p>
            <button type="button" className="btn-primary" onClick={handleDownloadReport}>
              Descargar informe
            </button>
          </section>

          <nav className="dashboard-menu" aria-label="Navegación del tablero docente">
            <h2>Menú rápido</h2>
            <ul>
              <li><a href="#informe-estudiantil">Informe estudiantil</a></li>
              <li><a href="#metricas-docente">Indicadores</a></li>
              <li><a href="#historial-estudiantes">Historial</a></li>
              <li><a href="#focos">Focos y frecuencia</a></li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
