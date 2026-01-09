import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bed, User, FileText, X, Check, AlertCircle, Activity, UserPlus, Edit, Trash2, Heart, Pill, Stethoscope, ClipboardList, Save, ChevronDown, ChevronUp, Plus, MapPin, LogIn, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Niveles de Triage con colores
const TRIAGE_LEVELS = [
    { id: 1, nombre: 'Resucitación', color: 'bg-red-500', textColor: 'text-white', borderColor: 'border-red-500', bgLight: 'bg-red-100 text-red-700' },
    { id: 2, nombre: 'Emergencia', color: 'bg-orange-500', textColor: 'text-white', borderColor: 'border-orange-500', bgLight: 'bg-orange-100 text-orange-700' },
    { id: 3, nombre: 'Urgencia', color: 'bg-yellow-400', textColor: 'text-gray-900', borderColor: 'border-yellow-400', bgLight: 'bg-yellow-100 text-yellow-700' },
    { id: 4, nombre: 'Urgencia Menor', color: 'bg-green-500', textColor: 'text-white', borderColor: 'border-green-500', bgLight: 'bg-green-100 text-green-700' },
    { id: 5, nombre: 'Sin Urgencia', color: 'bg-blue-500', textColor: 'text-white', borderColor: 'border-blue-500', bgLight: 'bg-blue-100 text-blue-700' },
]

function PacientesPage() {
    const [pacientes, setPacientes] = useState([])
    const [triajes, setTriajes] = useState([])
    const [camas, setCamas] = useState([])
    const [pisos, setPisos] = useState([])
    const [habitaciones, setHabitaciones] = useState([])
    const [registrosEnfermeria, setRegistrosEnfermeria] = useState([])
    const [signosVitalesAll, setSignosVitalesAll] = useState([])
    const [enfermeros, setEnfermeros] = useState([])
    const [roles, setRoles] = useState([])
    const [detallesRol, setDetallesRol] = useState([])
    const [areas, setAreas] = useState([])
    const [turnos, setTurnos] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(null)
    const [selectedPaciente, setSelectedPaciente] = useState(null)
    const [selectedPiso, setSelectedPiso] = useState('')
    const [tabActiva, setTabActiva] = useState('activos') // activos | inactivos | todos
    const [toast, setToast] = useState(null)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [pacRes, triRes, camaRes, pisoRes, habRes, regRes, signosRes, enfRes, rolRes, detRes, areaRes, turnoRes] = await Promise.all([
                supabase.from('Paciente').select('*'),
                supabase.from('Triaje').select('*'),
                supabase.from('Cama').select('*'),
                supabase.from('Piso').select('*'),
                supabase.from('Habitación').select('*'),
                supabase.from('Registro_Enfermeria').select('*'),
                supabase.from('Signos_Vitales').select('*'),
                supabase.from('Enfermero').select('*'),
                supabase.from('RolEnfermeria').select('*'),
                supabase.from('DetalleRol').select('*'),
                supabase.from('Área').select('*'),
                supabase.from('Turno').select('*')
            ])
            if (pacRes.data) setPacientes(pacRes.data)
            if (triRes.data) setTriajes(triRes.data)
            if (camaRes.data) setCamas(camaRes.data)
            if (pisoRes.data) setPisos(pisoRes.data)
            if (habRes.data) setHabitaciones(habRes.data)
            if (regRes.data) setRegistrosEnfermeria(regRes.data)
            if (signosRes.data) setSignosVitalesAll(signosRes.data)
            if (enfRes.data) setEnfermeros(enfRes.data)
            if (rolRes.data) setRoles(rolRes.data)
            if (detRes.data) setDetallesRol(detRes.data)
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

    const handleUpdateEnfermero = async (registroId, nuevoEnfermeroId) => {
        try {
            const { error } = await supabase
                .from('Registro_Enfermeria')
                .update({ idEnfermero: nuevoEnfermeroId || null })
                .eq('ID', registroId)

            if (error) throw error

            setRegistrosEnfermeria(prev => prev.map(r =>
                r.ID === registroId ? { ...r, idEnfermero: nuevoEnfermeroId ? parseInt(nuevoEnfermeroId) : null } : r
            ))
            showToast('Enfermero asignado actualizado correctmente')
        } catch (error) {
            console.error('Error al actualizar enfermero:', error)
            showToast('Error al actualizar asignación', 'error')
        }
    }

    const getPacientesPorPiso = () => {
        if (!selectedPiso) return []
        const habsPiso = habitaciones.filter(h => h.ID_Piso === parseInt(selectedPiso))
        const camasPiso = camas.filter(c => habsPiso.some(h => h.ID === c.idHabitacion))
        return camasPiso.map(cama => {
            const hab = habitaciones.find(h => h.ID === cama.idHabitacion)
            const paciente = pacientes.find(p => p.ID === cama.idPaciente)
            return { cama, habitacion: hab, paciente }
        })
    }

    // Helper: obtener registro de ingreso activo de un paciente (registro con activo=true)
    const getIngresoActivo = (pacienteId) => {
        return registrosEnfermeria.find(r => r.idPaciente === pacienteId && r.activo)
    }

    // Helper: obtener el triage de un registro
    const getTriageInfo = (triageId) => {
        const triaje = triajes.find(t => t.ID === triageId)
        const triageLevel = TRIAGE_LEVELS.find(t => t.id === triageId) || TRIAGE_LEVELS.find(t => t.nombre === triaje?.Descripcion)
        return { triaje, triageLevel }
    }

    // Filtrar pacientes por búsqueda - separados en activos e inactivos
    const pacientesActivos = pacientes.filter(p => {
        const matchSearch = `${p.Nombre} ${p.A_Paterno} ${p.A_Materno}`.toLowerCase().includes(searchTerm.toLowerCase())
        const ingresoActivo = getIngresoActivo(p.ID)
        return matchSearch && ingresoActivo
    })

    const pacientesInactivos = pacientes.filter(p => {
        const matchSearch = `${p.Nombre} ${p.A_Paterno} ${p.A_Materno}`.toLowerCase().includes(searchTerm.toLowerCase())
        const ingresoActivo = getIngresoActivo(p.ID)
        return matchSearch && !ingresoActivo
    })

    const calcularEdad = (fechaNac) => {
        if (!fechaNac) return '-'
        return Math.floor((new Date() - new Date(fechaNac)) / (365.25 * 24 * 60 * 60 * 1000))
    }

    // Contadores para tabs
    const countActivos = pacientes.filter(p => getIngresoActivo(p.ID)).length
    const countInactivos = pacientes.filter(p => !getIngresoActivo(p.ID)).length

    // Mis pacientes (Enfermero actual)
    const misPacientes = pacientesActivos.filter(p => {
        const ingreso = getIngresoActivo(p.ID)
        return ingreso?.idEnfermero === currentUser.ID
    })

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Pacientes</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Ver pacientes, registros de enfermería y expedientes</p>
                </div>
                <div className="flex gap-2">
                    {hasPermission(currentUser, PERMISSIONS.CAN_ADD_PATIENT) && (
                        <>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setSelectedPaciente(null); setShowModal('nuevoIngreso') }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                                <LogIn size={20} /> Nuevo Ingreso
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('nuevoPaciente')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                                <UserPlus size={20} /> Nuevo Paciente
                            </motion.button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs de estado */}
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
                {[
                    { key: 'activos', label: 'Activos', count: countActivos, color: 'green' },
                    { key: 'inactivos', label: 'Dados de Alta', count: countInactivos, color: 'gray' },
                    { key: 'todos', label: 'Todos', count: pacientes.length, color: 'blue' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setTabActiva(tab.key)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tabActiva === tab.key
                            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}>
                        {tab.label}
                        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${tabActiva === tab.key
                            ? tab.color === 'green' ? 'bg-green-100 text-green-600' : tab.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                            }`}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por Piso</label>
                    <select value={selectedPiso} onChange={(e) => setSelectedPiso(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white">
                        <option value="">Todos los pisos</option>
                        {pisos.map(p => <option key={p.ID} value={p.ID}>Piso {p.Número}</option>)}
                    </select>
                </div>
                <div className="relative flex-1 min-w-[250px]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar paciente</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder="Nombre del paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                </div>
            </div>

            {/* Vista de camas por piso */}
            {selectedPiso && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Camas - Piso {pisos.find(p => p.ID === parseInt(selectedPiso))?.Número}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {getPacientesPorPiso().map(({ cama, habitacion, paciente }) => (
                            <motion.div key={cama.ID} whileHover={{ scale: 1.02 }}
                                onClick={() => paciente && (setSelectedPaciente(paciente), setShowModal('verPaciente'))}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${paciente
                                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                                    }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500">Hab. {habitacion?.Número}</span>
                                    <Bed size={16} className={paciente ? 'text-green-600' : 'text-gray-400'} />
                                </div>
                                <p className="font-semibold text-gray-800 dark:text-white">Cama {cama.numero}</p>
                                {paciente ? (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{paciente.Nombre} {paciente.A_Paterno}</p>
                                ) : (
                                    <p className="text-sm text-gray-400 mt-1">Disponible</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tus Pacientes Section */}
            {(tabActiva === 'activos' || tabActiva === 'todos') && misPacientes.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Heart className="text-red-500" size={20} /> Tus Pacientes Asignados
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {misPacientes.map(pac => {
                            const ingreso = getIngresoActivo(pac.ID)
                            const triageLevel = TRIAGE_LEVELS.find(t => t.id === ingreso.idTriaje)
                            return (
                                <motion.div key={pac.ID} whileHover={{ scale: 1.02 }}
                                    onClick={() => { setSelectedPaciente(pac); setShowModal('verPaciente') }}
                                    className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 rounded-xl cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">
                                                {pac.Nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-white text-sm">{pac.Nombre} {pac.A_Paterno}</p>
                                            </div>
                                        </div>
                                        {triageLevel && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${triageLevel.color}`}>
                                                {triageLevel.nombre}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <button className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 shadow-sm">
                                            <ClipboardList size={14} /> Registros
                                        </button>
                                        <button className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 shadow-sm">
                                            <Activity size={14} /> Signos
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Tabla de Pacientes Activos */}
            {(tabActiva === 'activos' || tabActiva === 'todos') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <h2 className="font-semibold text-gray-800 dark:text-white">Pacientes Activos ({pacientesActivos.length})</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Triage</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sexo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Edad</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enfermero Asignado</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Alertas</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
                                ) : pacientesActivos.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No hay pacientes activos</td></tr>
                                ) : (
                                    pacientesActivos.map((pac, i) => (
                                        <motion.tr key={pac.ID} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                            onClick={() => { setSelectedPaciente(pac); setShowModal('verPaciente') }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 font-semibold">
                                                        {pac.Nombre?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-white">{pac.Nombre} {pac.A_Paterno}</p>
                                                        <p className="text-xs text-gray-500">{pac.A_Materno}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const ingreso = getIngresoActivo(pac.ID)
                                                    if (!ingreso) return <span className="text-gray-400 text-xs">-</span>
                                                    const triageLevel = TRIAGE_LEVELS.find(t => t.id === ingreso.idTriaje)
                                                    if (!triageLevel) return <span className="text-gray-400 text-xs">-</span>
                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full font-medium ${triageLevel.color} ${triageLevel.textColor}`}>
                                                            <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                                                            {triageLevel.nombre}
                                                        </span>
                                                    )
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${pac.Sexo === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                    {pac.Sexo === 'M' ? 'M' : 'F'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{calcularEdad(pac.F_nacimiento)} años</td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                {(() => {
                                                    const ingreso = getIngresoActivo(pac.ID)
                                                    const enfermero = enfermeros.find(e => e.ID === ingreso?.idEnfermero)
                                                    const canEdit = hasPermission(currentUser, PERMISSIONS.CAN_MANAGE_ROLES)

                                                    if (canEdit && ingreso) {
                                                        return (
                                                            <select
                                                                value={ingreso.idEnfermero || ''}
                                                                onChange={(e) => handleUpdateEnfermero(ingreso.ID, e.target.value)}
                                                                className="text-sm px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            >
                                                                <option value="">Sin asignar</option>
                                                                {enfermeros.map(enf => (
                                                                    <option key={enf.ID} value={enf.ID}>
                                                                        {enf.nombre} {enf.apellidoPaterno}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )
                                                    }

                                                    return enfermero ? (
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                            {enfermero.nombre} {enfermero.apellidoPaterno}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Sin asignar</span>
                                                    )
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const camaAsignada = camas.find(c => c.idPaciente === pac.ID)
                                                    const registrosPaciente = registrosEnfermeria.filter(r => r.idPaciente === pac.ID)
                                                    const regIds = registrosPaciente.map(r => r.ID)
                                                    const tieneSignos = signosVitalesAll.some(s => regIds.includes(s.idRegistro))
                                                    const tieneDiagnostico = registrosPaciente.some(r => r.idDiagnostico)

                                                    const alerts = []
                                                    if (!camaAsignada) alerts.push({ icon: Bed, label: 'Sin Cama', color: 'text-orange-500', bg: 'bg-orange-50' })
                                                    if (!tieneSignos) alerts.push({ icon: Activity, label: 'Sin Signos', color: 'text-blue-500', bg: 'bg-blue-50' })
                                                    if (!tieneDiagnostico) alerts.push({ icon: Stethoscope, label: 'Sin Dx', color: 'text-red-500', bg: 'bg-red-50' })

                                                    if (alerts.length === 0) {
                                                        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700"><Check size={12} /> OK</span>
                                                    }
                                                    return (
                                                        <div className="flex flex-wrap gap-1">
                                                            {alerts.map((alert, idx) => (
                                                                <span key={idx} className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${alert.bg} ${alert.color}`} title={alert.label}>
                                                                    <alert.icon size={12} />
                                                                    {alert.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); setSelectedPaciente(pac); setShowModal('verPaciente') }}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium">
                                                    Ver Expediente
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tabla de Pacientes Inactivos (Dados de Alta) */}
            {(tabActiva === 'inactivos' || tabActiva === 'todos') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <h2 className="font-semibold text-gray-800 dark:text-white">Dados de Alta / Sin Ingreso ({pacientesInactivos.length})</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Identificación</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sexo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Edad</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha Nacimiento</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
                                ) : pacientesInactivos.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No hay pacientes inactivos</td></tr>
                                ) : (
                                    pacientesInactivos.map((pac, i) => (
                                        <motion.tr key={pac.ID} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                            onClick={() => { setSelectedPaciente(pac); setShowModal('verPaciente') }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-semibold">
                                                        {pac.Nombre?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-white">{pac.Nombre} {pac.A_Paterno}</p>
                                                        <p className="text-xs text-gray-500">{pac.A_Materno}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{pac.Identificación || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${pac.Sexo === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                    {pac.Sexo === 'M' ? 'Masculino' : 'Femenino'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{calcularEdad(pac.F_nacimiento)} años</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{pac.F_nacimiento ? new Date(pac.F_nacimiento).toLocaleDateString() : '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); setSelectedPaciente(pac); setShowModal('verPaciente') }}
                                                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg font-medium">
                                                        Ver Historial
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); setSelectedPaciente(pac); setShowModal('nuevoIngreso') }}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium">
                                                        <LogIn size={14} className="inline mr-1" /> Ingresar
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modales */}
            <AnimatePresence>
                {showModal === 'verPaciente' && selectedPaciente && (
                    <ModalExpedientePaciente paciente={selectedPaciente} onClose={() => { setShowModal(null); setSelectedPaciente(null) }}
                        onRefresh={fetchData} showToast={showToast} currentUser={currentUser} />
                )}
                {showModal === 'nuevoPaciente' && (
                    <ModalNuevoPaciente onClose={() => setShowModal(null)}
                        onSuccess={() => { fetchData(); setShowModal(null); showToast('Paciente registrado') }} />
                )}
                {showModal === 'nuevoIngreso' && (
                    <ModalNuevoIngreso
                        pacientes={pacientes}
                        registros={registrosEnfermeria}
                        enfermeros={enfermeros}
                        roles={roles}
                        detallesRol={detallesRol}
                        areas={areas}
                        turnos={turnos}
                        pacientePreseleccionado={selectedPaciente}
                        onClose={() => { setShowModal(null); setSelectedPaciente(null); }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedPaciente(null); showToast('Ingreso registrado'); }} />
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white z-50`}>
                        {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Modal grande de expediente del paciente
function ModalExpedientePaciente({ paciente, onClose, onRefresh, showToast, currentUser }) {
    const [editMode, setEditMode] = useState(false)
    const [formData, setFormData] = useState({ ...paciente })
    const [saving, setSaving] = useState(false)
    const [registros, setRegistros] = useState([])
    const [signosVitales, setSignosVitales] = useState([])
    const [medicamentos, setMedicamentos] = useState([])
    const [diagnosticos, setDiagnosticos] = useState([])
    const [camaAsignada, setCamaAsignada] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState('info')
    const [showAddModal, setShowAddModal] = useState(null)
    const [catalogoMedicamentos, setCatalogoMedicamentos] = useState([])
    const [catalogoPadecimientos, setCatalogoPadecimientos] = useState([])

    useEffect(() => {
        fetchExpediente()
    }, [paciente.ID])

    const fetchExpediente = async () => {
        setLoading(true)
        try {
            // Registros de enfermería
            const { data: regs } = await supabase.from('Registro_Enfermeria').select('*').eq('idPaciente', paciente.ID).order('fecha', { ascending: false })
            setRegistros(regs || [])

            // Signos vitales - ahora desde Signos_Vitales.idRegistro
            if (regs && regs.length > 0) {
                const regIds = regs.map(r => r.ID)
                const { data: signos } = await supabase.from('Signos_Vitales').select('*').in('idRegistro', regIds)
                setSignosVitales(signos || [])

                // Diagnósticos - desde Registro_Enfermeria.idDiagnostico
                const diagIds = regs.map(r => r.idDiagnostico).filter(Boolean)
                if (diagIds.length > 0) {
                    const { data: diags } = await supabase.from('Diagnostico').select('*').in('ID', diagIds)
                    if (diags && diags.length > 0) {
                        const padIds = [...new Set(diags.map(d => d.ID_Padecimiento))]
                        const cuidIds = [...new Set(diags.map(d => d.ID_Cuidados))]
                        const [{ data: pads }, { data: cuids }] = await Promise.all([
                            supabase.from('Padecimiento').select('*').in('ID', padIds),
                            supabase.from('Cuidados').select('*').in('ID', cuidIds)
                        ])
                        setDiagnosticos(diags.map(d => ({
                            ...d,
                            padecimiento: pads?.find(p => p.ID === d.ID_Padecimiento),
                            cuidados: cuids?.find(c => c.ID === d.ID_Cuidados)
                        })))
                    }
                }

                // Medicamentos administrados - ahora desde Administracion_Medicamento.idRegistro
                const { data: adminMeds } = await supabase.from('Administracion_Medicamento').select('*').in('idRegistro', regIds).order('Fecha_hora', { ascending: false })
                if (adminMeds && adminMeds.length > 0) {
                    const movIds = adminMeds.map(m => m.idMovimientoInventario).filter(Boolean)
                    let movimientos = []
                    if (movIds.length > 0) {
                        const { data: movData } = await supabase.from('MovimientoInventario').select('*').in('id', movIds)
                        movimientos = movData || []
                    }
                    const medIdsUnicos = [...new Set(adminMeds.map(m => m.Medicamento_ID))]
                    const { data: meds } = await supabase.from('Medicamento').select('*').in('ID', medIdsUnicos)

                    setMedicamentos(adminMeds.map(am => ({
                        ...am,
                        medicamento: meds?.find(m => m.ID === am.Medicamento_ID),
                        movimiento: movimientos.find(mov => mov.id === am.idMovimientoInventario)
                    })))
                } else {
                    setMedicamentos([])
                }
            } else {
                setMedicamentos([])
            }

            // Cargar catálogos para los modales de agregar y cama asignada
            const [{ data: medsData }, { data: padsData }, { data: camaData }] = await Promise.all([
                supabase.from('Medicamento').select('*'),
                supabase.from('Padecimiento').select('*'),
                supabase.from('Cama').select('*').eq('idPaciente', paciente.ID).single()
            ])
            setCatalogoMedicamentos(medsData || [])
            setCatalogoPadecimientos(padsData || [])
            setCamaAsignada(camaData || null)
        } catch (err) {
            console.error('Error cargando expediente:', err)
        }
        setLoading(false)
    }

    const handleGuardar = async () => {
        setSaving(true)
        try {
            const { error } = await supabase.from('Paciente').update({
                Nombre: formData.Nombre,
                A_Paterno: formData.A_Paterno,
                A_Materno: formData.A_Materno,
                F_nacimiento: formData.F_nacimiento,
                Sexo: formData.Sexo,
                Identificación: formData.Identificación,
                Peso: formData.Peso,
                Altura: formData.Altura
            }).eq('ID', paciente.ID)
            if (error) throw error
            setEditMode(false)
            onRefresh()
            showToast('Paciente actualizado')
        } catch (err) {
            console.error(err)
            showToast('Error al guardar', 'error')
        }
        setSaving(false)
    }

    const handleEliminar = async () => {
        if (!confirm(`¿Eliminar al paciente ${paciente.Nombre} ${paciente.A_Paterno}? Esta acción no se puede deshacer.`)) return
        try {
            const { error } = await supabase.from('Paciente').delete().eq('ID', paciente.ID)
            if (error) throw error
            onClose()
            onRefresh()
            showToast('Paciente eliminado')
        } catch (err) {
            console.error(err)
            showToast('Error: El paciente tiene registros asociados', 'error')
        }
    }

    const edad = formData.F_nacimiento ? Math.floor((new Date() - new Date(formData.F_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : '-'

    const sections = [
        { id: 'info', label: 'Datos Personales', icon: User },
        { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
        { id: 'signos', label: 'Signos Vitales', icon: Heart },
        { id: 'medicamentos', label: 'Medicamentos', icon: Pill },
        { id: 'diagnosticos', label: 'Diagnósticos', icon: Stethoscope },
        { id: 'registros', label: 'Registros de Enfermería', icon: ClipboardList }
    ]

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
                className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                                {paciente.Nombre?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{paciente.Nombre} {paciente.A_Paterno} {paciente.A_Materno}</h2>
                                <p className="text-blue-100 mt-1">{edad} años • {paciente.Sexo === 'M' ? 'Masculino' : 'Femenino'} • ID: {paciente.Identificación}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!editMode && (
                                <>
                                    {hasPermission(currentUser, PERMISSIONS.CAN_EDIT_PATIENT) && (
                                        <button onClick={() => setEditMode(true)} className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Editar">
                                            <Edit size={20} />
                                        </button>
                                    )}
                                    {hasPermission(currentUser, PERMISSIONS.CAN_DELETE_PATIENT) && (
                                        <button onClick={handleEliminar} className="p-2 hover:bg-red-500/50 rounded-lg transition-colors" title="Eliminar">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navegación de secciones */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto">
                    {sections.map(section => {
                        // Determinar si la sección necesita alerta
                        const needsAlert =
                            (section.id === 'ubicacion' && !camaAsignada) ||
                            (section.id === 'signos' && signosVitales.length === 0) ||
                            (section.id === 'diagnosticos' && diagnosticos.length === 0) ||
                            (section.id === 'registros' && registros.length === 0)

                        return (
                            <button key={section.id} onClick={() => setActiveSection(section.id)}
                                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeSection === section.id
                                    ? 'border-blue-600 text-blue-600 bg-white dark:bg-gray-800'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}>
                                <section.icon size={18} />
                                {section.label}
                                {needsAlert && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse" title="Sin registros">
                                        !
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <>
                            {/* Datos Personales */}
                            {activeSection === 'info' && (
                                <div className="space-y-6">
                                    {editMode ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                                                <input type="text" value={formData.Nombre} onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido Paterno *</label>
                                                <input type="text" value={formData.A_Paterno} onChange={(e) => setFormData({ ...formData, A_Paterno: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido Materno</label>
                                                <input type="text" value={formData.A_Materno || ''} onChange={(e) => setFormData({ ...formData, A_Materno: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Nacimiento *</label>
                                                <input type="date" value={formData.F_nacimiento} onChange={(e) => setFormData({ ...formData, F_nacimiento: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo *</label>
                                                <select value={formData.Sexo} onChange={(e) => setFormData({ ...formData, Sexo: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                                                    <option value="M">Masculino</option>
                                                    <option value="F">Femenino</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Identificación *</label>
                                                <input type="text" value={formData.Identificación} onChange={(e) => setFormData({ ...formData, Identificación: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (kg)</label>
                                                <input type="number" step="0.1" value={formData.Peso} onChange={(e) => setFormData({ ...formData, Peso: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (cm)</label>
                                                <input type="number" value={formData.Altura} onChange={(e) => setFormData({ ...formData, Altura: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Nombre Completo', value: `${paciente.Nombre} ${paciente.A_Paterno} ${paciente.A_Materno || ''}` },
                                                { label: 'Identificación', value: paciente.Identificación },
                                                { label: 'Fecha de Nacimiento', value: paciente.F_nacimiento },
                                                { label: 'Edad', value: `${edad} años` },
                                                { label: 'Sexo', value: paciente.Sexo === 'M' ? 'Masculino' : 'Femenino' },
                                                { label: 'Peso', value: `${paciente.Peso} kg` },
                                                { label: 'Altura', value: `${paciente.Altura} cm` },
                                                { label: 'IMC', value: (paciente.Peso / Math.pow(paciente.Altura / 100, 2)).toFixed(1) }
                                            ].map((item, i) => (
                                                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                                                    <p className="font-semibold text-gray-800 dark:text-white">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {editMode && (
                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <button onClick={() => { setFormData({ ...paciente }); setEditMode(false) }}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                            <button onClick={handleGuardar} disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                                                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Ubicación - Mapa de Piso */}
                            {activeSection === 'ubicacion' && (
                                <MapaPisoHospital
                                    paciente={paciente}
                                    onRefresh={fetchExpediente}
                                    showToast={showToast}
                                />
                            )}

                            {/* Signos Vitales */}
                            {activeSection === 'signos' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Historial de Signos Vitales</h3>
                                        {hasPermission(currentUser, PERMISSIONS.CAN_ADD_VITALS) && (
                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal('signos')}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                                                <Plus size={16} /> Registrar Signos
                                            </motion.button>
                                        )}
                                    </div>
                                    {signosVitales.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                            <Heart size={56} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 mb-2">No hay signos vitales registrados</p>
                                            <p className="text-sm text-gray-400 mb-4">Registra los signos vitales del paciente para llevar un seguimiento</p>
                                            {hasPermission(currentUser, PERMISSIONS.CAN_ADD_VITALS) && (
                                                <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowAddModal('signos')}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                                                    + Agregar primer registro
                                                </motion.button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {signosVitales.map((sv) => (
                                                <div key={sv.ID} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-3">{new Date(sv.Hora_medicion).toLocaleString()}</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                                            <p className="text-xs text-gray-500">Glucosa</p>
                                                            <p className="text-xl font-bold text-blue-600">{sv.Glucosa}</p>
                                                            <p className="text-xs text-gray-400">mg/dL</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                                            <p className="text-xs text-gray-500">Presión</p>
                                                            <p className="text-xl font-bold text-red-600">{sv.Presion_sist}/{sv.Presion_dias}</p>
                                                            <p className="text-xs text-gray-400">mmHg</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                                            <p className="text-xs text-gray-500">Temperatura</p>
                                                            <p className="text-xl font-bold text-orange-600">{sv.Temperatura}°</p>
                                                            <p className="text-xs text-gray-400">°C</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                                            <p className="text-xs text-gray-500">Oxígeno</p>
                                                            <p className="text-xl font-bold text-green-600">{sv.Oxigeno}%</p>
                                                            <p className="text-xs text-gray-400">SpO2</p>
                                                        </div>
                                                    </div>
                                                    {sv.Observaciones && (
                                                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">📝 {sv.Observaciones}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Medicamentos */}
                            {activeSection === 'medicamentos' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Medicamentos Administrados</h3>
                                            <p className="text-sm text-gray-500">Los medicamentos se registran desde el módulo de inventario al realizar una salida</p>
                                        </div>
                                    </div>
                                    {medicamentos.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                            <Pill size={56} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 mb-2">No hay medicamentos administrados</p>
                                            <p className="text-sm text-gray-400 mb-4">Los medicamentos se registran desde el módulo de inventario</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {medicamentos.map((med) => (
                                                <div key={med.ID} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                        <Pill size={24} className="text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800 dark:text-white">{med.Nombre || med.medicamento?.Nombre}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {med.medicamento?.Presentacion && <span>{med.medicamento.Presentacion} • </span>}
                                                            Vía: {med.Via}
                                                            {med.Observaciones && <span className="ml-2 text-gray-400">• {med.Observaciones}</span>}
                                                        </p>
                                                    </div>
                                                    {med.movimiento && (
                                                        <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-center">
                                                            <p className="text-lg font-bold text-purple-600">{med.movimiento.cantidad}</p>
                                                            <p className="text-xs text-purple-500">unidades</p>
                                                        </div>
                                                    )}
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-800 dark:text-white">{new Date(med.Fecha_hora).toLocaleDateString()}</p>
                                                        <p className="text-xs text-gray-500">{new Date(med.Fecha_hora).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Diagnósticos */}
                            {activeSection === 'diagnosticos' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Diagnósticos y Cuidados</h3>
                                        {hasPermission(currentUser, PERMISSIONS.CAN_ADD_DIAGNOSIS) && (
                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal('diagnosticos')}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg">
                                                <Plus size={16} /> Agregar Diagnóstico
                                            </motion.button>
                                        )}
                                    </div>
                                    {diagnosticos.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                            <Stethoscope size={56} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 mb-2">No hay diagnósticos registrados</p>
                                            <p className="text-sm text-gray-400 mb-4">Registra los diagnósticos y cuidados requeridos para el paciente</p>
                                            {hasPermission(currentUser, PERMISSIONS.CAN_ADD_DIAGNOSIS) && (
                                                <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowAddModal('diagnosticos')}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
                                                    + Agregar diagnóstico
                                                </motion.button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {diagnosticos.map((diag) => (
                                                <div key={diag.ID} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                                            <Stethoscope size={20} className="text-red-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-800 dark:text-white">{diag.padecimiento?.Descripción || 'Padecimiento'}</p>
                                                            <div className="mt-2 p-3 bg-white dark:bg-gray-600 rounded-lg">
                                                                <p className="text-xs text-gray-500 mb-1">Cuidados requeridos:</p>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300">{diag.cuidados?.Descripcion}</p>
                                                                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${diag.cuidados?.Completado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    {diag.cuidados?.Completado ? '✓ Completado' : '⏳ Pendiente'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Registros de Enfermería */}
                            {activeSection === 'registros' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Registros de Enfermería ({registros.length})</h3>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal('registros')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">
                                            <Plus size={16} /> Nueva Hoja
                                        </motion.button>
                                    </div>
                                    {registros.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                            <ClipboardList size={56} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 mb-2">No hay registros de enfermería</p>
                                            <p className="text-sm text-gray-400 mb-4">Crea una hoja de enfermería para registrar el seguimiento del paciente</p>
                                            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowAddModal('registros')}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                                                + Crear primera hoja
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {registros.map((reg) => (
                                                <div key={reg.ID} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                            {new Date(reg.fecha).toLocaleDateString()} - {new Date(reg.fecha).toLocaleTimeString()}
                                                        </p>
                                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${reg.firmado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {reg.firmado ? '✓ Firmado' : '⏳ Pendiente'}
                                                        </span>
                                                    </div>
                                                    {reg.observaciones && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">{reg.observaciones}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modales para agregar registros */}
                <AnimatePresence>
                    {showAddModal === 'signos' && (
                        <ModalAgregarSignos pacienteId={paciente.ID} onClose={() => setShowAddModal(null)} onSuccess={() => { setShowAddModal(null); fetchExpediente() }} />
                    )}
                    {showAddModal === 'medicamentos' && (
                        <ModalAgregarMedicamento pacienteId={paciente.ID} medicamentos={catalogoMedicamentos} onClose={() => setShowAddModal(null)} onSuccess={() => { setShowAddModal(null); fetchExpediente() }} />
                    )}
                    {showAddModal === 'diagnosticos' && (
                        <ModalAgregarDiagnostico pacienteId={paciente.ID} registros={registros} padecimientos={catalogoPadecimientos} onClose={() => setShowAddModal(null)} onSuccess={() => { setShowAddModal(null); fetchExpediente() }} />
                    )}
                    {showAddModal === 'registros' && (
                        <ModalAgregarRegistro pacienteId={paciente.ID} onClose={() => setShowAddModal(null)} onSuccess={() => { setShowAddModal(null); fetchExpediente() }} />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    )
}

function ModalNuevoPaciente({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        Nombre: '', A_Paterno: '', A_Materno: '', F_nacimiento: '', Sexo: 'M', Identificación: '', Peso: '', Altura: ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('Paciente').insert([formData])
            if (error) throw error
            onSuccess()
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nuevo Paciente</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                        <input type="text" required value={formData.Nombre} onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido Paterno *</label>
                            <input type="text" required value={formData.A_Paterno} onChange={(e) => setFormData({ ...formData, A_Paterno: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido Materno</label>
                            <input type="text" value={formData.A_Materno} onChange={(e) => setFormData({ ...formData, A_Materno: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Nacimiento *</label>
                            <input type="date" required value={formData.F_nacimiento} onChange={(e) => setFormData({ ...formData, F_nacimiento: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo *</label>
                            <select required value={formData.Sexo} onChange={(e) => setFormData({ ...formData, Sexo: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Identificación *</label>
                        <input type="text" required value={formData.Identificación} onChange={(e) => setFormData({ ...formData, Identificación: e.target.value })}
                            placeholder="CURP, INE, etc." className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (kg) *</label>
                            <input type="number" step="0.1" required value={formData.Peso} onChange={(e) => setFormData({ ...formData, Peso: e.target.value })}
                                placeholder="70.5" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (cm) *</label>
                            <input type="number" required value={formData.Altura} onChange={(e) => setFormData({ ...formData, Altura: e.target.value })}
                                placeholder="170" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Registrar Paciente'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

// Modal para nuevo ingreso con triage
function ModalNuevoIngreso({ pacientes, registros, enfermeros = [], roles = [], detallesRol = [], areas = [], turnos = [], onClose, onSuccess, pacientePreseleccionado = null }) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{ }')
    const [formData, setFormData] = useState({
        idPaciente: pacientePreseleccionado ? pacientePreseleccionado.ID : '',
        idEnfermero: currentUser.ID || '',
        idTriage: 1,
        motivo: ''
    })
    const [showNurseSelector, setShowNurseSelector] = useState(false)
    const [loading, setLoading] = useState(false)

    // Pacientes sin ingreso activo (sin registro con activo=true)
    const pacientesDisponibles = pacientes.filter(p => !registros.some(r => r.idPaciente === p.ID && r.activo))

    const getEnfermerosAsignados = () => {
        // Encontrar rol activo (ordenar por fechaInicio desc)
        const sortedRoles = [...roles].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio))
        const activeRol = sortedRoles[0]

        if (!activeRol) return []

        const activeDeats = detallesRol.filter(d => d.idRol === activeRol.id)

        // Filtrar enfermeros que tienen detalle en este rol
        return enfermeros.filter(enf => activeDeats.some(d => d.idEnfermero === enf.ID))
            .map(enf => {
                const det = activeDeats.find(d => d.idEnfermero === enf.ID)
                const area = areas.find(a => a.ID === det.idArea)
                const turno = turnos.find(t => t.ID === det.idTurno)
                const numPacientes = registros.filter(r => r.idEnfermero === enf.ID && r.activo).length

                return { ...enf, area: area?.nombre, turno: turno?.nombre, numPacientes }
            })
            .sort((a, b) => a.numPacientes - b.numPacientes)
    }

    const enfermerosCards = getEnfermerosAsignados()
    const selectedNurseInfo = enfermeros.find(e => e.ID == formData.idEnfermero)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Primero verificar/crear el triage si no existe
            const { data: existingTriage } = await supabase.from('Triaje').select('*').eq('ID', formData.idTriage).single()

            if (!existingTriage) {
                const triageLevel = TRIAGE_LEVELS.find(t => t.id === formData.idTriage)
                await supabase.from('Triaje').insert([{
                    ID: formData.idTriage,
                    Nivel: formData.idTriage,
                    Descripcion: triageLevel?.nombre
                }])
            }

            // Crear el registro de enfermeria con datos de ingreso
            const { error } = await supabase.from('Registro_Enfermeria').insert([{
                idPaciente: parseInt(formData.idPaciente),
                idEnfermero: parseInt(formData.idEnfermero),
                fecha: new Date().toISOString(),
                observaciones: 'Ingreso de paciente',
                firmado: false,
                idTriaje: formData.idTriage,
                motivoIngreso: formData.motivo || null,
                activo: true
            }])
            if (error) throw error
            onSuccess()
        } catch (err) {
            console.error(err)
            alert('Error al registrar ingreso')
        }
        setLoading(false)
    }

    if (showNurseSelector) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowNurseSelector(false)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-xl h-[85vh] flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Asignar Enfermero</h2>
                            <p className="text-sm text-gray-500">Selecciona el enfermero responsable para este ingreso</p>
                        </div>
                        <button onClick={() => setShowNurseSelector(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                    </div>

                    <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 bg-gray-50 dark:bg-gray-900">
                        {enfermerosCards.length > 0 ? (
                            enfermerosCards.map(enf => (
                                <button key={enf.ID} onClick={() => { setFormData({ ...formData, idEnfermero: enf.ID }); setShowNurseSelector(false) }}
                                    className={`relative p-5 rounded-xl border text-left transition-all group hover:shadow-lg flex flex-col gap-3
                                        ${formData.idEnfermero == enf.ID
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-md transform scale-[1.02]'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                        }`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {enf.nombre} {enf.apellidoPaterno}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">Licencia: {enf.licencia}</div>
                                        </div>
                                        {formData.idEnfermero == enf.ID && <div className="text-blue-600"><Check size={20} className="stroke-[3]" /></div>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span className="truncate">{enf.area || 'Sin Área'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                            <Clock size={16} className="text-gray-400" />
                                            <span className="truncate">{enf.turno || 'Sin Turno'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-2">
                                        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full w-fit
                                            ${enf.numPacientes === 0 ? 'bg-green-100 text-green-700' :
                                                enf.numPacientes < 5 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            <User size={14} />
                                            {enf.numPacientes} pacientes activos
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-10">
                                <AlertCircle size={48} className="mb-4 opacity-20" />
                                <p>No se encontraron enfermeros con asignación en el rol actual.</p>
                                <button type="button" onClick={() => setShowNurseSelector(false)} className="mt-4 text-blue-600 underline text-sm">
                                    Cancelar selección
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nuevo Ingreso</h2>
                        <p className="text-sm text-gray-500">Registrar ingreso de paciente con triage</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="ingreso-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Selector de paciente */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paciente *</label>
                                {pacientePreseleccionado ? (
                                    <div className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white font-medium">
                                        {pacientePreseleccionado.Nombre} {pacientePreseleccionado.A_Paterno}
                                    </div>
                                ) : (
                                    <select required value={formData.idPaciente} onChange={(e) => setFormData({ ...formData, idPaciente: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                                        <option value="">Seleccionar paciente...</option>
                                        {pacientesDisponibles.map(p => (
                                            <option key={p.ID} value={p.ID}>{p.Nombre} {p.A_Paterno} {p.A_Materno}</option>
                                        ))}
                                    </select>
                                )}
                                {!pacientePreseleccionado && pacientesDisponibles.length === 0 && (
                                    <p className="text-xs text-orange-500 mt-1">No hay pacientes sin ingreso activo</p>
                                )}
                            </div>

                            {/* Selector de Enfermero (Botón con Card) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enfermero Asignado *</label>
                                {selectedNurseInfo ? (
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-750 flex justify-between items-center group hover:border-blue-300 transition-colors h-[46px]">
                                        <div className="truncate pr-2">
                                            <div className="font-semibold text-gray-800 dark:text-white truncate text-sm">{selectedNurseInfo.nombre} {selectedNurseInfo.apellidoPaterno}</div>
                                        </div>
                                        <button type="button" onClick={() => setShowNurseSelector(true)} className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600 rounded transition-colors font-medium whitespace-nowrap">
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setShowNurseSelector(true)}
                                        className="w-full py-2.5 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-gray-500 rounded-xl flex items-center justify-center gap-2 transition-all h-[46px]">
                                        <UserPlus size={18} />
                                        <span className="font-medium text-sm">Asignar Enfermero</span>
                                    </button>
                                )}
                                {!selectedNurseInfo && <p className="text-xs text-red-500 mt-1 ml-1">* Este campo es obligatorio</p>}
                            </div>
                        </div>

                        {/* Triage con radio buttons coloridos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nivel de Triage *</label>
                            <div className="space-y-2">
                                {TRIAGE_LEVELS.map(level => (
                                    <label key={level.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.idTriage === level.id
                                            ? `${level.borderColor} ${level.color} ${level.textColor}`
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                            }`}>
                                        <input type="radio" name="triage" value={level.id} checked={formData.idTriage === level.id}
                                            onChange={() => setFormData({ ...formData, idTriage: level.id })}
                                            className="sr-only" />
                                        <div className={`w-5 h-5 rounded-full ${level.color} flex items-center justify-center shrink-0`}>
                                            {formData.idTriage === level.id && <Check size={12} className={level.textColor} />}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`font-medium ${formData.idTriage === level.id ? level.textColor : 'text-gray-700 dark:text-gray-300'}`}>
                                                {level.nombre}
                                            </span>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${level.color} shrink-0`}></div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Motivo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo del Ingreso</label>
                            <textarea rows={2} value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                placeholder="Descripción del motivo de ingreso..."
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
                    <button type="submit" form="ingreso-form" disabled={loading || !formData.idPaciente || !formData.idEnfermero}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all transform active:scale-95">
                        {loading ? 'Registrando...' : 'Registrar Ingreso'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// Modal para agregar signos vitales
function ModalAgregarSignos({ pacienteId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        Glucosa: '', Presion_sist: '', Presion_dias: '', Temperatura: '', Oxigeno: '', Evacuaciones: '', Mls_orina: '', Observaciones: ''
    })
    const [loading, setLoading] = useState(false)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{ }')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Primero crear el registro de enfermería
            const { data: regData, error: regError } = await supabase.from('Registro_Enfermeria').insert([{
                idPaciente: pacienteId, idEnfermero: currentUser.ID,
                fecha: new Date().toISOString(), observaciones: 'Registro de signos vitales',
                firmado: false
            }]).select()
            if (regError) throw regError

            // Luego crear signos vitales con idRegistro
            const { error: signosError } = await supabase.from('Signos_Vitales').insert([{
                idRegistro: regData[0].ID,
                Glucosa: parseFloat(formData.Glucosa), Presion_sist: parseFloat(formData.Presion_sist),
                Presion_dias: parseFloat(formData.Presion_dias), Temperatura: parseFloat(formData.Temperatura),
                Oxigeno: parseFloat(formData.Oxigeno), Evacuaciones: parseInt(formData.Evacuaciones) || 0,
                Mls_orina: parseFloat(formData.Mls_orina) || 0, Hora_medicion: new Date().toISOString(),
                Observaciones: formData.Observaciones
            }])
            if (signosError) throw signosError

            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-600 text-white rounded-t-xl">
                    <h2 className="text-lg font-semibold">Registrar Signos Vitales</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Glucosa (mg/dL) *</label>
                            <input type="number" step="0.1" required value={formData.Glucosa} onChange={(e) => setFormData({ ...formData, Glucosa: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Presión Sistólica *</label>
                            <input type="number" required value={formData.Presion_sist} onChange={(e) => setFormData({ ...formData, Presion_sist: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Presión Diastólica *</label>
                            <input type="number" required value={formData.Presion_dias} onChange={(e) => setFormData({ ...formData, Presion_dias: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Temperatura (°C) *</label>
                            <input type="number" step="0.1" required value={formData.Temperatura} onChange={(e) => setFormData({ ...formData, Temperatura: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Oxígeno (%) *</label>
                            <input type="number" step="0.1" required value={formData.Oxigeno} onChange={(e) => setFormData({ ...formData, Oxigeno: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Evacuaciones</label>
                            <input type="number" value={formData.Evacuaciones} onChange={(e) => setFormData({ ...formData, Evacuaciones: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" /></div>
                        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Mls Orina</label>
                            <input type="number" value={formData.Mls_orina} onChange={(e) => setFormData({ ...formData, Mls_orina: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" /></div>
                    </div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Observaciones</label>
                        <textarea rows={2} value={formData.Observaciones} onChange={(e) => setFormData({ ...formData, Observaciones: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none"></textarea></div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

// Modal para agregar medicamento
function ModalAgregarMedicamento({ pacienteId, medicamentos, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ Medicamento_ID: '', Dosis: '', Via: 'Oral', Observaciones: '' })
    const [loading, setLoading] = useState(false)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{ }')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const med = medicamentos.find(m => m.ID === parseInt(formData.Medicamento_ID))

            // Primero crear el registro
            const { data: regData, error: regError } = await supabase.from('Registro_Enfermeria').insert([{
                idPaciente: pacienteId, idEnfermero: currentUser.ID,
                fecha: new Date().toISOString(), observaciones: `Medicamento: ${med?.Nombre}`,
                firmado: false
            }]).select()
            if (regError) throw regError

            // Luego crear administración de medicamento con idRegistro
            const { error: adminError } = await supabase.from('Administracion_Medicamento').insert([{
                idRegistro: regData[0].ID,
                Medicamento_ID: parseInt(formData.Medicamento_ID), Nombre: med?.Nombre,
                Fecha_hora: new Date().toISOString(),
                Via: formData.Via, Observaciones: formData.Observaciones
            }])
            if (adminError) throw adminError

            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-600 text-white rounded-t-xl">
                    <h2 className="text-lg font-semibold">Administrar Medicamento</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicamento *</label>
                        <select required value={formData.Medicamento_ID} onChange={(e) => setFormData({ ...formData, Medicamento_ID: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                            <option value="">Seleccionar medicamento</option>
                            {medicamentos.map(m => <option key={m.ID} value={m.ID}>{m.Nombre} - {m.Presentacion}</option>)}
                        </select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dosis *</label>
                            <input type="number" step="0.01" required value={formData.Dosis} onChange={(e) => setFormData({ ...formData, Dosis: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vía *</label>
                            <select required value={formData.Via} onChange={(e) => setFormData({ ...formData, Via: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                <option value="Oral">Oral</option><option value="Intravenosa">Intravenosa</option>
                                <option value="Intramuscular">Intramuscular</option><option value="Subcutánea">Subcutánea</option>
                                <option value="Tópica">Tópica</option><option value="Inhalatoria">Inhalatoria</option>
                            </select></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                        <textarea rows={2} value={formData.Observaciones} onChange={(e) => setFormData({ ...formData, Observaciones: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"></textarea></div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Registrar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

// Modal para agregar diagnóstico
function ModalAgregarDiagnostico({ pacienteId, registros, padecimientos, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ ID_Registro: '', ID_Padecimiento: '', cuidadosDescripcion: '' })
    const [loading, setLoading] = useState(false)

    // Solo mostrar registros sin diagnóstico
    const registrosSinDiagnostico = registros.filter(r => !r.idDiagnostico)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Crear cuidados
            const { data: cuidadosData, error: cuidadosError } = await supabase.from('Cuidados').insert([{
                Descripcion: formData.cuidadosDescripcion, Completado: false
            }]).select()
            if (cuidadosError) throw cuidadosError

            // Crear diagnóstico primero
            const { data: diagData, error: diagError } = await supabase.from('Diagnostico').insert([{
                ID_Padecimiento: parseInt(formData.ID_Padecimiento),
                ID_Cuidados: cuidadosData[0].ID
            }]).select()
            if (diagError) throw diagError

            // Actualizar el registro con el idDiagnostico
            await supabase.from('Registro_Enfermeria').update({
                idDiagnostico: diagData[0].ID
            }).eq('ID', parseInt(formData.ID_Registro))

            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-red-600 text-white rounded-t-xl">
                    <h2 className="text-lg font-semibold">Agregar Diagnóstico</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {registrosSinDiagnostico.length === 0 ? (
                        <div className="text-center py-4 text-yellow-600 bg-yellow-50 rounded-lg">
                            <p className="text-sm">{registros.length === 0 ? 'Primero debes crear un registro de enfermería' : 'Todos los registros ya tienen diagnóstico'}</p>
                        </div>
                    ) : (
                        <>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registro de Enfermería *</label>
                                <select required value={formData.ID_Registro} onChange={(e) => setFormData({ ...formData, ID_Registro: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                    <option value="">Seleccionar registro</option>
                                    {registrosSinDiagnostico.map(r => <option key={r.ID} value={r.ID}>{new Date(r.fecha).toLocaleDateString()} - {new Date(r.fecha).toLocaleTimeString()}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Padecimiento *</label>
                                <select required value={formData.ID_Padecimiento} onChange={(e) => setFormData({ ...formData, ID_Padecimiento: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                    <option value="">Seleccionar padecimiento</option>
                                    {padecimientos.map(p => <option key={p.ID} value={p.ID}>{p.Descripción}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuidados Requeridos *</label>
                                <textarea rows={3} required value={formData.cuidadosDescripcion} onChange={(e) => setFormData({ ...formData, cuidadosDescripcion: e.target.value })} placeholder="Describe los cuidados necesarios..." className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"></textarea></div>
                        </>
                    )}
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading || registros.length === 0} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Agregar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

// Modal para agregar registro de enfermería
function ModalAgregarRegistro({ pacienteId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ observaciones: '', firmado: false })
    const [loading, setLoading] = useState(false)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{ }')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Primero crear el registro
            const { data: regData, error: regError } = await supabase.from('Registro_Enfermeria').insert([{
                idPaciente: pacienteId, idEnfermero: currentUser.ID,
                fecha: new Date().toISOString(), observaciones: formData.observaciones,
                firmado: formData.firmado
            }]).select()
            if (regError) throw regError

            // Luego crear signos vitales vacíos con idRegistro
            const { error: signosError } = await supabase.from('Signos_Vitales').insert([{
                idRegistro: regData[0].ID,
                Glucosa: 0, Presion_sist: 0, Presion_dias: 0, Temperatura: 0, Oxigeno: 0, Evacuaciones: 0, Mls_orina: 0, Hora_medicion: new Date().toISOString()
            }])
            if (signosError) throw signosError

            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-green-600 text-white rounded-t-xl">
                    <h2 className="text-lg font-semibold">Nueva Hoja de Enfermería</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                        <textarea rows={4} value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Notas del turno, observaciones del paciente..." className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"></textarea></div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="firmadoReg" checked={formData.firmado} onChange={(e) => setFormData({ ...formData, firmado: e.target.checked })} className="w-4 h-4 text-green-600 rounded" />
                        <label htmlFor="firmadoReg" className="text-sm text-gray-700 dark:text-gray-300">Firmar registro</label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Crear Registro'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

// ==============================================
// Componente MapaPisoHospital - Mapa SVG del piso
// ==============================================
function MapaPisoHospital({ paciente, onRefresh, showToast }) {
    const [pisos, setPisos] = useState([])
    const [habitaciones, setHabitaciones] = useState([])
    const [camas, setCamas] = useState([])
    const [selectedPiso, setSelectedPiso] = useState(null)
    const [selectedHabitacion, setSelectedHabitacion] = useState(null)
    const [selectedCama, setSelectedCama] = useState(null)
    const [loading, setLoading] = useState(true)
    const [asignando, setAsignando] = useState(false)

    // Cama actualmente asignada al paciente
    const camaAsignada = camas.find(c => c.idPaciente === paciente.ID)

    useEffect(() => {
        fetchDatos()
    }, [])

    const fetchDatos = async () => {
        setLoading(true)
        const [{ data: pisosData }, { data: habsData }, { data: camasData }] = await Promise.all([
            supabase.from('Piso').select('*').order('Número'),
            supabase.from('Habitación').select('*'),
            supabase.from('Cama').select('*')
        ])
        setPisos(pisosData || [])
        setHabitaciones(habsData || [])
        setCamas(camasData || [])
        if (pisosData?.length > 0) setSelectedPiso(pisosData[0].ID)
        setLoading(false)
    }

    // Función para asignar cama al paciente
    const handleAsignarCama = async () => {
        if (!selectedCama) return
        setAsignando(true)
        try {
            // Si ya tiene cama asignada, primero liberarla
            if (camaAsignada) {
                await supabase.from('Cama').update({
                    idPaciente: null
                }).eq('ID', camaAsignada.ID)
            }
            // Asignar nueva cama
            const { error } = await supabase.from('Cama').update({
                idPaciente: paciente.ID
            }).eq('ID', selectedCama.ID)
            if (error) throw error
            showToast(`Cama ${selectedCama.numero} asignada correctamente`)
            setSelectedHabitacion(null)
            setSelectedCama(null)
            fetchDatos()
            onRefresh()
        } catch (err) {
            console.error(err)
            showToast('Error al asignar cama', 'error')
        }
        setAsignando(false)
    }

    // Función para liberar la cama actual
    const handleLiberarCama = async () => {
        if (!camaAsignada) return
        if (!confirm('¿Liberar la cama asignada a este paciente?')) return
        setAsignando(true)
        try {
            const { error } = await supabase.from('Cama').update({
                idPaciente: null
            }).eq('ID', camaAsignada.ID)
            if (error) throw error
            showToast('Cama liberada correctamente')
            fetchDatos()
            onRefresh()
        } catch (err) {
            console.error(err)
            showToast('Error al liberar cama', 'error')
        }
        setAsignando(false)
    }

    // Obtener habitaciones del piso seleccionado
    const habitacionesPiso = habitaciones.filter(h => h.ID_Piso === selectedPiso)

    // Calcular disponibilidad de habitación (verde, amarillo, rojo)
    const getHabitacionColor = (habId) => {
        const camasHab = camas.filter(c => c.idHabitacion === habId)
        const ocupadas = camasHab.filter(c => c.idPaciente).length
        const total = camasHab.length
        if (ocupadas === 0) return { fill: '#22c55e', stroke: '#16a34a', status: 'Disponible' } // Verde
        if (ocupadas < total) return { fill: '#eab308', stroke: '#ca8a04', status: 'Parcial' } // Amarillo
        return { fill: '#ef4444', stroke: '#dc2626', status: 'Llena' } // Rojo
    }

    // Obtener camas de la habitación seleccionada
    const camasHabitacion = camas.filter(c => c.idHabitacion === selectedHabitacion?.ID)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Mapa del Hospital</h3>
                {/* Selector de piso */}
                <select
                    value={selectedPiso || ''}
                    onChange={(e) => setSelectedPiso(parseInt(e.target.value))}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                    {pisos.map(p => (
                        <option key={p.ID} value={p.ID}>Piso {p.Número}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <>
                    {/* Cama actualmente asignada */}
                    {camaAsignada && (
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <Bed size={24} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-green-800 dark:text-green-300">Cama Asignada: {camaAsignada.numero}</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Habitación {habitaciones.find(h => h.ID === camaAsignada.idHabitacion)?.Número} •
                                        Piso {pisos.find(p => p.ID === habitaciones.find(h => h.ID === camaAsignada.idHabitacion)?.ID_Piso)?.Número}
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleLiberarCama} disabled={asignando}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg disabled:opacity-50">
                                {asignando ? 'Liberando...' : 'Liberar Cama'}
                            </button>
                        </div>
                    )}

                    {/* Leyenda */}
                    <div className="flex gap-4 justify-center">
                        {[
                            { color: 'bg-green-500', label: 'Disponible' },
                            { color: 'bg-yellow-500', label: 'Parcial' },
                            { color: 'bg-red-500', label: 'Llena' }
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className={`w-4 h-4 ${item.color} rounded`}></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* SVG del piso */}
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 overflow-x-auto">
                        <svg viewBox="0 0 600 300" className="w-full min-w-[500px] h-[300px]">
                            {/* Fondo del piso */}
                            <rect x="10" y="10" width="580" height="280" rx="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />

                            {/* Pasillo central */}
                            <rect x="250" y="30" width="100" height="240" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
                            <text x="300" y="155" textAnchor="middle" fontSize="12" fill="#6b7280">PASILLO</text>

                            {/* Habitaciones lado izquierdo (101, 102 o 201, 202) */}
                            {habitacionesPiso.slice(0, 2).map((hab, i) => {
                                const colors = getHabitacionColor(hab.ID)
                                const y = 40 + i * 115
                                return (
                                    <g key={hab.ID} style={{ cursor: 'pointer' }} onClick={() => setSelectedHabitacion(hab)}>
                                        <motion.rect
                                            x="30" y={y} width="200" height="100" rx="8"
                                            fill={colors.fill} stroke={colors.stroke} strokeWidth="2"
                                            whileHover={{ scale: 1.02, opacity: 0.9 }}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                                        />
                                        <text x="130" y={y + 40} textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">
                                            Hab. {hab.Número}
                                        </text>
                                        <text x="130" y={y + 65} textAnchor="middle" fontSize="12" fill="white" opacity="0.9">
                                            {colors.status}
                                        </text>
                                        {/* Icono de camas */}
                                        <rect x="50" y={y + 75} width="30" height="15" rx="3" fill="rgba(255,255,255,0.3)" />
                                        <rect x="90" y={y + 75} width="30" height="15" rx="3" fill="rgba(255,255,255,0.3)" />
                                        <rect x="130" y={y + 75} width="30" height="15" rx="3" fill="rgba(255,255,255,0.3)" />
                                        <rect x="170" y={y + 75} width="30" height="15" rx="3" fill="rgba(255,255,255,0.3)" />
                                    </g>
                                )
                            })}

                            {/* Habitaciones lado derecho (103, 104 o 203, 204) */}
                            {habitacionesPiso.slice(2, 4).map((hab, i) => {
                                const colors = getHabitacionColor(hab.ID)
                                const y = 40 + i * 115
                                return (
                                    <g key={hab.ID} style={{ cursor: 'pointer' }} onClick={() => setSelectedHabitacion(hab)}>
                                        <motion.rect
                                            x="370" y={y} width="200" height="100" rx="8"
                                            fill={colors.fill} stroke={colors.stroke} strokeWidth="2"
                                            whileHover={{ scale: 1.02, opacity: 0.9 }}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (i + 2) * 0.1 }}
                                        />
                                        <text x="470" y={y + 40} textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">
                                            Hab. {hab.Número}
                                        </text>
                                        <text x="470" y={y + 65} textAnchor="middle" fontSize="12" fill="white" opacity="0.9">
                                            {colors.status}
                                        </text>
                                        {/* Icono de camas */}
                                        <rect x="390" y={y + 75} width="30" height="15" rx="3" fill="rgba(255,255,255,0.3)" />
                                        <rect x="430" y={y + 75} width="30" height="15" rx="3" fill="rgba(255,255,255,0.3)" />
                                        <rect x="470" y={y + 75} width="30" height="15" rx="3" fill="rgba(255,255,255,0.3)" />
                                        <rect x="510" y={y + 75} width="30" height="15" rx="3" fill="rgba(255,255,255,0.3)" />
                                    </g>
                                )
                            })}

                            {/* Indicador de piso */}
                            <text x="300" y="285" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">
                                Piso {pisos.find(p => p.ID === selectedPiso)?.Número}
                            </text>
                        </svg>
                    </div>

                    <p className="text-center text-sm text-gray-500">Haz clic en una habitación para ver las camas disponibles</p>
                </>
            )}

            {/* Modal de selección de camas */}
            <AnimatePresence>
                {selectedHabitacion && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setSelectedHabitacion(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Habitación {selectedHabitacion.Número}</h3>
                                    <button onClick={() => setSelectedHabitacion(null)} className="p-1 hover:bg-white/20 rounded">
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-sm text-white/80 mt-1">Selecciona una cama disponible</p>
                            </div>

                            {/* Grid de camas estilo cine */}
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {camasHabitacion.map((cama) => {
                                        const ocupada = !!cama.idPaciente
                                        const esSeleccionada = selectedCama?.ID === cama.ID
                                        return (
                                            <motion.button
                                                key={cama.ID}
                                                whileHover={!ocupada ? { scale: 1.05 } : {}}
                                                whileTap={!ocupada ? { scale: 0.95 } : {}}
                                                onClick={() => !ocupada && setSelectedCama(esSeleccionada ? null : cama)}
                                                disabled={ocupada}
                                                className={`p-4 rounded-xl border-2 transition-all ${ocupada
                                                    ? 'bg-red-100 border-red-300 cursor-not-allowed opacity-60'
                                                    : esSeleccionada
                                                        ? 'bg-green-100 border-green-500 ring-2 ring-green-500'
                                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-500'
                                                    }`}
                                            >
                                                <Bed size={32} className={`mx-auto mb-2 ${ocupada ? 'text-red-500' : esSeleccionada ? 'text-green-600' : 'text-gray-400'}`} />
                                                <p className="font-semibold text-gray-800 dark:text-white">Cama {cama.numero % 10}</p>
                                                <p className={`text-xs ${ocupada ? 'text-red-600' : 'text-green-600'}`}>
                                                    {ocupada ? 'Ocupada' : 'Disponible'}
                                                </p>
                                            </motion.button>
                                        )
                                    })}
                                </div>

                                {/* Leyenda */}
                                <div className="flex justify-center gap-6 text-xs text-gray-500 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
                                        <span>Disponible</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                                        <span>Seleccionada</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded opacity-60"></div>
                                        <span>Ocupada</span>
                                    </div>
                                </div>

                                {selectedCama && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                                        <p className="text-sm text-green-700 dark:text-green-400">
                                            ✓ Cama {selectedCama.numero} seleccionada
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setSelectedHabitacion(null)}
                                        className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAsignarCama}
                                        disabled={!selectedCama || asignando}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {asignando ? (camaAsignada ? 'Cambiando...' : 'Asignando...') : (camaAsignada ? 'Cambiar Cama' : 'Asignar Cama')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default PacientesPage
