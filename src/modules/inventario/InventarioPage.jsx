import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Minus, AlertTriangle, Search, X, Check, AlertCircle, ArrowUpDown } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function InventarioPage() {
    const [inventario, setInventario] = useState([])
    const [movimientos, setMovimientos] = useState([])
    const [medicamentos, setMedicamentos] = useState([])
    const [pisos, setPisos] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPiso, setSelectedPiso] = useState('')
    const [showModal, setShowModal] = useState(null)
    const [selectedItem, setSelectedItem] = useState(null)
    const [toast, setToast] = useState(null)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [invRes, movRes, medRes, pisoRes] = await Promise.all([
                supabase.from('InventarioPiso').select('*'),
                supabase.from('MovimientoInventario').select('*').order('fecha', { ascending: false }).limit(50),
                supabase.from('Medicamento').select('*'),
                supabase.from('Piso').select('*')
            ])
            if (invRes.data) setInventario(invRes.data)
            if (movRes.data) setMovimientos(movRes.data)
            if (medRes.data) setMedicamentos(medRes.data)
            if (pisoRes.data) setPisos(pisoRes.data)
        } catch (error) { console.error(error) }
        setLoading(false)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const getInventarioFiltrado = () => {
        if (!selectedPiso) return inventario
        return inventario.filter(i => i.idPiso === parseInt(selectedPiso))
    }

    const getAlertasStock = () => inventario.filter(i => i.cantidad <= i.cantidadMinima)

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventario por Piso</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de medicamentos y materiales</p>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('movimiento')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                    <ArrowUpDown size={20} /> Registrar Movimiento
                </motion.button>
            </div>

            {/* Alertas de stock bajo */}
            {getAlertasStock().length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-medium mb-2">
                        <AlertTriangle size={20} /> Stock Bajo ({getAlertasStock().length} items)
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {getAlertasStock().map(item => {
                            const med = medicamentos.find(m => m.ID === item.idMedicamento)
                            return (
                                <span key={item.id} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800/50 rounded text-sm text-yellow-800 dark:text-yellow-300">
                                    {med?.Nombre}: {item.cantidad}/{item.cantidadMinima}
                                </span>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* Filtro por piso */}
            <div className="mb-6">
                <select value={selectedPiso} onChange={(e) => setSelectedPiso(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white">
                    <option value="">Todos los pisos</option>
                    {pisos.map(p => <option key={p.ID} value={p.ID}>Piso {p.Número}</option>)}
                </select>
            </div>

            {/* Grid de inventario */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {loading ? (
                    <p className="text-gray-500 col-span-3">Cargando...</p>
                ) : getInventarioFiltrado().length === 0 ? (
                    <p className="text-gray-500 col-span-3">No hay items en inventario</p>
                ) : (
                    getInventarioFiltrado().map(item => {
                        const med = medicamentos.find(m => m.ID === item.idMedicamento)
                        const piso = pisos.find(p => p.ID === item.idPiso)
                        const stockBajo = item.cantidad <= item.cantidadMinima
                        return (
                            <motion.div key={item.id} whileHover={{ scale: 1.02 }}
                                className={`p-4 rounded-xl border ${stockBajo ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <Package size={20} className={stockBajo ? 'text-yellow-600' : 'text-blue-600'} />
                                        <span className="text-xs text-gray-500">Piso {piso?.Número}</span>
                                    </div>
                                    {stockBajo && <AlertTriangle size={16} className="text-yellow-600" />}
                                </div>
                                <h3 className="font-semibold text-gray-800 dark:text-white">{med?.Nombre || 'Desconocido'}</h3>
                                <p className="text-sm text-gray-500 mt-1">{med?.Presentacion}</p>
                                <div className="flex justify-between items-center mt-4">
                                    <div>
                                        <span className={`text-2xl font-bold ${stockBajo ? 'text-yellow-600' : 'text-gray-800 dark:text-white'}`}>{item.cantidad}</span>
                                        <span className="text-sm text-gray-500 ml-1">/ {item.cantidadMinima} min</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setSelectedItem(item); setShowModal('entrada') }} className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg"><Plus size={16} /></button>
                                        <button onClick={() => { setSelectedItem(item); setShowModal('salida') }} className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"><Minus size={16} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>

            {/* Últimos movimientos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-800 dark:text-white">Últimos Movimientos</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {movimientos.slice(0, 10).map(mov => {
                        const inv = inventario.find(i => i.id === mov.idInventario)
                        const med = medicamentos.find(m => m.ID === inv?.idMedicamento)
                        return (
                            <div key={mov.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {mov.tipo === 'ENTRADA' ? <Plus size={16} /> : <Minus size={16} />}
                                    </div>
                                    <div>
                                        <p className="text-gray-800 dark:text-white font-medium">{med?.Nombre}</p>
                                        <p className="text-sm text-gray-500">{mov.motivo}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                        {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                                    </p>
                                    <p className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Modales */}
            <AnimatePresence>
                {(showModal === 'entrada' || showModal === 'salida') && selectedItem && (
                    <ModalMovimiento tipo={showModal === 'entrada' ? 'ENTRADA' : 'SALIDA'} item={selectedItem} medicamentos={medicamentos}
                        onClose={() => { setShowModal(null); setSelectedItem(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedItem(null); showToast('Movimiento registrado') }} />
                )}
                {showModal === 'movimiento' && (
                    <ModalMovimientoCompleto inventario={inventario} medicamentos={medicamentos} pisos={pisos}
                        onClose={() => setShowModal(null)}
                        onSuccess={() => { fetchData(); setShowModal(null); showToast('Movimiento registrado') }} />
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

function ModalMovimiento({ tipo, item, medicamentos, onClose, onSuccess }) {
    const [cantidad, setCantidad] = useState('')
    const [motivo, setMotivo] = useState('')
    const [loading, setLoading] = useState(false)
    const med = medicamentos.find(m => m.ID === item.idMedicamento)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const cantNum = parseInt(cantidad)
            const nuevaCantidad = tipo === 'ENTRADA' ? item.cantidad + cantNum : item.cantidad - cantNum

            await supabase.from('InventarioPiso').update({ cantidad: nuevaCantidad, fechaActualizacion: new Date().toISOString() }).eq('id', item.id)
            await supabase.from('MovimientoInventario').insert([{ idInventario: item.id, tipo, cantidad: cantNum, motivo, idEnfermero: currentUser.ID }])
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} de Stock</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-center py-2">
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">{med?.Nombre}</p>
                        <p className="text-sm text-gray-500">Stock actual: {item.cantidad}</p>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad *</label>
                        <input type="number" required min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white text-center text-xl" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                        <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Uso en paciente, Devolución..." className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className={`flex-1 py-2 text-white rounded-lg disabled:opacity-50 ${tipo === 'ENTRADA' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {loading ? 'Guardando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalMovimientoCompleto({ inventario, medicamentos, pisos, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ idInventario: '', tipo: 'SALIDA', cantidad: '', motivo: '' })
    const [loading, setLoading] = useState(false)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const item = inventario.find(i => i.id === parseInt(formData.idInventario))
            const cantNum = parseInt(formData.cantidad)
            const nuevaCantidad = formData.tipo === 'ENTRADA' ? item.cantidad + cantNum : item.cantidad - cantNum

            await supabase.from('InventarioPiso').update({ cantidad: nuevaCantidad }).eq('id', item.id)
            await supabase.from('MovimientoInventario').insert([{ idInventario: item.id, tipo: formData.tipo, cantidad: cantNum, motivo: formData.motivo, idEnfermero: currentUser.ID }])
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Registrar Movimiento</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item de Inventario *</label>
                        <select required value={formData.idInventario} onChange={(e) => setFormData({ ...formData, idInventario: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white">
                            <option value="">Seleccionar</option>
                            {inventario.map(i => {
                                const med = medicamentos.find(m => m.ID === i.idMedicamento)
                                const piso = pisos.find(p => p.ID === i.idPiso)
                                return <option key={i.id} value={i.id}>{med?.Nombre} - Piso {piso?.Número} ({i.cantidad})</option>
                            })}
                        </select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2"><input type="radio" name="tipo" value="ENTRADA" checked={formData.tipo === 'ENTRADA'} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="text-green-600" /><span className="text-gray-700 dark:text-gray-300">Entrada</span></label>
                            <label className="flex items-center gap-2"><input type="radio" name="tipo" value="SALIDA" checked={formData.tipo === 'SALIDA'} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="text-red-600" /><span className="text-gray-700 dark:text-gray-300">Salida</span></label>
                        </div></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad *</label>
                        <input type="number" required min="1" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                        <input type="text" value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-gray-800 dark:text-white" /></div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Guardando...' : 'Registrar'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

export default InventarioPage
