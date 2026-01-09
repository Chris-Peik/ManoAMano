import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, ChevronLeft, ChevronRight, X, Check, AlertCircle, Trash2, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const COLORES_ROL = [
    { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', hover: 'hover:bg-blue-600' },
    { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', hover: 'hover:bg-purple-600' },
    { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', hover: 'hover:bg-green-600' },
    { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', hover: 'hover:bg-orange-600' },
    { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', hover: 'hover:bg-pink-600' },
    { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', hover: 'hover:bg-teal-600' },
]

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
    const [toast, setToast] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)
    const [highlightedRolId, setHighlightedRolId] = useState(null)

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (user) setCurrentUser(JSON.parse(user))
        fetchData()
    }, [])

    const canManageRoles = hasPermission(currentUser, PERMISSIONS.CAN_MANAGE_ROLES)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [rolRes, detRes, enfRes, areaRes, turnoRes] = await Promise.all([
                supabase.from('RolEnfermeria').select('*').order('fechaInicio', { ascending: false }),
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
        } catch (error) { console.error('Error:', error) }
        setLoading(false)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const getDiasDelMes = () => {
        const year = fechaActual.getFullYear()
        const month = fechaActual.getMonth()
        const primerDia = new Date(year, month, 1)
        const ultimoDia = new Date(year, month + 1, 0)
        const dias = []
        for (let i = 0; i < primerDia.getDay(); i++) dias.push(null)
        for (let i = 1; i <= ultimoDia.getDate(); i++) dias.push(new Date(year, month, i))
        return dias
    }

    const getRolesEnFecha = (fecha) => {
        if (!fecha) return []
        const fechaStr = fecha.toISOString().split('T')[0]
        return roles.filter(rol => fechaStr >= rol.fechaInicio && fechaStr <= rol.fechaFin)
            .map(rol => ({
                ...rol,
                colorIndex: roles.findIndex(r => r.id === rol.id) % COLORES_ROL.length,
                esInicio: rol.fechaInicio === fechaStr,
                esFin: rol.fechaFin === fechaStr
            }))
    }

    // Obtener enfermeros ÚNICOS asignados a un rol (sin importar fecha)
    const getEnfermerosDelRol = (rolId) => {
        const detallesRol = detalles.filter(d => d.idRol === rolId)
        const enfermerosUnicos = [...new Set(detallesRol.map(d => d.idEnfermero))]
        return enfermerosUnicos.map(enfId => {
            const primerDetalle = detallesRol.find(d => d.idEnfermero === enfId)
            return {
                enfermero: enfermeros.find(e => e.ID === enfId),
                turno: turnos.find(t => t.ID === primerDetalle?.idTurno),
                area: areas.find(a => a.ID === primerDetalle?.idArea),
                detalleId: primerDetalle?.id
            }
        }).filter(e => e.enfermero)
    }

    const getColorRol = (index) => COLORES_ROL[index % COLORES_ROL.length]

    const mesAnterior = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1))
    const mesSiguiente = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1))

    const handleBarClick = (e, rol) => {
        e.stopPropagation()
        setSelectedRol(rol)
        setShowModal('verRol')
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rol de Enfermería</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Calendario de turnos y asignaciones</p>
                </div>
                {canManageRoles && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('nuevoRol')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                        <Plus size={20} /> Crear Rol
                    </motion.button>
                )}
            </div>

            {/* Leyenda de roles */}
            <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">ROLES (click para ver/asignar enfermeros)</h2>
                <div className="flex flex-wrap gap-2">
                    {roles.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay roles creados</p>
                    ) : (
                        roles.map((rol, index) => {
                            const color = getColorRol(index)
                            const numEnfermeros = getEnfermerosDelRol(rol.id).length
                            const isHighlighted = highlightedRolId === rol.id
                            return (
                                <motion.button key={rol.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    animate={isHighlighted ? { scale: [1, 1.1, 1], boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)" } : {}}
                                    onClick={() => { setSelectedRol(rol); setShowModal('verRol') }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color.light} ${color.border} border hover:shadow-md transition-all`}>
                                    <div className={`w-3 h-3 rounded ${color.bg}`} />
                                    <span className={`text-sm font-medium ${color.text}`}>{rol.nombre}</span>
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Users size={12} /> {numEnfermeros}
                                    </span>
                                </motion.button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Enfermeros (Cards) */}
            <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">PERSONAL DE ENFERMERÍA</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {(() => {
                        // Procesar enfermeros para determinar su asignación
                        const enfermerosConEstado = enfermeros.map(enf => {
                            // Buscar si tiene alguna asignación
                            // Usamos asignación a CUALQUIER rol cargado. 
                            // Podríamos refinar esto para buscar solo roles "activos" si fuera necesario.
                            const detalle = detalles.find(d => d.idEnfermero === enf.ID)
                            const rolAsignado = detalle ? roles.find(r => r.id === detalle.idRol) : null
                            return { ...enf, rolAsignado }
                        }).sort((a, b) => {
                            // Priorizar NO asignados (rolAsignado es null)
                            if (!a.rolAsignado && b.rolAsignado) return -1
                            if (a.rolAsignado && !b.rolAsignado) return 1
                            return 0
                        })

                        return enfermerosConEstado.map(enf => {
                            const rol = enf.rolAsignado
                            const colorIndex = rol ? roles.findIndex(r => r.id === rol.id) : -1
                            const color = rol ? getColorRol(colorIndex) : null

                            return (
                                <motion.div key={enf.ID}
                                    whileHover={{ scale: 1.03 }}
                                    onClick={() => {
                                        if (rol) {
                                            setHighlightedRolId(rol.id)
                                            setTimeout(() => setHighlightedRolId(null), 1500)
                                            // Opcional: scroll al calendario
                                        }
                                    }}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden group ${rol
                                        ? `${color.light} ${color.border}`
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}>
                                    {/* Indicador de estado */}
                                    <div className={`absolute top-0 right-0 p-1.5 rounded-bl-lg ${rol ? color.bg : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${rol ? 'bg-white' : 'bg-gray-400'}`} />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${rol ? 'bg-white/50' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                            }`}>
                                            {enf.nombre?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${rol ? color.text : 'text-gray-800 dark:text-white'}`}>
                                                {enf.nombre}
                                            </p>
                                            <p className={`text-xs truncate ${rol ? 'text-gray-600' : 'text-gray-500'}`}>
                                                {rol ? rol.nombre : 'No asignado'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    })()}
                </div>
            </div>

            {/* Calendario */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    {DIAS_SEMANA.map(dia => (
                        <div key={dia} className="p-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{dia}</div>
                    ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7">
                    {getDiasDelMes().map((dia, index) => {
                        const rolesEnDia = getRolesEnFecha(dia)
                        const esHoy = dia && dia.toDateString() === new Date().toDateString()

                        return (
                            <div key={index}
                                className={`min-h-[90px] border-b border-r border-gray-100 dark:border-gray-700 flex flex-col ${!dia && 'bg-gray-50/50 dark:bg-gray-800/50'
                                    }`}>

                                {dia && (
                                    <>
                                        {/* Número del día */}
                                        <div className="p-1">
                                            <span className={`text-xs font-medium inline-flex items-center justify-center ${esHoy ? 'text-white bg-blue-600 rounded-full w-5 h-5' : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {dia.getDate()}
                                            </span>
                                        </div>

                                        {/* Barras de roles - clickeables */}
                                        <div className="flex-1 px-0.5 space-y-0.5 overflow-hidden">
                                            {rolesEnDia.slice(0, 3).map((rol) => {
                                                const color = getColorRol(rol.colorIndex)
                                                const numEnf = getEnfermerosDelRol(rol.id).length
                                                const isHighlighted = highlightedRolId === rol.id
                                                const isDimmed = highlightedRolId && !isHighlighted

                                                return (
                                                    <button key={rol.id}
                                                        onClick={(e) => handleBarClick(e, rol)}
                                                        className={`w-full text-left px-1.5 py-0.5 text-[10px] font-medium text-white truncate transition-all ${color.bg} ${color.hover} 
                                                            ${isHighlighted ? 'ring-2 ring-blue-400 ring-offset-1 z-10 scale-[1.05] shadow-lg brightness-110' : ''}
                                                            ${isDimmed ? 'opacity-40 grayscale-[0.5]' : ''}
                                                            ${rol.esInicio && rol.esFin ? 'rounded mx-0.5' :
                                                                rol.esInicio ? 'rounded-l ml-0.5' :
                                                                    rol.esFin ? 'rounded-r mr-0.5' : ''
                                                            }`}>
                                                        {rol.esInicio ? `${rol.nombre} (${numEnf})` : `${numEnf} enf.`}
                                                    </button>
                                                )
                                            })}
                                            {rolesEnDia.length > 3 && (
                                                <div className="text-[10px] text-gray-400 px-1">+{rolesEnDia.length - 3}</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Info */}
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Click en cualquier barra o en los botones de arriba para ver/asignar enfermeros al rol completo
            </p>

            {/* Modales */}
            <AnimatePresence>
                {showModal === 'nuevoRol' && (
                    <ModalCrearRol onClose={() => setShowModal(null)} currentUser={currentUser}
                        onSuccess={() => { fetchData(); setShowModal(null); showToast('Rol creado') }} />
                )}
                {showModal === 'verRol' && selectedRol && (
                    <ModalVerRol rol={selectedRol} enfermeros={enfermeros} areas={areas} turnos={turnos}
                        asignados={getEnfermerosDelRol(selectedRol.id)}
                        colorIndex={roles.findIndex(r => r.id === selectedRol.id)}
                        canEdit={canManageRoles}
                        onClose={() => { setShowModal(null); setSelectedRol(null) }}
                        onAddEnfermero={() => setShowModal('asignarEnfermero')}
                        onRefresh={fetchData} showToast={showToast} />
                )}
                {showModal === 'asignarEnfermero' && selectedRol && (
                    <ModalAsignarEnfermero rol={selectedRol} enfermeros={enfermeros} areas={areas} turnos={turnos}
                        yaAsignados={getEnfermerosDelRol(selectedRol.id).map(a => a.enfermero?.ID)}
                        onClose={() => setShowModal('verRol')}
                        onSuccess={() => { fetchData(); setShowModal('verRol'); showToast('Enfermero asignado a todo el rol') }} />
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

function ModalCrearRol({ onClose, onSuccess, currentUser }) {
    const [formData, setFormData] = useState({ nombre: '', fechaInicio: '', fechaFin: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('RolEnfermeria').insert([{
                nombre: formData.nombre, fechaInicio: formData.fechaInicio, fechaFin: formData.fechaFin, creadoPor: currentUser?.ID
            }])
            if (error) throw error
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    // Calcular días del rol
    const calcularDias = () => {
        if (!formData.fechaInicio || !formData.fechaFin) return 0
        const inicio = new Date(formData.fechaInicio)
        const fin = new Date(formData.fechaFin)
        return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Crear Rol</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                        <input type="text" required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Semana 1 Enero" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio *</label>
                            <input type="date" required value={formData.fechaInicio} onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin *</label>
                            <input type="date" required value={formData.fechaFin} onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                    </div>
                    {calcularDias() > 0 && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">Duración: {calcularDias()} días</p>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Creando...' : 'Crear'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalVerRol({ rol, enfermeros, areas, turnos, asignados, colorIndex, canEdit, onClose, onAddEnfermero, onRefresh, showToast }) {
    const color = COLORES_ROL[colorIndex % COLORES_ROL.length]
    const [editMode, setEditMode] = useState(false)
    const [formData, setFormData] = useState({ nombre: rol.nombre, fechaInicio: rol.fechaInicio, fechaFin: rol.fechaFin })
    const [saving, setSaving] = useState(false)

    // Calcular días
    const calcularDias = (inicio, fin) => {
        const i = new Date(inicio)
        const f = new Date(fin)
        return Math.ceil((f - i) / (1000 * 60 * 60 * 24)) + 1
    }
    const numDias = calcularDias(rol.fechaInicio, rol.fechaFin)

    const handleEliminarEnfermero = async (enfermeroId) => {
        if (!confirm('¿Eliminar este enfermero del rol completo?')) return
        try {
            const { error } = await supabase.from('DetalleRol').delete()
                .eq('idRol', rol.id)
                .eq('idEnfermero', enfermeroId)
            if (error) throw error
            onRefresh()
            showToast('Enfermero removido del rol')
        } catch (err) { console.error(err) }
    }

    const handleGuardarCambios = async () => {
        setSaving(true)
        try {
            const { error } = await supabase.from('RolEnfermeria').update({
                nombre: formData.nombre,
                fechaInicio: formData.fechaInicio,
                fechaFin: formData.fechaFin
            }).eq('id', rol.id)
            if (error) throw error
            setEditMode(false)
            onRefresh()
            showToast('Rol actualizado')
        } catch (err) {
            console.error(err)
            showToast('Error al guardar', 'error')
        }
        setSaving(false)
    }

    const handleEliminarRol = async () => {
        if (!confirm(`¿Eliminar el rol "${rol.nombre}" y todas sus asignaciones?`)) return
        try {
            // Primero eliminar detalles
            await supabase.from('DetalleRol').delete().eq('idRol', rol.id)
            // Luego el rol
            const { error } = await supabase.from('RolEnfermeria').delete().eq('id', rol.id)
            if (error) throw error
            onClose()
            onRefresh()
            showToast('Rol eliminado')
        } catch (err) {
            console.error(err)
            showToast('Error al eliminar', 'error')
        }
    }

    const handleCancelarEdicion = () => {
        setFormData({ nombre: rol.nombre, fechaInicio: rol.fechaInicio, fechaFin: rol.fechaFin })
        setEditMode(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                {/* Header */}
                <div className={`p-6 ${color.bg} rounded-t-xl`}>
                    <div className="flex items-center justify-between">
                        {editMode ? (
                            <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="text-xl font-bold bg-white/20 text-white placeholder-white/60 px-2 py-1 rounded border border-white/30 w-full mr-2" />
                        ) : (
                            <div>
                                <h2 className="text-xl font-bold text-white">{rol.nombre}</h2>
                                <p className="text-white/80 text-sm mt-1">{numDias} días: {rol.fechaInicio} → {rol.fechaFin}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            {canEdit && !editMode && (
                                <button onClick={() => setEditMode(true)} className="p-2 hover:bg-white/20 rounded-lg text-white text-xs font-medium">
                                    Editar
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg text-white"><X size={20} /></button>
                        </div>
                    </div>

                    {/* Fechas editables */}
                    {editMode && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-white/70 text-xs">Inicio</label>
                                <input type="date" value={formData.fechaInicio} onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                                    className="w-full px-2 py-1 bg-white/20 text-white rounded border border-white/30 text-sm" />
                            </div>
                            <div>
                                <label className="text-white/70 text-xs">Fin</label>
                                <input type="date" value={formData.fechaFin} onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                                    className="w-full px-2 py-1 bg-white/20 text-white rounded border border-white/30 text-sm" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Botones de edición */}
                {editMode && (
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <button onClick={handleEliminarRol} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                            <Trash2 size={14} /> Eliminar rol
                        </button>
                        <div className="flex gap-2">
                            <button onClick={handleCancelarEdicion} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button onClick={handleGuardarCambios} disabled={saving} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg disabled:opacity-50">
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <Users size={18} /> Enfermeros asignados ({asignados.length})
                        </h3>
                        {canEdit && !editMode && (
                            <button onClick={onAddEnfermero} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                <Plus size={16} /> Agregar
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 mb-4">Los enfermeros asignados trabajan todos los días del rol</p>

                    {asignados.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Sin enfermeros asignados</p>
                            {canEdit && <p className="text-xs mt-1">Click en "Agregar" para asignar</p>}
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {asignados.map(({ enfermero, turno, area }) => {
                                const turnoColor = turno?.Nombre?.toLowerCase().includes('mañana') ? 'bg-yellow-100 text-yellow-800' :
                                    turno?.Nombre?.toLowerCase().includes('tarde') ? 'bg-orange-100 text-orange-800' :
                                        turno?.Nombre?.toLowerCase().includes('noche') ? 'bg-indigo-100 text-indigo-800' :
                                            'bg-gray-100 text-gray-800'

                                return (
                                    <div key={enfermero.ID} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-medium">
                                                {enfermero.nombre?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white text-sm">{enfermero.nombre} {enfermero.apellidoPaterno}</p>
                                                <p className="text-xs text-gray-500">{area?.Nombre}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${turnoColor}`}>{turno?.Nombre}</span>
                                            {canEdit && !editMode && (
                                                <button onClick={() => handleEliminarEnfermero(enfermero.ID)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg">Cerrar</button>
                </div>
            </motion.div>
        </motion.div>
    )
}

function ModalAsignarEnfermero({ rol, enfermeros, areas, turnos, yaAsignados, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ idEnfermero: '', idArea: '', idTurno: '' })
    const [loading, setLoading] = useState(false)

    // Enfermeros disponibles (no ya asignados)
    const enfermerosDisponibles = enfermeros.filter(e => !yaAsignados.includes(e.ID))

    // Generar todas las fechas del rango del rol
    const generarFechasDelRol = () => {
        const fechas = []
        const inicio = new Date(rol.fechaInicio)
        const fin = new Date(rol.fechaFin)
        const actual = new Date(inicio)

        while (actual <= fin) {
            fechas.push(actual.toISOString().split('T')[0])
            actual.setDate(actual.getDate() + 1)
        }
        return fechas
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const fechas = generarFechasDelRol()

            // Crear un registro para CADA día del rol
            const registros = fechas.map(fecha => ({
                idRol: rol.id,
                idEnfermero: parseInt(formData.idEnfermero),
                idTurno: parseInt(formData.idTurno),
                idArea: parseInt(formData.idArea),
                fecha: fecha
            }))

            const { error } = await supabase.from('DetalleRol').insert(registros)
            if (error) throw error
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const numDias = generarFechasDelRol().length

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-800 dark:text-white">Asignar a {rol.nombre}</h2>
                    <p className="text-xs text-gray-500 mt-1">Se asignará a los {numDias} días del rol</p>
                </div>

                {enfermerosDisponibles.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        <p>Todos los enfermeros ya están asignados</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enfermero *</label>
                            <select required value={formData.idEnfermero} onChange={e => setFormData({ ...formData, idEnfermero: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                                <option value="">Seleccionar...</option>
                                {enfermerosDisponibles.map(e => <option key={e.ID} value={e.ID}>{e.nombre} {e.apellidoPaterno}</option>)}
                            </select></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turno *</label>
                                <select required value={formData.idTurno} onChange={e => setFormData({ ...formData, idTurno: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                                    <option value="">-</option>
                                    {turnos.map(t => <option key={t.ID} value={t.ID}>{t.Nombre}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área *</label>
                                <select required value={formData.idArea} onChange={e => setFormData({ ...formData, idArea: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                                    <option value="">-</option>
                                    {areas.map(a => <option key={a.ID} value={a.ID}>{a.Nombre}</option>)}
                                </select></div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                                {loading ? 'Asignando...' : `Asignar (${numDias} días)`}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </motion.div>
    )
}

export default RolPage
