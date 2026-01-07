import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Plus, Users, Calendar, FileText, X, Check, AlertCircle, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function CapacitacionPage() {
    const [cursos, setCursos] = useState([])
    const [inscripciones, setInscripciones] = useState([])
    const [evidencias, setEvidencias] = useState([])
    const [enfermeros, setEnfermeros] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(null)
    const [selectedCurso, setSelectedCurso] = useState(null)
    const [toast, setToast] = useState(null)
    const [tabActiva, setTabActiva] = useState('cursos')
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const canEdit = currentUser?.idCargo === 2

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [cursoRes, inscRes, evRes, enfRes] = await Promise.all([
                supabase.from('CursoCapacitacion').select('*').order('fechaInicio', { ascending: false }),
                supabase.from('InscripcionCurso').select('*'),
                supabase.from('EvidenciaCharla').select('*').order('fecha', { ascending: false }),
                supabase.from('Enfermero').select('*')
            ])
            if (cursoRes.data) setCursos(cursoRes.data)
            if (inscRes.data) setInscripciones(inscRes.data)
            if (evRes.data) setEvidencias(evRes.data)
            if (enfRes.data) setEnfermeros(enfRes.data)
        } catch (error) { console.error(error) }
        setLoading(false)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const getInscritosCurso = (cursoId) => inscripciones.filter(i => i.idCurso === cursoId).length

    const handleInscribirse = async (cursoId) => {
        try {
            const yaInscrito = inscripciones.some(i => i.idCurso === cursoId && i.idEnfermero === currentUser.ID)
            if (yaInscrito) { showToast('Ya estás inscrito', 'error'); return }
            const { error } = await supabase.from('InscripcionCurso').insert([{ idCurso: cursoId, idEnfermero: currentUser.ID }])
            if (error) throw error
            fetchData()
            showToast('Inscripción exitosa')
        } catch (err) { console.error(err) }
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Capacitación</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Cursos, inscripciones y evidencias de charlas</p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowModal('nuevoCurso')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                            <Plus size={20} /> Nuevo Curso
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowModal('nuevaEvidencia')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                            <FileText size={20} /> Registrar Charla
                        </motion.button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                {['cursos', 'evidencias', 'misInscripciones'].map(tab => (
                    <button key={tab} onClick={() => setTabActiva(tab)}
                        className={`px-4 py-2 font-medium transition-colors ${tabActiva === tab
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'}`}>
                        {tab === 'cursos' ? 'Cursos' : tab === 'evidencias' ? 'Evidencias Charlas' : 'Mis Inscripciones'}
                    </button>
                ))}
            </div>

            {/* Cursos */}
            {tabActiva === 'cursos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <p className="text-gray-500 col-span-3">Cargando...</p>
                    ) : cursos.length === 0 ? (
                        <p className="text-gray-500 col-span-3">No hay cursos disponibles</p>
                    ) : (
                        cursos.map(curso => {
                            const inscritos = getInscritosCurso(curso.id)
                            const estaInscrito = inscripciones.some(i => i.idCurso === curso.id && i.idEnfermero === currentUser.ID)
                            const lleno = curso.cupoMaximo && inscritos >= curso.cupoMaximo
                            return (
                                <motion.div key={curso.id} whileHover={{ scale: 1.02 }}
                                    className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                            <GraduationCap size={20} className="text-blue-600" />
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${curso.estado === 'ABIERTO' ? 'bg-green-100 text-green-600' :
                                                curso.estado === 'CERRADO' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                            }`}>{curso.estado}</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{curso.nombre}</h3>
                                    {curso.descripcion && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{curso.descripcion}</p>}
                                    <div className="mt-4 space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-500"><Calendar size={14} /> {curso.fechaInicio} - {curso.fechaFin || 'TBD'}</div>
                                        {curso.instructor && <div className="flex items-center gap-2 text-gray-500"><Users size={14} /> {curso.instructor}</div>}
                                        <div className="flex items-center gap-2 text-gray-500"><UserPlus size={14} /> {inscritos}{curso.cupoMaximo ? `/${curso.cupoMaximo}` : ''} inscritos</div>
                                    </div>
                                    <div className="mt-4">
                                        {estaInscrito ? (
                                            <span className="block text-center py-2 text-green-600 font-medium">✓ Inscrito</span>
                                        ) : curso.estado === 'ABIERTO' && !lleno ? (
                                            <button onClick={() => handleInscribirse(curso.id)}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Inscribirse</button>
                                        ) : (
                                            <span className="block text-center py-2 text-gray-400">{lleno ? 'Cupo lleno' : 'No disponible'}</span>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Evidencias de charlas */}
            {tabActiva === 'evidencias' && (
                <div className="space-y-4">
                    {evidencias.length === 0 ? (
                        <p className="text-gray-500">No hay evidencias registradas</p>
                    ) : (
                        evidencias.map(ev => {
                            const registrador = enfermeros.find(e => e.ID === ev.idEnfermeroRegistra)
                            return (
                                <div key={ev.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white">{ev.titulo}</h3>
                                            {ev.descripcion && <p className="text-sm text-gray-500 mt-1">{ev.descripcion}</p>}
                                        </div>
                                        <span className="text-sm text-gray-500">{ev.fecha}</span>
                                    </div>
                                    {registrador && <p className="text-xs text-gray-400 mt-2">Registrado por: {registrador.nombre} {registrador.apellidoPaterno}</p>}
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Mis inscripciones */}
            {tabActiva === 'misInscripciones' && (
                <div className="space-y-4">
                    {inscripciones.filter(i => i.idEnfermero === currentUser.ID).length === 0 ? (
                        <p className="text-gray-500">No estás inscrito en ningún curso</p>
                    ) : (
                        inscripciones.filter(i => i.idEnfermero === currentUser.ID).map(insc => {
                            const curso = cursos.find(c => c.id === insc.idCurso)
                            return (
                                <div key={insc.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{curso?.nombre}</h3>
                                        <p className="text-sm text-gray-500">{curso?.fechaInicio} - {curso?.fechaFin}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${insc.completado ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        {insc.completado ? 'Completado' : 'En curso'}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Modales */}
            <AnimatePresence>
                {showModal === 'nuevoCurso' && (
                    <ModalNuevoCurso onClose={() => setShowModal(null)} onSuccess={() => { fetchData(); setShowModal(null); showToast('Curso creado') }} />
                )}
                {showModal === 'nuevaEvidencia' && (
                    <ModalNuevaEvidencia enfermeros={enfermeros} currentUser={currentUser}
                        onClose={() => setShowModal(null)} onSuccess={() => { fetchData(); setShowModal(null); showToast('Evidencia registrada') }} />
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

function ModalNuevoCurso({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', cupoMaximo: '', instructor: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('CursoCapacitacion').insert([{
                nombre: formData.nombre, descripcion: formData.descripcion || null, fechaInicio: formData.fechaInicio,
                fechaFin: formData.fechaFin || null, cupoMaximo: formData.cupoMaximo ? parseInt(formData.cupoMaximo) : null, instructor: formData.instructor || null
            }])
            if (error) throw error
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nuevo Curso</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                        <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                        <textarea rows={3} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio *</label>
                            <input type="date" required value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
                            <input type="date" value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cupo Máximo</label>
                            <input type="number" value={formData.cupoMaximo} onChange={(e) => setFormData({ ...formData, cupoMaximo: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructor</label>
                            <input type="text" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Creando...' : 'Crear Curso'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalNuevaEvidencia({ enfermeros, currentUser, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ titulo: '', descripcion: '', fecha: new Date().toISOString().split('T')[0] })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('EvidenciaCharla').insert([{
                titulo: formData.titulo, descripcion: formData.descripcion || null, fecha: formData.fecha, idEnfermeroRegistra: currentUser.ID
            }])
            if (error) throw error
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Registrar Evidencia de Charla</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                        <input type="text" required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                        <textarea rows={3} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha *</label>
                        <input type="date" required value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Registrar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

export default CapacitacionPage
