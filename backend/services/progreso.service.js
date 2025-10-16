import Intento from '../models/Intento.js';
import Progreso from '../models/ProgresoIndicador.js';

export async function recalcularProgresoUsuarioIndicador(usuarioId, indicadorId) {
  const intentos = await Intento.find({ usuarioId, indicadorId }).lean();
  if (!intentos.length) {
    await Progreso.findOneAndUpdate(
      { usuarioId, indicadorId },
      { estadoIndicador: 'pendiente', promedio: null, intentosTotales: 0, intentosAbandonados: 0, ultimoIntentoAt: null },
      { upsert: true }
    );
    return;
  }
  const tot = intentos.length;
  const aband = intentos.filter(i => i.estado === 'abandonado').length;
  const completados = intentos.filter(i => i.estado === 'completado');
  const promedio = completados.length
    ? Math.round(completados.reduce((a,b)=>a+(b.puntuacion||0),0)/completados.length)
    : null;
  const ultimoIntentoAt = intentos.map(i => i.updatedAt || i.createdAt).sort((a,b)=>b-a)[0];

  let estadoIndicador = 'pendiente';
  if (completados.length) estadoIndicador = 'completado';
  else if (tot > 0) estadoIndicador = 'en_progreso';

  await Progreso.findOneAndUpdate(
    { usuarioId, indicadorId },
    { estadoIndicador, promedio, intentosTotales: tot, intentosAbandonados: aband, ultimoIntentoAt },
    { upsert: true }
  );
}
