import { Router } from 'express'
import mongoose from 'mongoose'

import { authRequired, allowRoles } from '../middlewares/auth.middleware.js'
import Usuario from '../models/Usuario.js'
import Progreso from '../models/Progreso.js'
import ProgresoIndicador from '../models/ProgresoIndicador.js'
import Intento from '../models/Intento.js'
import Notificacion from '../models/Notificacion.js'
import CNBArea from '../models/CNB_Area.js'
import CNBIndicador from '../models/CNB_Indicador.js'
import CNBCompetencia from '../models/CNB_Competencia.js'
import { getRecommendationsForUser, recursosPorIndicadores } from '../services/recommendations.service.js'

const router = Router()

const SAFE_USER_PROJECTION =
  '-password -passwordHash -passwordResetToken -passwordResetExpires -passwordChangedAt'

const gradeNumberToCode = (n) => ({ 1: '1B', 2: '2B', 3: '3B' }[Number(n)] || null)
const gradeNumberToLabel = (n) => ({ 1: '1ro. Básico', 2: '2do. Básico', 3: '3ro. Básico' }[Number(n)] || 'Sin grado')
const buildGradeOptions = () =>
  [1, 2, 3].map((number) => ({
    number,
    code: gradeNumberToCode(number),
    label: gradeNumberToLabel(number),
    description: `${gradeNumberToLabel(number)} · Plan oficial CNB`,
  }))
const unique = (arr) => [...new Set(arr.filter(Boolean))]

const toObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) return value
  const str = String(value || '').trim()
  if (!mongoose.Types.ObjectId.isValid(str)) return null
  return new mongoose.Types.ObjectId(str)
}

const safePercent = (num, den) => (den ? +(((num / den) * 100)).toFixed(2) : 0)

const asDayKey = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const durationFromAttempt = (attempt) => {
  if (typeof attempt?.duracionSeg === 'number' && attempt.duracionSeg >= 0) {
    return attempt.duracionSeg
  }
  if (attempt?.startedAt && attempt?.finishedAt) {
    const diff = new Date(attempt.finishedAt) - new Date(attempt.startedAt)
    return diff > 0 ? Math.round(diff / 1000) : 0
  }
  return 0
}

const computeStreak = (sessions) => {
  const days = Array.from(new Set(sessions.filter((s) => s.seconds > 0).map((s) => s.date)))
    .sort((a, b) => new Date(b) - new Date(a))
  if (!days.length) return 0
  let streak = 1
  let prev = new Date(days[0])
  for (let i = 1; i < days.length; i += 1) {
    const current = new Date(days[i])
    const diffDays = Math.round((prev - current) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) continue
    if (diffDays === 1) {
      streak += 1
      prev = current
      continue
    }
    break
  }
  return streak
}

const computeUsageFromAttempts = (attempts, limitDays = 7) => {
  const byDay = new Map()
  let totalSeconds = 0
  for (const at of attempts) {
    const key = asDayKey(at.startedAt || at.createdAt || at.updatedAt)
    if (!key) continue
    const dur = durationFromAttempt(at)
    totalSeconds += dur
    byDay.set(key, (byDay.get(key) || 0) + dur)
  }
  const sessions = Array.from(byDay.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, seconds]) => ({ date, seconds }))
  const limited = sessions.slice(Math.max(sessions.length - limitDays, 0))
  const streak = computeStreak(sessions)
  return { totalSeconds, sessions: limited, streak }
}

const computeFrequencyLabel = (attemptMap) => {
  const entries = Array.from(attemptMap.entries())
  if (!entries.length) return '0 sesiones/sem'
  const counts = entries.map(([, value]) => value)
  const totalSessions = counts.reduce((acc, val) => acc + val, 0)
  const days = entries.length
  const weeks = Math.max(days / 7, 1)
  const freq = totalSessions / weeks
  return `${freq.toFixed(1)} sesiones/sem`
}

const buildHistoryFromAttempts = (attempts, indicatorMap, studentMap) =>
  attempts.slice(0, 20).map((attempt) => {
    const indicator = indicatorMap.get(String(attempt.indicadorId)) || null
    const student = studentMap?.get(String(attempt.usuarioId)) || null
    return {
      id: String(attempt._id),
      fecha: attempt.finishedAt || attempt.updatedAt || attempt.createdAt,
      estado: attempt.estado,
      puntuacion: attempt.puntuacion,
      indicador: indicator
        ? {
            id: String(indicator._id),
            codigo: indicator.codigo,
            descripcion: indicator.descripcion,
          }
        : null,
      estudiante: student
        ? {
            id: String(student._id),
            nombre: student.nombre,
            grado: gradeNumberToLabel(student.grado),
          }
        : null,
    }
  })

router.get('/student', authRequired, allowRoles('ESTUDIANTE'), async (req, res, next) => {
  try {
    const userId = toObjectId(req.user.id)
    if (!userId) return res.status(400).json({ error: 'Usuario inválido' })

    const user = await Usuario.findById(userId)
      .select(SAFE_USER_PROJECTION)
      .lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const gradeCode = gradeNumberToCode(user.grado)
    if (!gradeCode) {
      return res.json({
        requiresGradeSelection: true,
        availableGrades: buildGradeOptions(),
        user: {
          id: String(user._id),
          nombre: user.nombre,
          email: user.email,
          grade: {
            number: user.grado ?? null,
            label: gradeNumberToLabel(user.grado),
          },
        },
      })
    }

    const planIndicators = await CNBIndicador.find({ grado: gradeCode }).lean()
    const totalPlan = planIndicators.length
    const indicatorMap = new Map(planIndicators.map((ind) => [String(ind._id), ind]))

    const areaIds = unique(planIndicators.map((ind) => String(ind.areaId || '')))
    const areaObjIds = areaIds.map((id) => toObjectId(id)).filter(Boolean)
    const areas = areaIds.length ? await CNBArea.find({ _id: { $in: areaIds } }).lean() : []
    const areaMap = new Map(areas.map((area) => [String(area._id), area]))

    const competenciasDocs = areaObjIds.length
      ? await CNBCompetencia.find({ areaId: { $in: areaObjIds }, grado: gradeCode }).lean()
      : []
    const competenciasPorArea = new Map()
    for (const comp of competenciasDocs) {
      const key = comp.areaId ? String(comp.areaId) : null
      if (!key) continue
      if (!competenciasPorArea.has(key)) competenciasPorArea.set(key, [])
      competenciasPorArea.get(key).push(comp)
    }

    const indicatorIds = planIndicators.map((ind) => ind._id)
    const recursosPorArea = new Map()
    if (indicatorIds.length) {
      const recursos = await recursosPorIndicadores(indicatorIds)
      for (const recurso of recursos) {
        const resourceId = String(recurso._id)
        const candidates = [
          recurso.indicadorId ? String(recurso.indicadorId) : null,
          ...(Array.isArray(recurso.indicadorIds) ? recurso.indicadorIds.map((id) => String(id)) : []),
        ].filter(Boolean)
        const uniqueIndicators = [...new Set(candidates)]
        for (const indicatorId of uniqueIndicators) {
          const indicator = indicatorMap.get(String(indicatorId))
          if (!indicator || !indicator.areaId) continue
          const areaKey = String(indicator.areaId)
          if (!recursosPorArea.has(areaKey)) recursosPorArea.set(areaKey, new Set())
          recursosPorArea.get(areaKey).add(resourceId)
        }
      }
    }

    const progress = await Progreso.find({ usuarioId: userId }).lean()
    const progressMap = new Map(progress.map((p) => [String(p.indicadorId), p]))

    let completados = 0
    let scoreSum = 0
    let scoreCount = 0
    const areaStats = new Map()

    for (const indicator of planIndicators) {
      const key = String(indicator.areaId || '')
      if (!areaStats.has(key)) {
        areaStats.set(key, {
          total: 0,
          completados: 0,
          enProgreso: 0,
          pendientes: 0,
          scoreSum: 0,
          scoreCount: 0,
          nextIndicator: null,
        })
      }
      const bucket = areaStats.get(key)
      bucket.total += 1

      const prog = progressMap.get(String(indicator._id))
      if (prog) {
        if (prog.estado === 'completado') {
          bucket.completados += 1
          completados += 1
        } else if (prog.estado === 'en_progreso') {
          bucket.enProgreso += 1
        } else {
          bucket.pendientes += 1
        }

        if (typeof prog.puntuacion === 'number') {
          bucket.scoreSum += prog.puntuacion
          bucket.scoreCount += 1
          scoreSum += prog.puntuacion
          scoreCount += 1
        }
      } else {
        bucket.pendientes += 1
      }

      if (!bucket.nextIndicator && (!prog || prog.estado !== 'completado')) {
        bucket.nextIndicator = {
          indicadorId: String(indicator._id),
          codigo: indicator.codigo,
          descripcion: indicator.descripcion,
        }
      }
    }

    const promedioGeneral = scoreCount ? +(scoreSum / scoreCount).toFixed(2) : 0
    const progresoTotal = totalPlan ? +((completados / totalPlan) * 100).toFixed(2) : 0

    const attempts = await Intento.find({ usuarioId: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
    const notifications = await Notificacion.find({ usuarioId: userId })
      .sort({ fecha: -1 })
      .limit(10)
      .lean()

    const progressIndicators = await ProgresoIndicador.find({
      $or: [{ usuarioId: userId }, { usuarioId: String(userId) }],
    }).lean()

    const totalIntentos = progressIndicators.reduce((acc, p) => acc + (p.intentosTotales || 0), 0)
    const intentosAbandonados = progressIndicators.reduce((acc, p) => acc + (p.intentosAbandonados || 0), 0)
    const indicadoresCompletados = progressIndicators.filter(
      (p) => (p.estado || p.estadoIndicador) === 'completado'
    ).length

    const { items: recommendations } = await getRecommendationsForUser(String(userId), {
      limitIndicators: 6,
      limitResources: 3,
    })

    const missingIndicatorIds = recommendations
      .map((item) => item.indicadorId)
      .filter((id) => id && !indicatorMap.has(id))
    if (missingIndicatorIds.length) {
      const extraIndicators = await CNBIndicador.find({ _id: { $in: missingIndicatorIds } }).lean()
      for (const ind of extraIndicators) {
        indicatorMap.set(String(ind._id), ind)
      }
    }

    const recommendationsEnriched = recommendations.map((item) => {
      const indicator = indicatorMap.get(item.indicadorId)
      return {
        ...item,
        indicador: indicator
          ? {
              id: String(indicator._id),
              codigo: indicator.codigo,
              descripcion: indicator.descripcion,
              areaId: indicator.areaId ? String(indicator.areaId) : null,
            }
          : null,
      }
    })

    const courses = []
    for (const [areaId, stats] of areaStats.entries()) {
      const area = areaMap.get(areaId)
      const promedioArea = stats.scoreCount ? +(stats.scoreSum / stats.scoreCount).toFixed(2) : null
      const competencias = competenciasPorArea.get(areaId) || []
      const recursosSet = recursosPorArea.get(areaId)
      courses.push({
        areaId,
        titulo: area?.nombre || 'Área sin nombre',
        totalIndicadores: stats.total,
        completados: stats.completados,
        enProgreso: stats.enProgreso,
        pendientes: stats.pendientes,
        promedio: promedioArea,
        progreso: stats.total ? +((stats.completados / stats.total) * 100).toFixed(2) : 0,
        siguiente: stats.nextIndicator,
        competencias: competencias.length,
        recursos: recursosSet ? recursosSet.size : 0,
      })
    }
    courses.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))

    let featuredCourseId = null
    if (courses.length) {
      const sorted = [...courses].sort((a, b) => {
        const pendingDiff = (b.pendientes || 0) - (a.pendientes || 0)
        if (pendingDiff !== 0) return pendingDiff
        const progressDiff = (a.progreso || 0) - (b.progreso || 0)
        if (progressDiff !== 0) return progressDiff
        return a.titulo.localeCompare(b.titulo, 'es')
      })
      featuredCourseId = sorted[0]?.areaId || null
    }

    const history = buildHistoryFromAttempts(attempts, indicatorMap)

    const recomendacionesActivas = recommendationsEnriched.length
    const indicadoresPendientes = totalPlan > completados ? totalPlan - completados : 0

    res.json({
      user: {
        id: String(userId),
        nombre: user.nombre,
        email: user.email,
        grade: {
          number: user.grado,
          code: gradeCode,
          label: gradeNumberToLabel(user.grado),
        },
      },
      summary: {
        promedioGeneral,
        progresoTotal,
        tareasCompletadas: completados,
        tareasTotales: totalPlan,
        indicadoresPendientes,
        recomendacionesActivas,
        notificacionesNoLeidas: notifications.filter((n) => !n.leida).length,
      },
      cursos: courses,
      cursoDestacadoId: featuredCourseId,
      recomendaciones: recommendationsEnriched,
      historial: history,
      notificaciones: notifications,
      intentos: {
        limite: 3,
        usados: Math.min(totalIntentos, 3),
        totales: totalIntentos,
        abandonados: intentosAbandonados,
        indicadoresCompletados,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/student/courses/:areaId', authRequired, allowRoles('ESTUDIANTE'), async (req, res, next) => {
  try {
    const userId = toObjectId(req.user.id)
    const areaId = toObjectId(req.params.areaId)
    if (!userId || !areaId) return res.status(400).json({ error: 'Parámetros inválidos' })

    const user = await Usuario.findById(userId)
      .select(SAFE_USER_PROJECTION)
      .lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const gradeCode = gradeNumberToCode(user.grado)
    if (!gradeCode) return res.status(400).json({ error: 'El estudiante no tiene grado asignado' })

    const area = await CNBArea.findById(areaId).lean()
    if (!area) return res.status(404).json({ error: 'Área no encontrada' })

    const competencias = await CNBCompetencia.find({ areaId, grado: gradeCode })
      .sort({ orden: 1 })
      .lean()
    const competenciaIds = competencias.map((c) => c._id)

    const indicadores = await CNBIndicador.find({
      areaId,
      grado: gradeCode,
    })
      .sort({ orden: 1 })
      .lean()

    const indicadorIds = indicadores.map((ind) => ind._id)
    const progress = await Progreso.find({
      usuarioId: userId,
      indicadorId: { $in: indicadorIds },
    }).lean()
    const progressMap = new Map(progress.map((p) => [String(p.indicadorId), p]))

    const recursos = await recursosPorIndicadores(indicadorIds)
    const recursosPorIndicador = new Map()
    for (const recurso of recursos) {
      const candidates = [
        recurso.indicadorId ? String(recurso.indicadorId) : null,
        ...(Array.isArray(recurso.indicadorIds) ? recurso.indicadorIds.map((id) => String(id)) : []),
      ].filter(Boolean)
      for (const indId of candidates) {
        if (!recursosPorIndicador.has(indId)) recursosPorIndicador.set(indId, [])
        const bucket = recursosPorIndicador.get(indId)
        if (bucket.length >= 5) continue
        bucket.push({
          _id: recurso._id,
          titulo: recurso.titulo,
          tipo: recurso.tipo,
          url: recurso.url,
          proveedor: recurso.proveedor,
          nivel: recurso.nivel,
        })
      }
    }

    const competenciasDetalle = competencias.map((comp) => {
      const relatedIndicators = indicadores.filter((ind) => String(ind.competenciaId) === String(comp._id))
      const items = relatedIndicators.map((ind) => {
        const prog = progressMap.get(String(ind._id)) || null
        return {
          id: String(ind._id),
          codigo: ind.codigo,
          descripcion: ind.descripcion,
          contenidos: ind.contenidos || [],
          estado: prog?.estado || 'pendiente',
          puntuacion: prog?.puntuacion ?? null,
          recursos: recursosPorIndicador.get(String(ind._id)) || [],
        }
      })
      const totales = items.length
      const completados = items.filter((item) => item.estado === 'completado').length
      return {
        id: String(comp._id),
        codigo: comp.codigo,
        enunciado: comp.enunciado,
        totales,
        completados,
        progreso: safePercent(completados, totales),
        indicadores: items,
      }
    })

    const totalIndicadores = competenciasDetalle.reduce((acc, comp) => acc + comp.totales, 0)
    const completadosTotales = competenciasDetalle.reduce((acc, comp) => acc + comp.completados, 0)
    const promedio = (() => {
      const scores = indicadores
        .map((ind) => progressMap.get(String(ind._id)))
        .filter((prog) => typeof prog?.puntuacion === 'number')
      if (!scores.length) return 0
      const sum = scores.reduce((acc, prog) => acc + prog.puntuacion, 0)
      return +(sum / scores.length).toFixed(2)
    })()

    res.json({
      area: {
        id: String(area._id),
        nombre: area.nombre,
      },
      grade: {
        number: user.grado,
        code: gradeCode,
        label: gradeNumberToLabel(user.grado),
      },
      resumen: {
        totalIndicadores,
        completados: completadosTotales,
        progreso: safePercent(completadosTotales, totalIndicadores),
        promedio,
      },
      competencias: competenciasDetalle,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/teacher', authRequired, allowRoles('DOCENTE', 'ADMIN'), async (req, res, next) => {
  try {
    const students = await Usuario.find({ rol: 'ESTUDIANTE' })
      .select(SAFE_USER_PROJECTION)
      .lean()
    if (!students.length) {
      return res.json({
        summary: { promedioGeneral: 0, cobertura: 0, progresoPromedio: 0, abandono: 0 },
        side: { estudiantesActivos: 0, reportesPendientes: 0, mensajesSinLeer: 0 },
        weakTopics: [],
        students: [],
        usage: { totalSeconds: 0, streak: 0, sessions: [] },
        histories: { students: [], recomendaciones: [] },
      })
    }

    const studentIds = students.map((s) => toObjectId(s._id)).filter(Boolean)

    const progress = await Progreso.find({ usuarioId: { $in: studentIds } }).lean()
    const attempts = await Intento.find({ usuarioId: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .lean()
    const notifications = await Notificacion.find({ usuarioId: { $in: studentIds } })
      .sort({ fecha: -1 })
      .limit(200)
      .lean()

    const gradeCodes = unique(students.map((s) => gradeNumberToCode(s.grado)))
    const planCounts = {}
    for (const code of gradeCodes) {
      planCounts[code] = await CNBIndicador.countDocuments({ grado: code })
    }

    const indicatorIds = unique([
      ...progress.map((p) => String(p.indicadorId)),
      ...attempts.map((a) => String(a.indicadorId)),
    ])
    const indicatorDocs = indicatorIds.length
      ? await CNBIndicador.find({ _id: { $in: indicatorIds } }).lean()
      : []
    const indicatorMap = new Map(indicatorDocs.map((ind) => [String(ind._id), ind]))

    const studentMap = new Map(students.map((s) => [String(s._id), s]))
    const attemptsByUser = new Map()
    let totalIntentos = 0
    let totalAbandonados = 0
    for (const attempt of attempts) {
      const uid = String(attempt.usuarioId)
      if (!attemptsByUser.has(uid)) attemptsByUser.set(uid, new Map())
      const day = asDayKey(attempt.startedAt || attempt.createdAt)
      if (day) {
        const map = attemptsByUser.get(uid)
        map.set(day, (map.get(day) || 0) + 1)
      }
      totalIntentos += 1
      if (attempt.estado === 'abandonado') totalAbandonados += 1
    }

    const progressByUser = new Map()
    let totalCompletados = 0
    let totalPlan = 0
    let totalScoreSum = 0
    let totalScoreCount = 0

    for (const student of students) {
      const key = String(student._id)
      const gradeCode = gradeNumberToCode(student.grado)
      const planTotal = planCounts[gradeCode] || 0
      progressByUser.set(key, {
        student,
        planTotal,
        completados: 0,
        scoreSum: 0,
        scoreCount: 0,
        abandono: 0,
      })
      totalPlan += planTotal
    }

    const attemptsStatusByUser = new Map()
    for (const attempt of attempts) {
      const uid = String(attempt.usuarioId)
      if (!attemptsStatusByUser.has(uid)) {
        attemptsStatusByUser.set(uid, { total: 0, abandonados: 0 })
      }
      const bucket = attemptsStatusByUser.get(uid)
      bucket.total += 1
      if (attempt.estado === 'abandonado') bucket.abandonados += 1
    }

    for (const prog of progress) {
      const uid = String(prog.usuarioId)
      const bucket = progressByUser.get(uid)
      if (!bucket) continue
      if (prog.estado === 'completado') {
        bucket.completados += 1
        totalCompletados += 1
      }
      if (typeof prog.puntuacion === 'number') {
        bucket.scoreSum += prog.puntuacion
        bucket.scoreCount += 1
        totalScoreSum += prog.puntuacion
        totalScoreCount += 1
      }
    }

    for (const [uid, bucket] of progressByUser.entries()) {
      const status = attemptsStatusByUser.get(uid)
      bucket.abandono = status?.total
        ? +((status.abandonados / status.total) * 100).toFixed(1)
        : 0
    }

    const studentRows = []
    for (const [uid, bucket] of progressByUser.entries()) {
      const { student, planTotal, completados: comp, scoreSum: sum, scoreCount: count, abandono } = bucket
      const promedio = count ? +(sum / count).toFixed(2) : 0
      const progreso = planTotal ? +((comp / planTotal) * 100).toFixed(2) : 0
      const freqMap = attemptsByUser.get(uid) || new Map()
      studentRows.push({
        id: uid,
        nombre: student.nombre,
        grado: gradeNumberToLabel(student.grado),
        promedio,
        progreso,
        completados: comp,
        abandono,
        frecuencia: computeFrequencyLabel(freqMap),
      })
    }

    const promedioGeneral = totalScoreCount ? +(totalScoreSum / totalScoreCount).toFixed(2) : 0
    const cobertura = safePercent(totalCompletados, totalPlan)
    const progresoPromedio = students.length
      ? +(studentRows.reduce((acc, row) => acc + row.progreso, 0) / students.length).toFixed(2)
      : 0
    const abandono = totalIntentos ? +((totalAbandonados / totalIntentos) * 100).toFixed(2) : 0

    const usage = computeUsageFromAttempts(attempts, 7)

    const indicatorStats = new Map()
    for (const prog of progress) {
      const indId = String(prog.indicadorId)
      if (!indicatorStats.has(indId)) {
        indicatorStats.set(indId, { scoreSum: 0, scoreCount: 0, completados: 0 })
      }
      const bucket = indicatorStats.get(indId)
      if (typeof prog.puntuacion === 'number') {
        bucket.scoreSum += prog.puntuacion
        bucket.scoreCount += 1
      }
      if (prog.estado === 'completado') bucket.completados += 1
    }

    const weakTopics = Array.from(indicatorStats.entries())
      .map(([id, stats]) => {
        const indicator = indicatorMap.get(id)
        if (!indicator) return null
        if (!stats.scoreCount) return null
        return {
          indicadorId: id,
          promedio: +(stats.scoreSum / stats.scoreCount).toFixed(2),
          completados: stats.completados,
          descripcion: indicator.descripcion,
          codigo: indicator.codigo,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.promedio - b.promedio)
      .slice(0, 5)

    const studentHistory = buildHistoryFromAttempts(attempts, indicatorMap, studentMap)

    const recommendationHistory = notifications.slice(0, 40).map((notif) => {
      const student = studentMap.get(String(notif.usuarioId))
      return {
        id: String(notif._id),
        fecha: notif.fecha || notif.createdAt,
        mensaje: notif.mensaje,
        tipo: notif.tipo,
        leida: notif.leida,
        estudiante: student
          ? {
              id: String(student._id),
              nombre: student.nombre,
              grado: gradeNumberToLabel(student.grado),
            }
          : null,
      }
    })

    res.json({
      summary: {
        promedioGeneral,
        cobertura,
        progresoPromedio,
        abandono,
      },
      side: {
        estudiantesActivos: students.length,
        reportesPendientes: notifications.filter((n) => !n.leida).length,
        mensajesSinLeer: notifications.filter((n) => !n.leida).length,
      },
      weakTopics,
      students: studentRows,
      usage,
      histories: {
        students: studentHistory,
        recomendaciones: recommendationHistory,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/admin', authRequired, allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const users = await Usuario.find()
      .select(SAFE_USER_PROJECTION)
      .lean()
    const students = users.filter((u) => u.rol === 'ESTUDIANTE')

    const roleCounts = users.reduce(
      (acc, user) => ({
        ...acc,
        [user.rol]: (acc[user.rol] || 0) + 1,
      }),
      { ESTUDIANTE: 0, DOCENTE: 0, ADMIN: 0 }
    )

    const studentIds = students.map((s) => toObjectId(s._id)).filter(Boolean)
    const progress = await Progreso.find({ usuarioId: { $in: studentIds } }).lean()
    const attempts = await Intento.find({ usuarioId: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .lean()
    const notifications = await Notificacion.find({ usuarioId: { $in: studentIds } })
      .sort({ fecha: -1 })
      .limit(200)
      .lean()
    const progressIndicators = await ProgresoIndicador.find({ usuarioId: { $in: [...studentIds, ...studentIds.map((id) => String(id))] } }).lean()

    const [areaDocs, competenciaDocs, indicadorDocs] = await Promise.all([
      CNBArea.find().sort({ nombre: 1 }).lean(),
      CNBCompetencia.find().lean(),
      CNBIndicador.find().lean(),
    ])

    const planCounts = indicadorDocs.reduce((acc, indicador) => {
      if (indicador.grado) {
        acc[indicador.grado] = (acc[indicador.grado] || 0) + 1
      }
      return acc
    }, {})

    const competenciasPorArea = competenciaDocs.reduce((acc, competencia) => {
      const key = String(competencia.areaId)
      acc.set(key, (acc.get(key) || 0) + 1)
      return acc
    }, new Map())

    const indicadoresPorArea = indicadorDocs.reduce((acc, indicador) => {
      const key = String(indicador.areaId)
      if (!acc.has(key)) {
        acc.set(key, { total: 0, porGrado: {} })
      }
      const bucket = acc.get(key)
      bucket.total += 1
      if (indicador.grado) {
        bucket.porGrado[indicador.grado] = (bucket.porGrado[indicador.grado] || 0) + 1
      }
      return acc
    }, new Map())

    const catalogAreas = areaDocs.map((area) => {
      const key = String(area._id)
      const compCount = competenciasPorArea.get(key) || 0
      const indicadorInfo = indicadoresPorArea.get(key) || { total: 0, porGrado: {} }
      return {
        id: key,
        nombre: area.nombre,
        descripcion: area.descripcion || '',
        slug: area.slug || '',
        competencias: compCount,
        indicadores: indicadorInfo.total,
        indicadoresPorGrado: indicadorInfo.porGrado,
      }
    })

    const cnbCatalog = {
      resumen: {
        totalAreas: areaDocs.length,
        totalCompetencias: competenciaDocs.length,
        totalIndicadores: indicadorDocs.length,
      },
      areas: catalogAreas,
    }

    let totalCompletados = 0
    let totalScoreSum = 0
    let totalScoreCount = 0
    for (const prog of progress) {
      if (prog.estado === 'completado') totalCompletados += 1
      if (typeof prog.puntuacion === 'number') {
        totalScoreSum += prog.puntuacion
        totalScoreCount += 1
      }
    }

    const attemptsCount = attempts.length
    const abandonados = attempts.filter((a) => a.estado === 'abandonado').length

    const totalPlan = students.reduce((acc, student) => {
      const code = gradeNumberToCode(student.grado)
      return acc + (planCounts[code] || 0)
    }, 0)

    const promedioGeneral = totalScoreCount ? +(totalScoreSum / totalScoreCount).toFixed(2) : 0
    const progresoPromedio = students.length
      ? +(
          students.reduce((acc, student) => {
            const code = gradeNumberToCode(student.grado)
            const planTotal = planCounts[code] || 0
            if (!planTotal) return acc
            const completadosUsuario = progress.filter(
              (p) => String(p.usuarioId) === String(student._id) && p.estado === 'completado'
            ).length
            return acc + safePercent(completadosUsuario, planTotal)
          }, 0) / students.length
        ).toFixed(2)
      : 0

    const intentosRegistrados = progressIndicators.reduce((acc, p) => acc + (p.intentosTotales || 0), 0)

    const recommendationHistory = notifications.slice(0, 50).map((notif) => ({
      id: String(notif._id),
      fecha: notif.fecha || notif.createdAt,
      mensaje: notif.mensaje,
      tipo: notif.tipo,
      usuarioId: String(notif.usuarioId),
      leida: notif.leida,
    }))

    const changesHistory = users
      .filter((u) => u.updatedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 50)
      .map((user) => ({
        id: String(user._id),
        fecha: user.updatedAt,
        nombre: user.nombre,
        rol: user.rol,
        email: user.email,
      }))

    const sessionsPerStudent = students.length ? attemptsCount / students.length : 0

    res.json({
      summary: {
        usuariosTotales: users.length,
        progresoPromedio,
        intentosRegistrados,
        promedioGeneral,
        cobertura: safePercent(totalCompletados, totalPlan),
        abandono: attemptsCount ? +((abandonados / attemptsCount) * 100).toFixed(2) : 0,
      },
      roles: roleCounts,
      globalMetrics: {
        tareasCompletadas: totalCompletados,
        recomendacionesActivas: notifications.filter((n) => !n.leida).length,
        intentosPromedioPorEstudiante: +sessionsPerStudent.toFixed(2),
      },
      histories: {
        recomendaciones: recommendationHistory,
        cambios: changesHistory,
      },
      cnbCatalog,
    })
  } catch (err) {
    next(err)
  }
})

export default router
