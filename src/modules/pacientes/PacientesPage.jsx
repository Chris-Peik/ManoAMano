import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bed, User, FileText, Plus, X, Check, AlertCircle, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function PacientesPage() {
    const [pacientes, setPacientes] = useState([])
    const [camas, setCamas] = useState([])
    const [pisos, setPisos] = useState([])
    const [habitaciones, setHabitaciones] = useState([])
    const [registros, setRegistros] = useState([])
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
            const [pacRes, camaRes, pisoRes, habRes, regRes] = await Promise.all([
                supabase.from('Paciente').select('*'),
                supabase.from('Cama').select('*'),
                supabase.from('Piso').select('*'),
                supabase.from('Habitación').select('*'),
                supabase.from('Registro_Enfermeria').select('*').order('fecha', { ascending: false }).limit(50)
            ])
            if (pacRes.data) setPacientes(pacRes.data)
            if (camaRes.data) setCamas(camaRes.data)
            if (pisoRes.data) setPisos(pisoRes.data)
            if (habRes.data) setHabitaciones(habRes.data)
            if (regRes.data) setRegistros(regRes.data)
        } catch (error) {
            console.error('Error:', error)
        }
        setLoading(false)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    // Obtener pacientes por cama
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

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Pacientes</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Ver pacientes, registros de enfermería por turno</p>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('nuevoRegistro')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                    <FileText size={20} /> Nueva Hoja de Enfermería
                </motion.button>
            </div>

            {/* Filtro por piso */}
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
                    <h2 className="font-semibold text-gray-800 dark:text-white">Todos los Pacientes</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Identificación</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sexo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Edad</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
                            ) : filteredPacientes.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay pacientes</td></tr>
                            ) : (
                                filteredPacientes.map((pac, i) => {
                                    const edad = pac.F_nacimiento ? Math.floor((new Date() - new Date(pac.F_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : '-'
                                    return (
                                        <motion.tr key={pac.ID} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-semibold text-sm">
                                                        {pac.Nombre?.charAt(0)}
                                                    </div>
                                                    <span className="text-gray-800 dark:text-white">{pac.Nombre} {pac.A_Paterno} {pac.A_Materno}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{pac.Identificación}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{pac.Sexo}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{edad} años</td>
                                            <td className="px-6 py-4 text-right">
                                                <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setSelectedPaciente(pac); setShowModal('verPaciente') }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Ver detalles">
                                                    <User size={18} />
                                                </motion.button>
                                                <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setSelectedPaciente(pac); setShowModal('nuevoRegistro') }}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Nuevo registro">
                                                    <Activity size={18} />
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modales */}
            <AnimatePresence>
                {showModal === 'verPaciente' && selectedPaciente && (
                    <ModalVerPaciente paciente={selectedPaciente} registros={registros} onClose={() => { setShowModal(null); setSelectedPaciente(null) }} />
                )}
                {showModal === 'nuevoRegistro' && (
                    <ModalNuevoRegistro pacientes={pacientes} pacientePreseleccionado={selectedPaciente}
                        onClose={() => { setShowModal(null); setSelectedPaciente(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedPaciente(null); showToast('Registro guardado') }} />
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

function ModalVerPaciente({ paciente, registros, onClose }) {
    const registrosPaciente = registros.filter(r => r.idPaciente === paciente.ID)
    const edad = paciente.F_nacimiento ? Math.floor((new Date() - new Date(paciente.F_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : '-'

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Información del Paciente</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">{paciente.Nombre?.charAt(0)}</div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{paciente.Nombre} {paciente.A_Paterno} {paciente.A_Materno}</h3>
                            <p className="text-sm text-gray-500">{edad} años | {paciente.Sexo}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><span className="text-gray-500 block">ID</span><span className="font-medium text-gray-800 dark:text-white">{paciente.Identificación}</span></div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><span className="text-gray-500 block">Peso</span><span className="font-medium text-gray-800 dark:text-white">{paciente.Peso} kg</span></div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><span className="text-gray-500 block">Altura</span><span className="font-medium text-gray-800 dark:text-white">{paciente.Altura} cm</span></div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><span className="text-gray-500 block">Nacimiento</span><span className="font-medium text-gray-800 dark:text-white">{paciente.F_nacimiento}</span></div>
                    </div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Últimos Registros</h4>
                    {registrosPaciente.length === 0 ? (
                        <p className="text-gray-500 text-sm">Sin registros</p>
                    ) : (
                        <div className="space-y-2">
                            {registrosPaciente.slice(0, 5).map(reg => (
                                <div key={reg.ID} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">{new Date(reg.fecha).toLocaleDateString()}</span><span className={reg.firmado ? 'text-green-600' : 'text-yellow-600'}>{reg.firmado ? 'Firmado' : 'Pendiente'}</span></div>
                                    {reg.observaciones && <p className="text-gray-700 dark:text-gray-300 mt-1">{reg.observaciones}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

function ModalNuevoRegistro({ pacientes, pacientePreseleccionado, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        idPaciente: pacientePreseleccionado?.ID?.toString() || '',
        observaciones: '',
        firmado: false
    })
    const [loading, setLoading] = useState(false)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Primero crear signos vitales vacíos (simplificado)
            const { data: signosData, error: signosError } = await supabase.from('Signos_Vitales').insert([{
                Glucosa: 0, Presion_sist: 0, Presion_dias: 0, Temperatura: 0, Oxigeno: 0, Evacuaciones: 0, Mls_orina: 0, Hora_medicion: new Date().toISOString()
            }]).select()

            if (signosError) throw signosError

            // Obtener asignación del usuario actual
            const { data: asigData } = await supabase.from('Asignacion').select('*').eq('ID_Enfermero', currentUser.ID).limit(1)

            const { error } = await supabase.from('Registro_Enfermeria').insert([{
                idPaciente: parseInt(formData.idPaciente),
                idAsignacion: asigData?.[0]?.ID || 1,
                fecha: new Date().toISOString(),
                observaciones: formData.observaciones,
                firmado: formData.firmado,
                idSignosVitales: signosData[0].ID
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
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nueva Hoja de Enfermería</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente *</label>
                        <select required value={formData.idPaciente} onChange={(e) => setFormData({ ...formData, idPaciente: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {pacientes.map(p => <option key={p.ID} value={p.ID}>{p.Nombre} {p.A_Paterno}</option>)}
                        </select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                        <textarea rows={4} value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Notas del turno..." className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="firmado" checked={formData.firmado} onChange={(e) => setFormData({ ...formData, firmado: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="firmado" className="text-sm text-gray-700 dark:text-gray-300">Firmar registro</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

export default PacientesPage
