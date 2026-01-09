import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bed, User, FileText, X, Check, AlertCircle, Activity, UserPlus, Edit, Trash2, Heart, Pill, Stethoscope, ClipboardList, Save, ChevronDown, ChevronUp, Plus, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function PacientesPage() {
    const [pacientes, setPacientes] = useState([])
    const [camas, setCamas] = useState([])
    const [pisos, setPisos] = useState([])
    const [habitaciones, setHabitaciones] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(null)
    const [selectedPaciente, setSelectedPaciente] = useState(null)
    const [selectedPiso, setSelectedPiso] = useState('')
    const [toast, setToast] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [pacRes, camaRes, pisoRes, habRes] = await Promise.all([
                supabase.from('Paciente').select('*'),
                supabase.from('Cama').select('*'),
                supabase.from('Piso').select('*'),
                supabase.from('Habitación').select('*')
            ])
            if (pacRes.data) setPacientes(pacRes.data)
            if (camaRes.data) setCamas(camaRes.data)
            if (pisoRes.data) setPisos(pisoRes.data)
            if (habRes.data) setHabitaciones(habRes.data)
        } catch (error) {
            console.error('Error:', error)
        }
        setLoading(false)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
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

    const filteredPacientes = pacientes.filter(p =>
        `${p.Nombre} ${p.A_Paterno} ${p.A_Materno}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const calcularEdad = (fechaNac) => {
        if (!fechaNac) return '-'
        return Math.floor((new Date() - new Date(fechaNac)) / (365.25 * 24 * 60 * 60 * 1000))
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Pacientes</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Ver pacientes, registros de enfermería y expedientes</p>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('nuevoPaciente')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                    <UserPlus size={20} /> Nuevo Paciente
                </motion.button>
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

            {/* Lista de pacientes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-800 dark:text-white">Todos los Pacientes ({filteredPacientes.length})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Identificación</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sexo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Edad</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ver Expediente</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
                            ) : filteredPacientes.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No hay pacientes</td></tr>
                            ) : (
                                filteredPacientes.map((pac, i) => (
                                    <motion.tr key={pac.ID} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                        onClick={() => { setSelectedPaciente(pac); setShowModal('verPaciente') }}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-semibold">
                                                    {pac.Nombre?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-white">{pac.Nombre} {pac.A_Paterno}</p>
                                                    <p className="text-xs text-gray-500">{pac.A_Materno}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{pac.Identificación}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${pac.Sexo === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {pac.Sexo === 'M' ? 'Masculino' : 'Femenino'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{calcularEdad(pac.F_nacimiento)} años</td>
                                        <td className="px-6 py-4">
                                            {/* Badges de información faltante */}
                                            {(() => {
                                                const camaAsignada = camas.find(c => c.idPaciente === pac.ID)
                                                const badges = []

                                                if (!camaAsignada) {
                                                    badges.push({ label: 'Sin Cama', color: 'bg-orange-100 text-orange-700', section: 'ubicacion' })
                                                }
                                                // Aquí podrías agregar más validaciones cuando cargues registros, signos, etc.

                                                if (badges.length === 0) {
                                                    return <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">✓ Completo</span>
                                                }

                                                return (
                                                    <div className="flex flex-wrap gap-1">
                                                        {badges.map((badge, idx) => (
                                                            <button key={idx} onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedPaciente(pac)
                                                                setShowModal('verPaciente')
                                                            }}
                                                                className={`px-2 py-1 text-xs rounded-full font-medium ${badge.color} hover:opacity-80 cursor-pointer`}
                                                                title={`Click para ir a ${badge.section}`}
                                                            >
                                                                ⚠ {badge.label}
                                                            </button>
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

            {/* Modales */}
            <AnimatePresence>
                {showModal === 'verPaciente' && selectedPaciente && (
                    <ModalExpedientePaciente paciente={selectedPaciente} onClose={() => { setShowModal(null); setSelectedPaciente(null) }}
                        onRefresh={fetchData} showToast={showToast} />
                )}
                {showModal === 'nuevoPaciente' && (
                    <ModalNuevoPaciente onClose={() => setShowModal(null)}
                        onSuccess={() => { fetchData(); setShowModal(null); showToast('Paciente registrado') }} />
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
function ModalExpedientePaciente({ paciente, onClose, onRefresh, showToast }) {
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

            // Signos vitales de los registros
            if (regs && regs.length > 0) {
                const signosIds = regs.map(r => r.idSignosVitales).filter(Boolean)
                if (signosIds.length > 0) {
                    const { data: signos } = await supabase.from('Signos_Vitales').select('*').in('ID', signosIds)
                    setSignosVitales(signos || [])
                }

                // Medicamentos administrados
                const medIds = regs.map(r => r.idAdministracionMed).filter(Boolean)
                if (medIds.length > 0) {
                    const { data: adminMeds } = await supabase.from('Administracion_Medicamento').select('*').in('ID', medIds)
                    if (adminMeds) {
                        const medIdsUnicos = [...new Set(adminMeds.map(m => m.Medicamento_ID))]
                        const { data: meds } = await supabase.from('Medicamento').select('*').in('ID', medIdsUnicos)
                        setMedicamentos(adminMeds.map(am => ({
                            ...am,
                            medicamento: meds?.find(m => m.ID === am.Medicamento_ID)
                        })))
                    }
                }

                // Diagnósticos
                const regIds = regs.map(r => r.ID)
                const { data: diags } = await supabase.from('Diagnostico').select('*').in('ID_Registro', regIds)
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
                                    <button onClick={() => setEditMode(true)} className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Editar">
                                        <Edit size={20} />
                                    </button>
                                    <button onClick={handleEliminar} className="p-2 hover:bg-red-500/50 rounded-lg transition-colors" title="Eliminar">
                                        <Trash2 size={20} />
                                    </button>
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
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal('signos')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                                            <Plus size={16} /> Registrar Signos
                                        </motion.button>
                                    </div>
                                    {signosVitales.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                            <Heart size={56} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 mb-2">No hay signos vitales registrados</p>
                                            <p className="text-sm text-gray-400 mb-4">Registra los signos vitales del paciente para llevar un seguimiento</p>
                                            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowAddModal('signos')}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                                                + Agregar primer registro
                                            </motion.button>
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
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Medicamentos Administrados</h3>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal('medicamentos')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg">
                                            <Plus size={16} /> Agregar Medicamento
                                        </motion.button>
                                    </div>
                                    {medicamentos.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                            <Pill size={56} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 mb-2">No hay medicamentos administrados</p>
                                            <p className="text-sm text-gray-400 mb-4">Registra los medicamentos que se le administran al paciente</p>
                                            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowAddModal('medicamentos')}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm">
                                                + Registrar medicamento
                                            </motion.button>
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
                                                        <p className="text-sm text-gray-500">Dosis: {med.Dosis} • Vía: {med.Via}</p>
                                                    </div>
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
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal('diagnosticos')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg">
                                            <Plus size={16} /> Agregar Diagnóstico
                                        </motion.button>
                                    </div>
                                    {diagnosticos.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                            <Stethoscope size={56} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 mb-2">No hay diagnósticos registrados</p>
                                            <p className="text-sm text-gray-400 mb-4">Registra los diagnósticos y cuidados requeridos para el paciente</p>
                                            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowAddModal('diagnosticos')}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
                                                + Agregar diagnóstico
                                            </motion.button>
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

// Modal para agregar signos vitales
function ModalAgregarSignos({ pacienteId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        Glucosa: '', Presion_sist: '', Presion_dias: '', Temperatura: '', Oxigeno: '', Evacuaciones: '', Mls_orina: '', Observaciones: ''
    })
    const [loading, setLoading] = useState(false)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Crear signos vitales
            const { data: signosData, error: signosError } = await supabase.from('Signos_Vitales').insert([{
                Glucosa: parseFloat(formData.Glucosa), Presion_sist: parseFloat(formData.Presion_sist),
                Presion_dias: parseFloat(formData.Presion_dias), Temperatura: parseFloat(formData.Temperatura),
                Oxigeno: parseFloat(formData.Oxigeno), Evacuaciones: parseInt(formData.Evacuaciones) || 0,
                Mls_orina: parseFloat(formData.Mls_orina) || 0, Hora_medicion: new Date().toISOString(),
                Observaciones: formData.Observaciones
            }]).select()
            if (signosError) throw signosError

            // Buscar asignación del enfermero actual
            const { data: asigData } = await supabase.from('Asignacion').select('ID').eq('ID_Enfermero', currentUser.ID).limit(1)

            // Crear registro de enfermería
            await supabase.from('Registro_Enfermeria').insert([{
                idPaciente: pacienteId, idAsignacion: asigData?.[0]?.ID || 1,
                fecha: new Date().toISOString(), observaciones: 'Registro de signos vitales',
                firmado: false, idSignosVitales: signosData[0].ID
            }])
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
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const med = medicamentos.find(m => m.ID === parseInt(formData.Medicamento_ID))
            // Crear administración de medicamento
            const { data: adminData, error: adminError } = await supabase.from('Administracion_Medicamento').insert([{
                Medicamento_ID: parseInt(formData.Medicamento_ID), Nombre: med?.Nombre,
                Fecha_hora: new Date().toISOString(), Dosis: parseFloat(formData.Dosis),
                Via: formData.Via, Observaciones: formData.Observaciones
            }]).select()
            if (adminError) throw adminError

            // Buscar asignación
            const { data: asigData } = await supabase.from('Asignacion').select('ID').eq('ID_Enfermero', currentUser.ID).limit(1)
            // Crear signos vitales vacíos
            const { data: signosData } = await supabase.from('Signos_Vitales').insert([{
                Glucosa: 0, Presion_sist: 0, Presion_dias: 0, Temperatura: 0, Oxigeno: 0, Evacuaciones: 0, Mls_orina: 0, Hora_medicion: new Date().toISOString()
            }]).select()

            // Crear registro
            await supabase.from('Registro_Enfermeria').insert([{
                idPaciente: pacienteId, idAdministracionMed: adminData[0].ID, idAsignacion: asigData?.[0]?.ID || 1,
                fecha: new Date().toISOString(), observaciones: `Medicamento: ${med?.Nombre}`,
                firmado: false, idSignosVitales: signosData[0].ID
            }])
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Crear cuidados
            const { data: cuidadosData, error: cuidadosError } = await supabase.from('Cuidados').insert([{
                Descripcion: formData.cuidadosDescripcion, Completado: false
            }]).select()
            if (cuidadosError) throw cuidadosError

            // Crear diagnóstico
            await supabase.from('Diagnostico').insert([{
                ID_Registro: parseInt(formData.ID_Registro), ID_Padecimiento: parseInt(formData.ID_Padecimiento),
                ID_Cuidados: cuidadosData[0].ID
            }])
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
                    {registros.length === 0 ? (
                        <div className="text-center py-4 text-yellow-600 bg-yellow-50 rounded-lg">
                            <p className="text-sm">Primero debes crear un registro de enfermería</p>
                        </div>
                    ) : (
                        <>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registro de Enfermería *</label>
                                <select required value={formData.ID_Registro} onChange={(e) => setFormData({ ...formData, ID_Registro: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                    <option value="">Seleccionar registro</option>
                                    {registros.map(r => <option key={r.ID} value={r.ID}>{new Date(r.fecha).toLocaleDateString()} - {new Date(r.fecha).toLocaleTimeString()}</option>)}
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
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Crear signos vitales vacíos
            const { data: signosData, error: signosError } = await supabase.from('Signos_Vitales').insert([{
                Glucosa: 0, Presion_sist: 0, Presion_dias: 0, Temperatura: 0, Oxigeno: 0, Evacuaciones: 0, Mls_orina: 0, Hora_medicion: new Date().toISOString()
            }]).select()
            if (signosError) throw signosError

            // Buscar asignación
            const { data: asigData } = await supabase.from('Asignacion').select('ID').eq('ID_Enfermero', currentUser.ID).limit(1)

            // Crear registro
            await supabase.from('Registro_Enfermeria').insert([{
                idPaciente: pacienteId, idAsignacion: asigData?.[0]?.ID || 1,
                fecha: new Date().toISOString(), observaciones: formData.observaciones,
                firmado: formData.firmado, idSignosVitales: signosData[0].ID
            }])
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
                    idPaciente: null,
                    fechaAsignacionPaciente: null
                }).eq('ID', camaAsignada.ID)
            }
            // Asignar nueva cama
            const { error } = await supabase.from('Cama').update({
                idPaciente: paciente.ID,
                fechaAsignacionPaciente: new Date().toISOString()
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
                idPaciente: null,
                fechaAsignacionPaciente: null,
                fechaSalidaPaciente: new Date().toISOString()
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
