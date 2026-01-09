import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Plus, Users, Calendar, X, Check, AlertCircle, UserPlus, Edit3, UserMinus, Eye, Upload, Image } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { FileUpload, FileUploadDropzone, FileUploadTrigger, FileUploadList, FileUploadItem, FileUploadItemPreview, FileUploadItemMetadata, FileUploadItemDelete } from '@/components/ui/file-upload'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

function CapacitacionPage() {
    const [cursos, setCursos] = useState([])
    const [inscripciones, setInscripciones] = useState([])
    const [evidencias, setEvidencias] = useState([])
    const [enfermeros, setEnfermeros] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(null)
    const [selectedCurso, setSelectedCurso] = useState(null)
    const [selectedInscripcion, setSelectedInscripcion] = useState(null)
    const [toast, setToast] = useState(null)
    const [tabActiva, setTabActiva] = useState('cursos')
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const canManageCourses = hasPermission(currentUser, PERMISSIONS.CAN_MANAGE_COURSES)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [cursoRes, inscRes, evRes, enfRes] = await Promise.all([
                supabase.from('CursoCapacitacion').select('*').order('fechaInicio', { ascending: false }),
                supabase.from('InscripcionCurso').select('*'),
                supabase.from('EvidenciaCharla').select('*').order('fechaSubida', { ascending: false }),
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

    const handleDesuscribirse = async (cursoId) => {
        if (!confirm('¿Estás seguro de desuscribirte de este curso?')) return
        try {
            const inscripcion = inscripciones.find(i => i.idCurso === cursoId && i.idEnfermero === currentUser.ID)
            if (!inscripcion) { showToast('No estás inscrito', 'error'); return }
            const { error } = await supabase.from('InscripcionCurso').delete().eq('id', inscripcion.id)
            if (error) throw error
            fetchData()
            showToast('Te has desuscrito del curso')
        } catch (err) { console.error(err); showToast('Error al desuscribirse', 'error') }
    }

    const getEnfermerosInscritos = (cursoId) => {
        return inscripciones.filter(i => i.idCurso === cursoId).map(i => ({
            ...enfermeros.find(e => e.ID === i.idEnfermero),
            inscripcionId: i.id,
            evidencia: evidencias.find(ev => ev.idInscripcion === i.id)
        })).filter(e => e.ID)
    }

    const getEvidenciaInscripcion = (inscripcionId) => {
        return evidencias.find(ev => ev.idInscripcion === inscripcionId)
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Capacitación</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Cursos de capacitación y evidencias</p>
                </div>
                {canManageCourses && (
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowModal('nuevoCurso')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                        <Plus size={20} /> Nuevo Curso
                    </motion.button>
                )}
            </div>


            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                {['cursos', 'misInscripciones'].map(tab => (
                    <button key={tab} onClick={() => setTabActiva(tab)}
                        className={`px-4 py-2 font-medium transition-colors ${tabActiva === tab
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'}`}>
                        {tab === 'cursos' ? 'Cursos' : 'Mis Inscripciones'}
                    </button>
                ))}
            </div>

            {/* Cursos */}
            {
                tabActiva === 'cursos' && (
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
                                        className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                <GraduationCap size={20} className="text-blue-600" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canManageCourses && (
                                                    <button onClick={() => { setSelectedCurso(curso); setShowModal('editarCurso') }}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Editar">
                                                        <Edit3 size={16} className="text-gray-500" />
                                                    </button>
                                                )}
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${curso.estado === 'ABIERTO' ? 'bg-green-100 text-green-600' :
                                                    curso.estado === 'CERRADO' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                                    }`}>{curso.estado}</span>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{curso.nombre}</h3>
                                        {curso.descripcion && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{curso.descripcion}</p>}
                                        <div className="mt-4 space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-500"><Calendar size={14} /> {curso.fechaInicio} - {curso.fechaFin || 'TBD'}</div>
                                            {curso.instructor && <div className="flex items-center gap-2 text-gray-500"><Users size={14} /> {curso.instructor}</div>}
                                            <button onClick={() => { setSelectedCurso(curso); setShowModal('verInscritos') }}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline">
                                                <UserPlus size={14} /> {inscritos}{curso.cupoMaximo ? `/${curso.cupoMaximo}` : ''} inscritos
                                                <Eye size={12} />
                                            </button>
                                        </div>
                                        <div className="mt-auto pt-4">
                                            {estaInscrito ? (
                                                <div className="flex gap-2">
                                                    <span className="flex-1 text-center py-2 text-green-600 font-medium bg-green-50 dark:bg-green-900/20 rounded-lg">✓ Inscrito</span>
                                                    <button onClick={() => handleDesuscribirse(curso.id)}
                                                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg" title="Desuscribirse">
                                                        <UserMinus size={18} />
                                                    </button>
                                                </div>
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
                )
            }

            {/* Mis inscripciones */}
            {
                tabActiva === 'misInscripciones' && (
                    <div className="space-y-4">
                        {inscripciones.filter(i => i.idEnfermero === currentUser.ID).length === 0 ? (
                            <p className="text-gray-500">No estás inscrito en ningún curso</p>
                        ) : (
                            inscripciones.filter(i => i.idEnfermero === currentUser.ID).map(insc => {
                                const curso = cursos.find(c => c.id === insc.idCurso)
                                const evidencia = getEvidenciaInscripcion(insc.id)
                                const cursoFinalizado = curso?.estado === 'FINALIZADO'
                                return (
                                    <div key={insc.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-800 dark:text-white">{curso?.nombre}</h3>
                                                <p className="text-sm text-gray-500">{curso?.fechaInicio} - {curso?.fechaFin}</p>
                                            </div>
                                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${curso?.estado === 'FINALIZADO' ? 'bg-purple-100 text-purple-600' :
                                                insc.completado ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                {curso?.estado === 'FINALIZADO' ? 'Finalizado' : insc.completado ? 'Completado' : 'En curso'}
                                            </span>
                                        </div>

                                        {/* Acciones para cursos finalizados */}
                                        {cursoFinalizado && (
                                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                                {evidencia ? (
                                                    <button onClick={() => { setSelectedInscripcion({ ...insc, curso, evidencia }); setShowModal('verEvidencia') }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium">
                                                        <Eye size={16} /> Ver mis evidencias ({[evidencia.urlFoto1, evidencia.urlFoto2, evidencia.urlFoto3].filter(Boolean).length} fotos)
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { setSelectedInscripcion({ ...insc, curso }); setShowModal('subirEvidencia') }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                                                        <Upload size={16} /> Subir evidencias (máx. 3 fotos)
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )
            }

            {/* Modales */}
            <AnimatePresence>
                {showModal === 'nuevoCurso' && (
                    <ModalNuevoCurso onClose={() => setShowModal(null)} onSuccess={() => { fetchData(); setShowModal(null); showToast('Curso creado') }} />
                )}
                {showModal === 'editarCurso' && selectedCurso && (
                    <ModalEditarCurso curso={selectedCurso} onClose={() => { setShowModal(null); setSelectedCurso(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedCurso(null); showToast('Curso actualizado') }} />
                )}
                {showModal === 'verInscritos' && selectedCurso && (
                    <ModalVerInscritos curso={selectedCurso} inscritos={getEnfermerosInscritos(selectedCurso.id)}
                        onClose={() => { setShowModal(null); setSelectedCurso(null) }} />
                )}
                {showModal === 'subirEvidencia' && selectedInscripcion && (
                    <ModalSubirEvidencia inscripcion={selectedInscripcion}
                        onClose={() => { setShowModal(null); setSelectedInscripcion(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedInscripcion(null); showToast('Evidencias subidas correctamente') }} />
                )}
                {showModal === 'verEvidencia' && selectedInscripcion && (
                    <ModalVerEvidencia inscripcion={selectedInscripcion}
                        onClose={() => { setShowModal(null); setSelectedInscripcion(null) }} />
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
        </div >
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

function ModalSubirEvidencia({ inscripcion, onClose, onSuccess }) {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(false)

    const onFileReject = useCallback((file, message) => {
        alert(`${message}: ${file.name}`)
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (files.length === 0) return
        setLoading(true)
        try {
            const urls = []
            for (const file of files) {
                const fileName = `${inscripcion.id}_${Date.now()}_${file.name}`
                const { error } = await supabase.storage.from('evidencias-charlas').upload(fileName, file)
                if (error) throw error
                const { data: { publicUrl } } = supabase.storage.from('evidencias-charlas').getPublicUrl(fileName)
                urls.push(publicUrl)
            }

            const { error } = await supabase.from('EvidenciaCharla').insert([{
                idInscripcion: inscripcion.id,
                urlFoto1: urls[0] || null,
                urlFoto2: urls[1] || null,
                urlFoto3: urls[2] || null
            }])
            if (error) throw error
            onSuccess()
        } catch (err) { console.error(err); alert('Error al subir evidencias') }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Subir Evidencias</h2>
                        <p className="text-sm text-gray-500">{inscripcion.curso?.nombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <FileUpload
                        maxFiles={3}
                        maxSize={5 * 1024 * 1024}
                        value={files}
                        onValueChange={setFiles}
                        onFileReject={onFileReject}
                        accept="image/*"
                    >
                        <FileUploadDropzone>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 p-2.5">
                                    <Upload className="size-6 text-gray-400" />
                                </div>
                                <p className="font-medium text-sm text-gray-700 dark:text-gray-200">Arrastra y suelta tus fotos aquí</p>
                                <p className="text-gray-500 text-xs">O haz clic para buscar (máx. 3 archivos, hasta 5MB c/u)</p>
                            </div>
                            <FileUploadTrigger asChild>
                                <Button variant="outline" size="sm" className="mt-3">
                                    Seleccionar archivos
                                </Button>
                            </FileUploadTrigger>
                        </FileUploadDropzone>
                    </FileUpload>

                    {/* Preview grid como antes */}
                    {files.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                            {files.map((file, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                                    <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
                        <Button type="submit" disabled={loading || files.length === 0} className="flex-1">
                            {loading ? 'Subiendo...' : `Subir ${files.length} foto${files.length !== 1 ? 's' : ''}`}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalVerEvidencia({ inscripcion, onClose }) {
    const fotos = [inscripcion.evidencia?.urlFoto1, inscripcion.evidencia?.urlFoto2, inscripcion.evidencia?.urlFoto3].filter(Boolean)
    const [selectedIdx, setSelectedIdx] = useState(0)

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Evidencias del Curso</h2>
                        <p className="text-sm text-gray-500">{inscripcion.curso?.nombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-4">
                    {fotos.length > 0 ? (
                        <>
                            <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden mb-4">
                                <img src={fotos[selectedIdx]} alt={`Evidencia ${selectedIdx + 1}`} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex gap-2 justify-center">
                                {fotos.map((foto, idx) => (
                                    <button key={idx} onClick={() => setSelectedIdx(idx)}
                                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedIdx === idx ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}>
                                        <img src={foto} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Image size={48} className="mx-auto mb-3 text-gray-300" />
                            <p>No hay evidencias subidas</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

function ModalEditarCurso({ curso, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        nombre: curso.nombre || '',
        descripcion: curso.descripcion || '',
        fechaInicio: curso.fechaInicio || '',
        fechaFin: curso.fechaFin || '',
        cupoMaximo: curso.cupoMaximo || '',
        instructor: curso.instructor || '',
        estado: curso.estado || 'ABIERTO'
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('CursoCapacitacion').update({
                nombre: formData.nombre,
                descripcion: formData.descripcion || null,
                fechaInicio: formData.fechaInicio,
                fechaFin: formData.fechaFin || null,
                cupoMaximo: formData.cupoMaximo ? parseInt(formData.cupoMaximo) : null,
                instructor: formData.instructor || null,
                estado: formData.estado
            }).eq('id', curso.id)
            if (error) throw error
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Editar Curso</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                        <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                        <textarea rows={3} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white resize-none"></textarea></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio *</label>
                            <input type="date" required value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
                            <input type="date" value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cupo Máximo</label>
                            <input type="number" value={formData.cupoMaximo} onChange={(e) => setFormData({ ...formData, cupoMaximo: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                            <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                                <option value="ABIERTO">Abierto</option>
                                <option value="CERRADO">Cerrado</option>
                                <option value="FINALIZADO">Finalizado</option>
                            </select></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructor</label>
                        <input type="text" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalVerInscritos({ curso, inscritos, onClose }) {
    const [selectedEnf, setSelectedEnf] = useState(null)

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Enfermeros Inscritos</h2>
                        <p className="text-sm text-gray-500">{curso.nombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {inscritos.length === 0 ? (
                        <div className="text-center py-8">
                            <Users size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">No hay enfermeros inscritos</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {inscritos.map(enf => {
                                const tieneEvidencia = enf.evidencia && (enf.evidencia.urlFoto1 || enf.evidencia.urlFoto2 || enf.evidencia.urlFoto3)
                                return (
                                    <div key={enf.ID} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-semibold">
                                                {enf.nombre?.charAt(0)}{enf.apellidoPaterno?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800 dark:text-white">{enf.nombre} {enf.apellidoPaterno} {enf.apellidoMaterno}</p>
                                                <p className="text-sm text-gray-500">{enf.correoElectronico}</p>
                                            </div>
                                            {tieneEvidencia && (
                                                <button onClick={() => setSelectedEnf(enf)} className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg" title="Ver evidencias">
                                                    <Image size={18} />
                                                </button>
                                            )}
                                        </div>
                                        {/* Mini preview de evidencias */}
                                        {selectedEnf?.ID === enf.ID && tieneEvidencia && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[enf.evidencia.urlFoto1, enf.evidencia.urlFoto2, enf.evidencia.urlFoto3].filter(Boolean).map((url, idx) => (
                                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:opacity-80 transition-opacity">
                                                            <img src={url} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-center text-sm text-gray-500">Total: {inscritos.length} enfermero{inscritos.length !== 1 ? 's' : ''}</p>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default CapacitacionPage


