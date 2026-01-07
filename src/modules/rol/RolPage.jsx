import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, ChevronLeft, ChevronRight, Users, X, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function RolPage() {
    const [roles, setRoles] = useState([])
    const [detalles, setDetalles] = useState([])
    const [enfermeros, setEnfermeros] = useState([])
    const [areas, setAreas] = useState([])
    const [turnos, setTurnos] = useState([])
    const [loading, setLoading] = useState(true)
    const [fechaActual, setFechaActual] = useState(new Date())
    const [showModal, setShowModal] = useState(null)
    const [selectedRol, setSelectedRol] = useState(null)
    const [selectedDate, setSelectedDate] = useState(null)
    const [toast, setToast] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (user) setCurrentUser(JSON.parse(user))
        fetchData()
    }, [])

    const canEdit = () => currentUser?.idCargo === 2 // Coordinador

    const fetchData = async () => {
        setLoading(true)
        try {
            const [rolRes, detRes, enfRes, areaRes, turnoRes] = await Promise.all([
                supabase.from('RolEnfermeria').select('*'),
                supabase.from('DetalleRol').select('*'),
                supabase.from('Enfermero').select('*'),
                supabase.from('Área').select('*'),
                supabase.from('Turno').select('*')
            ])
            if (rolRes.data) setRoles(rolRes.data)
            if (detRes.data) setDetalles(detRes.data)
            if (enfRes.data) setEnfermeros(enfRes.data)
            if (areaRes.data) setAreas(areaRes.data)
            if (turnoRes.data) setTurnos(turnoRes.data)
        } catch (error) {
            console.error('Error:', error)
        }
        setLoading(false)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    // Calendario
    const getDiasDelMes = () => {
        const year = fechaActual.getFullYear()
        const month = fechaActual.getMonth()
        const primerDia = new Date(year, month, 1)
        const ultimoDia = new Date(year, month + 1, 0)
        const dias = []

        // Días vacíos antes del primer día
        for (let i = 0; i < primerDia.getDay(); i++) {
            dias.push(null)
        }

        // Días del mes
        for (let i = 1; i <= ultimoDia.getDate(); i++) {
            dias.push(new Date(year, month, i))
        }

        return dias
    }

    const getDetallesPorFecha = (fecha) => {
        if (!fecha) return []
        const fechaStr = fecha.toISOString().split('T')[0]
        return detalles.filter(d => d.fecha === fechaStr)
    }

    const mesAnterior = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1))
    const mesSiguiente = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1))

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rol de Enfermería</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Calendario de turnos y asignaciones</p>
                </div>
                {canEdit() && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('nuevoRol')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                        <Plus size={20} /> Crear Rol
                    </motion.button>
                )}
            </div>

            {/* Lista de Roles activos */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Roles Activos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roles.length === 0 ? (
                        <p className="text-gray-500 col-span-3">No hay roles creados</p>
                    ) : (
                        roles.map(rol => (
                            <motion.div key={rol.id} whileHover={{ scale: 1.02 }}
                                onClick={() => setSelectedRol(rol)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRol?.id === rol.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'}`}>
                                <h3 className="font-semibold text-gray-800 dark:text-white">{rol.nombre}</h3>
                                <p className="text-sm text-gray-500 mt-1">{rol.fechaInicio} - {rol.fechaFin}</p>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Calendario */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header del calendario */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <button onClick={mesAnterior} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {MESES[fechaActual.getMonth()]} {fechaActual.getFullYear()}
                    </h2>
                    <button onClick={mesSiguiente} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                    {DIAS_SEMANA.map(dia => (
                        <div key={dia} className="p-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            {dia}
                        </div>
                    ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7">
                    {getDiasDelMes().map((dia, index) => {
                        const detallesDia = getDetallesPorFecha(dia)
                        const esHoy = dia && dia.toDateString() === new Date().toDateString()

                        return (
                            <div key={index}
                                onClick={() => dia && canEdit() && (setSelectedDate(dia), setShowModal('asignarDia'))}
                                className={`min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-gray-700 ${dia ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800/50'
                                    } ${esHoy ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                {dia && (
                                    <>
                                        <span className={`text-sm font-medium ${esHoy ? 'text-blue-600' : 'text-gray-800 dark:text-white'}`}>
                                            {dia.getDate()}
                                        </span>
                                        <div className="mt-1 space-y-1">
                                            {detallesDia.slice(0, 3).map((det, i) => {
                                                const enf = enfermeros.find(e => e.ID === det.idEnfermero)
                                                const turno = turnos.find(t => t.ID === det.idTurno)
                                                return (
                                                    <div key={i} className={`text-xs px-1.5 py-0.5 rounded truncate ${turno?.Nombre?.toLowerCase().includes('mañana') ? 'bg-yellow-100 text-yellow-700' :
                                                            turno?.Nombre?.toLowerCase().includes('tarde') ? 'bg-orange-100 text-orange-700' :
                                                                turno?.Nombre?.toLowerCase().includes('noche') ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {enf?.nombre?.charAt(0)}. {enf?.apellidoPaterno?.substring(0, 6)}
                                                    </div>
                                                )
                                            })}
                                            {detallesDia.length > 3 && (
                                                <span className="text-xs text-gray-500">+{detallesDia.length - 3} más</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Modales */}
            <AnimatePresence>
                {showModal === 'nuevoRol' && (
                    <ModalCrearRol
                        onClose={() => setShowModal(null)}
                        onSuccess={() => { fetchData(); setShowModal(null); showToast('Rol creado correctamente') }}
                        currentUser={currentUser}
                    />
                )}
                {showModal === 'asignarDia' && selectedDate && (
                    <ModalAsignarDia
                        fecha={selectedDate}
                        enfermeros={enfermeros}
                        areas={areas}
                        turnos={turnos}
                        roles={roles}
                        onClose={() => { setShowModal(null); setSelectedDate(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedDate(null); showToast('Asignación guardada') }}
                    />
                )}
            </AnimatePresence>

            {/* Toast */}
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

function ModalCrearRol({ onClose, onSuccess, currentUser }) {
    const [formData, setFormData] = useState({ nombre: '', fechaInicio: '', fechaFin: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('RolEnfermeria').insert([{
                nombre: formData.nombre,
                fechaInicio: formData.fechaInicio,
                fechaFin: formData.fechaFin,
                creadoPor: currentUser?.ID
            }])
            if (error) throw error
            onSuccess()
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Crear Rol de Enfermería</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Rol *</label>
                        <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Rol Semana 1 Enero" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio *</label>
                            <input type="date" required value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin *</label>
                            <input type="date" required value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Creando...' : 'Crear Rol'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalAsignarDia({ fecha, enfermeros, areas, turnos, roles, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ idEnfermero: '', idArea: '', idTurno: '', idRol: roles[0]?.id || '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('DetalleRol').insert([{
                idRol: parseInt(formData.idRol),
                idEnfermero: parseInt(formData.idEnfermero),
                idTurno: parseInt(formData.idTurno),
                idArea: parseInt(formData.idArea),
                fecha: fecha.toISOString().split('T')[0]
            }])
            if (error) throw error
            onSuccess()
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Asignar Turno</h2>
                        <p className="text-sm text-gray-500">{fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol *</label>
                        <select required value={formData.idRol} onChange={(e) => setFormData({ ...formData, idRol: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enfermero *</label>
                        <select required value={formData.idEnfermero} onChange={(e) => setFormData({ ...formData, idEnfermero: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {enfermeros.map(e => <option key={e.ID} value={e.ID}>{e.nombre} {e.apellidoPaterno}</option>)}
                        </select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turno *</label>
                        <select required value={formData.idTurno} onChange={(e) => setFormData({ ...formData, idTurno: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {turnos.map(t => <option key={t.ID} value={t.ID}>{t.Nombre}</option>)}
                        </select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área *</label>
                        <select required value={formData.idArea} onChange={(e) => setFormData({ ...formData, idArea: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {areas.map(a => <option key={a.ID} value={a.ID}>{a.Nombre}</option>)}
                        </select></div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Asignar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

export default RolPage
