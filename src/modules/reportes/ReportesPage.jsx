import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, AlertTriangle, Plus, Calendar, Building, X, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const TIPOS_INCIDENTE = ['Caída', 'Medicación incorrecta', 'Flebitis', 'Úlcera por presión', 'Fuga de paciente', 'Agresión', 'Otro']
const GRAVEDADES = ['Leve', 'Moderada', 'Grave', 'Crítica']
const ESTADOS_INCIDENTE = ['ABIERTO', 'EN_INVESTIGACION', 'CERRADO']

function ReportesPage() {
    const [incidentes, setIncidentes] = useState([])
    const [reportes, setReportes] = useState([])
    const [pisos, setPisos] = useState([])
    const [turnos, setTurnos] = useState([])
    const [enfermeros, setEnfermeros] = useState([])
    const [pacientes, setPacientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(null)
    const [tabActiva, setTabActiva] = useState('incidentes')
    const [toast, setToast] = useState(null)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [incRes, repRes, pisoRes, turnoRes, enfRes, pacRes] = await Promise.all([
                supabase.from('Incidente').select('*').order('fechaHora', { ascending: false }),
                supabase.from('ReporteDiario').select('*').order('fecha', { ascending: false }),
                supabase.from('Piso').select('*'),
                supabase.from('Turno').select('*'),
                supabase.from('Enfermero').select('*'),
                supabase.from('Paciente').select('*')
            ])
            if (incRes.data) setIncidentes(incRes.data)
            if (repRes.data) setReportes(repRes.data)
            if (pisoRes.data) setPisos(pisoRes.data)
            if (turnoRes.data) setTurnos(turnoRes.data)
            if (enfRes.data) setEnfermeros(enfRes.data)
            if (pacRes.data) setPacientes(pacRes.data)
        } catch (error) { console.error(error) }
        setLoading(false)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const getGravedadColor = (gravedad) => {
        switch (gravedad) {
            case 'Leve': return 'bg-green-100 text-green-700'
            case 'Moderada': return 'bg-yellow-100 text-yellow-700'
            case 'Grave': return 'bg-orange-100 text-orange-700'
            case 'Crítica': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'ABIERTO': return 'bg-red-100 text-red-600'
            case 'EN_INVESTIGACION': return 'bg-yellow-100 text-yellow-600'
            case 'CERRADO': return 'bg-green-100 text-green-600'
            default: return 'bg-gray-100 text-gray-600'
        }
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reportes e Incidentes</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Registro de incidentes y reportes diarios de piso</p>
                </div>
                <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowModal('nuevoIncidente')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                        <AlertTriangle size={20} /> Nuevo Incidente
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowModal('nuevoReporte')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                        <FileText size={20} /> Reporte Diario
                    </motion.button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setTabActiva('incidentes')}
                    className={`px-4 py-2 font-medium transition-colors ${tabActiva === 'incidentes' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Incidentes ({incidentes.length})
                </button>
                <button onClick={() => setTabActiva('reportes')}
                    className={`px-4 py-2 font-medium transition-colors ${tabActiva === 'reportes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Reportes Diarios ({reportes.length})
                </button>
            </div>

            {/* Incidentes */}
            {tabActiva === 'incidentes' && (
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-gray-500">Cargando...</p>
                    ) : incidentes.length === 0 ? (
                        <p className="text-gray-500">No hay incidentes registrados</p>
                    ) : (
                        incidentes.map(inc => {
                            const enf = enfermeros.find(e => e.ID === inc.idEnfermeroReporta)
                            const pac = pacientes.find(p => p.ID === inc.idPaciente)
                            const piso = pisos.find(p => p.ID === inc.idPiso)
                            return (
                                <motion.div key={inc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex flex-wrap gap-2 justify-between items-start mb-3">
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGravedadColor(inc.gravedad)}`}>{inc.gravedad}</span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(inc.estado)}`}>{inc.estado?.replace('_', ' ')}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">{new Date(inc.fechaHora).toLocaleString()}</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{inc.tipo}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">{inc.descripcion}</p>
                                    {inc.accionesTomadas && (
                                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Acciones tomadas:</span>
                                            <p className="text-sm text-green-800 dark:text-green-300 mt-1">{inc.accionesTomadas}</p>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                                        {enf && <span>Reporta: {enf.nombre} {enf.apellidoPaterno}</span>}
                                        {pac && <span>Paciente: {pac.Nombre} {pac.A_Paterno}</span>}
                                        {piso && <span>Piso: {piso.Número}</span>}
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Reportes Diarios */}
            {tabActiva === 'reportes' && (
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-gray-500">Cargando...</p>
                    ) : reportes.length === 0 ? (
                        <p className="text-gray-500">No hay reportes registrados</p>
                    ) : (
                        reportes.map(rep => {
                            const piso = pisos.find(p => p.ID === rep.idPiso)
                            const turno = turnos.find(t => t.ID === rep.idTurno)
                            const enf = enfermeros.find(e => e.ID === rep.idEnfermeroResponsable)
                            return (
                                <motion.div key={rep.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                <Building size={20} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800 dark:text-white">Piso {piso?.Número}</h3>
                                                <p className="text-sm text-gray-500">{turno?.Nombre} - {rep.fecha}</p>
                                            </div>
                                        </div>
                                        {enf && <span className="text-xs text-gray-500">Por: {enf.nombre}</span>}
                                    </div>
                                    {rep.resumen && <div className="mb-3"><span className="text-xs font-medium text-gray-500">Resumen:</span><p className="text-sm text-gray-700 dark:text-gray-300">{rep.resumen}</p></div>}
                                    {rep.novedades && <div className="mb-3"><span className="text-xs font-medium text-gray-500">Novedades:</span><p className="text-sm text-gray-700 dark:text-gray-300">{rep.novedades}</p></div>}
                                    {rep.pendientes && <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"><span className="text-xs font-medium text-yellow-700">Pendientes:</span><p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">{rep.pendientes}</p></div>}
                                </motion.div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Modales */}
            <AnimatePresence>
                {showModal === 'nuevoIncidente' && (
                    <ModalNuevoIncidente pisos={pisos} pacientes={pacientes} currentUser={currentUser}
                        onClose={() => setShowModal(null)} onSuccess={() => { fetchData(); setShowModal(null); showToast('Incidente registrado') }} />
                )}
                {showModal === 'nuevoReporte' && (
                    <ModalNuevoReporte pisos={pisos} turnos={turnos} currentUser={currentUser}
                        onClose={() => setShowModal(null)} onSuccess={() => { fetchData(); setShowModal(null); showToast('Reporte guardado') }} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function ModalNuevoIncidente({ pisos, pacientes, currentUser, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ tipo: '', gravedad: 'Leve', descripcion: '', accionesTomadas: '', idPiso: '', idPaciente: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('Incidente').insert([{
                tipo: formData.tipo, gravedad: formData.gravedad, descripcion: formData.descripcion,
                accionesTomadas: formData.accionesTomadas || null, fechaHora: new Date().toISOString(),
                idPiso: formData.idPiso ? parseInt(formData.idPiso) : null,
                idPaciente: formData.idPaciente ? parseInt(formData.idPaciente) : null,
                idEnfermeroReporta: currentUser.ID
            }])
            if (error) throw error
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Registrar Incidente</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Incidente *</label>
                        <select required value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {TIPOS_INCIDENTE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gravedad *</label>
                        <div className="flex gap-2">
                            {GRAVEDADES.map(g => (
                                <button key={g} type="button" onClick={() => setFormData({ ...formData, gravedad: g })}
                                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${formData.gravedad === g
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:bg-gray-50'}`}>{g}</button>
                            ))}
                        </div></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción *</label>
                        <textarea rows={3} required value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Acciones Tomadas</label>
                        <textarea rows={2} value={formData.accionesTomadas} onChange={(e) => setFormData({ ...formData, accionesTomadas: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Piso</label>
                            <select value={formData.idPiso} onChange={(e) => setFormData({ ...formData, idPiso: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                                <option value="">-</option>
                                {pisos.map(p => <option key={p.ID} value={p.ID}>Piso {p.Número}</option>)}
                            </select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente</label>
                            <select value={formData.idPaciente} onChange={(e) => setFormData({ ...formData, idPaciente: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                                <option value="">-</option>
                                {pacientes.map(p => <option key={p.ID} value={p.ID}>{p.Nombre} {p.A_Paterno}</option>)}
                            </select></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Registrar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalNuevoReporte({ pisos, turnos, currentUser, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ idPiso: '', idTurno: '', fecha: new Date().toISOString().split('T')[0], resumen: '', novedades: '', pendientes: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('ReporteDiario').insert([{
                idPiso: parseInt(formData.idPiso), idTurno: parseInt(formData.idTurno), fecha: formData.fecha,
                resumen: formData.resumen || null, novedades: formData.novedades || null, pendientes: formData.pendientes || null,
                idEnfermeroResponsable: currentUser.ID
            }])
            if (error) throw error
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Reporte Diario de Piso</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Piso *</label>
                            <select required value={formData.idPiso} onChange={(e) => setFormData({ ...formData, idPiso: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                                <option value="">-</option>
                                {pisos.map(p => <option key={p.ID} value={p.ID}>{p.Número}</option>)}
                            </select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turno *</label>
                            <select required value={formData.idTurno} onChange={(e) => setFormData({ ...formData, idTurno: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                                <option value="">-</option>
                                {turnos.map(t => <option key={t.ID} value={t.ID}>{t.Nombre}</option>)}
                            </select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha *</label>
                            <input type="date" required value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resumen del Turno</label>
                        <textarea rows={3} value={formData.resumen} onChange={(e) => setFormData({ ...formData, resumen: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Novedades</label>
                        <textarea rows={2} value={formData.novedades} onChange={(e) => setFormData({ ...formData, novedades: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pendientes para siguiente turno</label>
                        <textarea rows={2} value={formData.pendientes} onChange={(e) => setFormData({ ...formData, pendientes: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar Reporte'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

export default ReportesPage
