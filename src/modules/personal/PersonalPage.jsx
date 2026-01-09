import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, UserPlus, Edit, Trash2, Eye, X, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

// ID del cargo "Coordinador General" - ajustar según tu BD
const CARGO_COORDINADOR_GENERAL = 2

function PersonalPage() {
    const [enfermeros, setEnfermeros] = useState([])
    const [areas, setAreas] = useState([])
    const [turnos, setTurnos] = useState([])
    const [cargos, setCargos] = useState([])
    const [asignaciones, setAsignaciones] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(null)
    const [selectedEnfermero, setSelectedEnfermero] = useState(null)
    const [toast, setToast] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (user) setCurrentUser(JSON.parse(user))
        fetchData()
    }, [])

    const canEdit = () => currentUser?.idCargo === CARGO_COORDINADOR_GENERAL

    const fetchData = async () => {
        setLoading(true)
        try {
            const [enfRes, areaRes, turnoRes, cargoRes, asigRes] = await Promise.all([
                supabase.from('Enfermero').select('*'),
                supabase.from('Área').select('*'),
                supabase.from('Turno').select('*'),
                supabase.from('Cargo').select('*'),
                supabase.from('Asignacion').select('*')
            ])
            if (enfRes.data) setEnfermeros(enfRes.data)
            if (areaRes.data) setAreas(areaRes.data)
            if (turnoRes.data) setTurnos(turnoRes.data)
            if (cargoRes.data) setCargos(cargoRes.data)
            if (asigRes.data) setAsignaciones(asigRes.data)
        } catch (error) {
            console.error('Error fetching data:', error)
            showToast('Error al cargar datos', 'error')
        }
        setLoading(false)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleDelete = async (enfermero) => {
        if (!confirm(`¿Estás seguro de eliminar a ${enfermero.nombre} ${enfermero.apellidoPaterno}?`)) return
        try {
            const { error } = await supabase.from('Enfermero').delete().eq('ID', enfermero.ID)
            if (error) throw error
            fetchData()
            showToast('Enfermero eliminado correctamente')
        } catch (err) {
            showToast('Error al eliminar: ' + err.message, 'error')
        }
    }

    const getAsignacionActual = (enfermeroId) => {
        return asignaciones.find(a => a.ID_Enfermero === enfermeroId)
    }

    const filteredEnfermeros = enfermeros.filter(enf =>
        `${enf.nombre} ${enf.apellidoPaterno} ${enf.apellidoMaterno}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enf.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Personal</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {canEdit() && <span className="text-xs text-green-500">(Modo Coordinador)</span>}
                    </p>
                </div>
                {canEdit() && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('nuevo')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        <UserPlus size={20} /> Nuevo Enfermero
                    </motion.button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white" />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Correo</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cargo</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
                            ) : filteredEnfermeros.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No se encontraron enfermeros</td></tr>
                            ) : (
                                filteredEnfermeros.map((enf, index) => {
                                    return (
                                        <motion.tr key={enf.ID} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                                                        {enf.nombre?.charAt(0)}
                                                    </div>
                                                    <p className="font-medium text-gray-800 dark:text-white">{enf.nombre} {enf.apellidoPaterno}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{enf.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                                    {cargos.find(c => c.ID === enf.idCargo)?.Nombre_Cargo || 'Sin cargo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setSelectedEnfermero(enf); setShowModal('ver') }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Ver"><Eye size={18} /></motion.button>
                                                    {canEdit() && (
                                                        <>
                                                            <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setSelectedEnfermero(enf); setShowModal('editar') }}
                                                                className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg" title="Editar"><Edit size={18} /></motion.button>
                                                            <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(enf)}
                                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Eliminar"><Trash2 size={18} /></motion.button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showModal === 'nuevo' && <FormEnfermero cargos={cargos} enfermeros={enfermeros} onClose={() => setShowModal(null)} onSuccess={() => { fetchData(); setShowModal(null); showToast('Enfermero registrado') }} />}
                {showModal === 'editar' && selectedEnfermero && <FormEnfermero enfermero={selectedEnfermero} cargos={cargos} enfermeros={enfermeros} onClose={() => { setShowModal(null); setSelectedEnfermero(null) }} onSuccess={() => { fetchData(); setShowModal(null); setSelectedEnfermero(null); showToast('Enfermero actualizado') }} />}
                {showModal === 'ver' && selectedEnfermero && <ModalVerEnfermero enfermero={selectedEnfermero} cargos={cargos} enfermeros={enfermeros} areas={areas} turnos={turnos} asignaciones={asignaciones} onClose={() => { setShowModal(null); setSelectedEnfermero(null) }} />}

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

function FormEnfermero({ enfermero, cargos, enfermeros, onClose, onSuccess }) {
    const isEditing = !!enfermero
    const [formData, setFormData] = useState({
        nombre: enfermero?.nombre || '', apellidoPaterno: enfermero?.apellidoPaterno || '', apellidoMaterno: enfermero?.apellidoMaterno || '',
        email: enfermero?.email || '', password: '', licencia: enfermero?.licencia?.toString() || '',
        idCargo: enfermero?.idCargo?.toString() || '', idSupervisor: enfermero?.idSupervisor?.toString() || ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const data = {
                nombre: formData.nombre, apellidoPaterno: formData.apellidoPaterno, apellidoMaterno: formData.apellidoMaterno || null,
                email: formData.email, licencia: parseInt(formData.licencia), idCargo: parseInt(formData.idCargo), idSupervisor: parseInt(formData.idSupervisor) || 1
            }
            if (formData.password) data.password = formData.password
            else if (!isEditing) throw new Error('La contraseña es requerida')
            const result = isEditing ? await supabase.from('Enfermero').update(data).eq('ID', enfermero.ID) : await supabase.from('Enfermero').insert([data])
            if (result.error) throw result.error
            onSuccess()
        } catch (err) { setError(err.message || 'Error al guardar') }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{isEditing ? 'Editar' : 'Nuevo'} Enfermero</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                            <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido Paterno *</label>
                            <input type="text" required value={formData.apellidoPaterno} onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido Materno</label>
                        <input type="text" value={formData.apellidoMaterno} onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                        <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña {isEditing ? '(opcional)' : '*'}</label>
                        <input type="password" required={!isEditing} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Licencia *</label>
                        <input type="number" required value={formData.licencia} onChange={(e) => setFormData({ ...formData, licencia: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo *</label>
                            <select required value={formData.idCargo} onChange={(e) => setFormData({ ...formData, idCargo: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white">
                                <option value="">Seleccionar</option>
                                {cargos.map(c => <option key={c.ID} value={c.ID}>{c.Nombre_Cargo}</option>)}
                            </select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor</label>
                            <select value={formData.idSupervisor} onChange={(e) => setFormData({ ...formData, idSupervisor: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white">
                                <option value="">Sin supervisor</option>
                                {enfermeros.filter(e => e.ID !== enfermero?.ID).map(e => <option key={e.ID} value={e.ID}>{e.nombre} {e.apellidoPaterno}</option>)}
                            </select></div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalAsignar({ enfermero, areas, turnos, asignacionActual, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ idArea: asignacionActual?.ID_Area?.toString() || '', idTurno: asignacionActual?.ID_Turno?.toString() || '', esFija: asignacionActual?.Es_fija || false })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const data = { ID_Enfermero: enfermero.ID, ID_Area: parseInt(formData.idArea), ID_Turno: parseInt(formData.idTurno), Fecha_modificacion: new Date().toISOString(), Es_fija: formData.esFija }
            if (asignacionActual) {
                const { error } = await supabase.from('Asignacion').update(data).eq('ID', asignacionActual.ID)
                if (error) throw error
            } else {
                const { error } = await supabase.from('Asignacion').insert([data])
                if (error) throw error
            }
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Asignar Turno/Área</h2>
                        <p className="text-sm text-gray-500">{enfermero.nombre} {enfermero.apellidoPaterno}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área *</label>
                        <select required value={formData.idArea} onChange={(e) => setFormData({ ...formData, idArea: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {areas.map(a => <option key={a.ID} value={a.ID}>{a.Nombre}</option>)}
                        </select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turno *</label>
                        <select required value={formData.idTurno} onChange={(e) => setFormData({ ...formData, idTurno: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {turnos.map(t => <option key={t.ID} value={t.ID}>{t.Nombre}</option>)}
                        </select></div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="esFija" checked={formData.esFija} onChange={(e) => setFormData({ ...formData, esFija: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="esFija" className="text-sm text-gray-700 dark:text-gray-300">Asignación fija</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalVerEnfermero({ enfermero, cargos, enfermeros, areas, turnos, asignaciones, onClose }) {
    const cargo = cargos.find(c => c.ID === enfermero.idCargo)
    const supervisor = enfermeros.find(e => e.ID === enfermero.idSupervisor)
    const asig = asignaciones.find(a => a.ID_Enfermero === enfermero.ID)
    const area = areas.find(a => a.ID === asig?.ID_Area)
    const turno = turnos.find(t => t.ID === asig?.ID_Turno)

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Detalles</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 text-2xl font-bold">{enfermero.nombre?.charAt(0)}</div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{enfermero.nombre} {enfermero.apellidoPaterno}</h3>
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600">{cargo?.Nombre_Cargo}</span>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Email</span><span className="text-gray-800 dark:text-white">{enfermero.email}</span></div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Licencia</span><span className="text-gray-800 dark:text-white">{enfermero.licencia}</span></div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Supervisor</span><span className="text-gray-800 dark:text-white">{supervisor ? `${supervisor.nombre} ${supervisor.apellidoPaterno}` : '-'}</span></div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Área</span><span className="text-gray-800 dark:text-white">{area?.Nombre || 'Sin asignar'}</span></div>
                        <div className="flex justify-between py-2"><span className="text-gray-500">Turno</span><span className="text-gray-800 dark:text-white">{turno?.Nombre || 'Sin asignar'}</span></div>
                    </div>
                </div>
                <div className="p-6 pt-0"><button onClick={onClose} className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg">Cerrar</button></div>
            </motion.div>
        </motion.div>
    )
}

export default PersonalPage
