import mongoose from 'mongoose'

import Intento from '../models/Intento.js'
import ProgresoIndicador from '../models/ProgresoIndicador.js'
import Recurso from '../models/Recurso.js'

const isHex24 = (s = '') => /^[0-9a-fA-F]{24}$/.test(String(s || ''))

const toObjId = (s) => {
  if (s instanceof mongoose.Types.ObjectId) return s
  const value = String(s || '').trim()
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null
}

async function recursosPorIndicadores(indicadorIds = []) {
  const hexes = indicadorIds
    .map((x) => String(x || '').trim())
    .filter((x) => isHex24(x))
  if (!hexes.length) return []

  const oids = hexes.map((h) => new mongoose.Types.ObjectId(h))

  let recs = await Recurso.find({
    activo: { $ne: false },
    $or: [
      { indicadorId: { $in: oids } },
      { indicadorIds: { $in: oids } },
      { indicadorId: { $in: hexes } },
      { indicadorIds: { $in: hexes } },
    ],
  })
    .sort({ nivel: 1, createdAt: -1 })
    .lean()

  if (recs.length) return recs

  const todos = await Recurso.find({ activo: { $ne: false } })
    .sort({ nivel: 1, createdAt: -1 })
    .lean()

  const setHex = new Set(hexes)
  recs = todos.filter((r) => {
    const single = r.indicadorId ? String(r.indicadorId) : null
    if (single && setHex.has(single)) return true

    const arr = Array.isArray(r.indicadorIds) ? r.indicadorIds : []
    for (const raw of arr) {
      const val = String(raw)
      if (setHex.has(val)) return true
    }
    return false
  })

  return recs
}

export async function getRecommendationsForUser(usuarioId, options = {}) {
  const { limitIndicators = 6, limitResources = 3, debug = false } = options

  const uidStr = String(usuarioId || '').trim()
  if (!isHex24(uidStr)) {
    const error = new Error('usuarioId inválido')
    error.status = 400
    throw error
  }

  const uidObj = toObjId(uidStr)
  const now = new Date()
  const repasoMs = 14 * 24 * 60 * 60 * 1000

  const progresos = await ProgresoIndicador.find({
    $or: [{ usuarioId: uidObj }, { usuarioId: uidStr }],
  }).lean()

  let candidatos = []
  const debugInfo = { fuente: 'progreso_indicador', candidatos: [], fallback: false }

  if (progresos && progresos.length) {
    for (const p of progresos) {
      const indId = (p.indicadorId || p.indicador)?.toString()
      if (!indId) continue

      const lastScore = typeof p.ultimoScore === 'number' ? p.ultimoScore : p.promedio
      const estado = p.estado || p.estadoIndicador || p.status || 'pendiente'
      const ultimoIntentoAt = p.ultimoIntentoAt || p.updatedAt || p.createdAt

      if (typeof lastScore === 'number' && lastScore < 60) {
        candidatos.push({ indicadorId: indId, motivo: 'refuerzo' })
        debugInfo.candidatos.push({ indicadorId: indId, motivo: 'refuerzo', fuente: 'score_bajo' })
        continue
      }

      if (estado !== 'completado') {
        candidatos.push({ indicadorId: indId, motivo: 'refuerzo' })
        debugInfo.candidatos.push({ indicadorId: indId, motivo: 'refuerzo', fuente: `estado_${estado}` })
        continue
      }

      if (ultimoIntentoAt && now - new Date(ultimoIntentoAt) > repasoMs) {
        candidatos.push({ indicadorId: indId, motivo: 'repaso' })
        debugInfo.candidatos.push({ indicadorId: indId, motivo: 'repaso', fuente: 'inactividad' })
      }
    }
  }

  if (!candidatos.length) {
    debugInfo.fuente = 'intentos'
    debugInfo.fallback = true

    const intentos = await Intento.find({
      $or: [{ usuarioId: uidObj }, { usuarioId: uidStr }],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const debiles = intentos
      .filter((it) => typeof it.puntuacion === 'number' && it.puntuacion < 60)
      .map((it) => it.indicadorId?.toString())
      .filter(Boolean)

    const unico = [...new Set(debiles)]
    candidatos = unico.map((id) => ({ indicadorId: id, motivo: 'refuerzo' }))
    debugInfo.candidatos = candidatos.map((c) => ({ ...c, fuente: 'intentos' }))
  }

  if (!candidatos.length) {
    return { items: [], debug: debug ? { ...debugInfo, motivo: 'sin_candidatos' } : undefined }
  }

  const porIndicador = candidatos.reduce((acc, c) => {
    const k = c.indicadorId
    if (!acc[k]) acc[k] = { indicadorId: k, motivo: c.motivo, recursos: [] }
    if (c.motivo === 'refuerzo') acc[k].motivo = 'refuerzo'
    return acc
  }, {})
  const ids = Object.keys(porIndicador)
  const recursos = await recursosPorIndicadores(ids)

  for (const r of recursos) {
    const rId = String(r._id)
    const candidates = [
      r.indicadorId ? String(r.indicadorId) : null,
      ...(Array.isArray(r.indicadorIds) ? r.indicadorIds.map((x) => String(x)) : []),
    ].filter(Boolean)

    for (const id of candidates) {
      const bucket = porIndicador[id]
      if (!bucket) continue

      if (!bucket._seen) bucket._seen = new Set()
      if (bucket._seen.has(rId)) continue
      if (bucket.recursos.length >= limitResources) continue

      bucket._seen.add(rId)
      bucket.recursos.push({
        _id: r._id,
        titulo: r.titulo,
        tipo: r.tipo,
        proveedor: r.proveedor,
        nivel: r.nivel,
        idioma: r.idioma,
        url: r.url,
        duracionMin: r.duracionMin,
      })
    }
  }

  const items = Object.values(porIndicador)
    .map((item) => {
      const next = { ...item }
      delete next._seen
      return next
    })
    .filter((item) => item.recursos.length)
    .slice(0, limitIndicators)

  return { items, debug: debug ? debugInfo : undefined }
}

export { recursosPorIndicadores }
