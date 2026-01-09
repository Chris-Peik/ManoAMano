import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Minus, AlertTriangle, Search, X, Check, AlertCircle, ArrowUpDown, Edit3, Trash2, Pill, FlaskConical, User } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { Slider } from '@/components/ui/slider'

function InventarioPage() {
    const [inventario, setInventario] = useState([])
    const [movimientos, setMovimientos] = useState([])
    const [medicamentos, setMedicamentos] = useState([])
    const [pisos, setPisos] = useState([])
    const [pacientes, setPacientes] = useState([])
    const [registros, setRegistros] = useState([])
    const [camas, setCamas] = useState([])
    const [habitaciones, setHabitaciones] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPiso, setSelectedPiso] = useState('')
    const [showModal, setShowModal] = useState(null)
    const [selectedItem, setSelectedItem] = useState(null)
    const [selectedMedicamento, setSelectedMedicamento] = useState(null)
    const [selectedMovimiento, setSelectedMovimiento] = useState(null)
    const [toast, setToast] = useState(null)
    const [activeTab, setActiveTab] = useState('inventario') // 'inventario' | 'medicamentos'
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const canManageInventory = hasPermission(currentUser, PERMISSIONS.CAN_MANAGE_INVENTORY)
    const canReturnItems = hasPermission(currentUser, PERMISSIONS.CAN_RETURN_ITEMS)
    const canDispense = hasPermission(currentUser, PERMISSIONS.CAN_ADD_MEDICATION)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [invRes, movRes, medRes, pisoRes, pacRes, regRes, camaRes, habRes] = await Promise.all([
                supabase.from('InventarioPiso').select('*'),
                supabase.from('MovimientoInventario').select('*').order('fecha', { ascending: false }).limit(50),
                supabase.from('Medicamento').select('*'),
                supabase.from('Piso').select('*'),
                supabase.from('Paciente').select('*'),
                supabase.from('Registro_Enfermeria').select('*'),
                supabase.from('Cama').select('*'),
                supabase.from('Habitación').select('*')
            ])
            if (invRes.data) setInventario(invRes.data)
            if (movRes.data) setMovimientos(movRes.data)
            if (medRes.data) setMedicamentos(medRes.data)
            if (pisoRes.data) setPisos(pisoRes.data)
            if (pacRes.data) setPacientes(pacRes.data)
            if (regRes.data) setRegistros(regRes.data)
            if (camaRes.data) setCamas(camaRes.data)
            if (habRes.data) setHabitaciones(habRes.data)
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



    const getPisosEnfermeroActual = () => {
        if (canManageInventory) return [] // Si es manager, no filtramos por pisos activos
        const misRegistros = registros.filter(r => r.idEnfermero === currentUser.ID && r.activo)
        const misPacientesIds = misRegistros.map(r => r.idPaciente)
        const misCamas = camas.filter(c => misPacientesIds.includes(c.idPaciente))
        const misHabitaciones = habitaciones.filter(h => misCamas.some(c => c.idHabitacion === h.ID))
        const misPisosIds = misHabitaciones.map(h => h.ID_Piso)
        return [...new Set(misPisosIds)]
    }

    const getPacientesPermitidos = () => {
        if (canManageInventory) return pacientes
        const misRegistros = registros.filter(r => r.idEnfermero === currentUser.ID && r.activo)
        return pacientes.filter(p => misRegistros.some(r => r.idPaciente === p.ID))
    }

    const handleDeleteMovimiento = async (mov) => {
        if (!confirm('¿Estás seguro de eliminar este movimiento? El inventario se ajustará automáticamente.')) return
        try {
            // Reverse the inventory change
            const item = inventario.find(i => i.id === mov.idInventario)
            if (item) {
                const nuevaCantidad = mov.tipo === 'ENTRADA'
                    ? item.cantidad - mov.cantidad
                    : item.cantidad + mov.cantidad
                await supabase.from('InventarioPiso').update({ cantidad: nuevaCantidad }).eq('id', item.id)
            }
            // Delete the movement
            await supabase.from('MovimientoInventario').delete().eq('id', mov.id)
            fetchData()
            showToast('Movimiento eliminado')
        } catch (error) {
            console.error(error)
            showToast('Error al eliminar', 'error')
        }
    }

    const handleDeleteItem = async (item) => {
        if (!confirm('¿Estás seguro de eliminar este item del inventario?')) return
        try {
            // First delete related movements
            await supabase.from('MovimientoInventario').delete().eq('idInventario', item.id)
            // Then delete the inventory item
            await supabase.from('InventarioPiso').delete().eq('id', item.id)
            fetchData()
            showToast('Item eliminado correctamente')
        } catch (error) {
            console.error(error)
            showToast('Error al eliminar', 'error')
        }
    }

    const handleDeleteMedicamento = async (med) => {
        // Check if medication is used in inventory
        const isUsed = inventario.some(i => i.idMedicamento === med.ID)
        if (isUsed) {
            showToast('No se puede eliminar, el medicamento está en uso en el inventario', 'error')
            return
        }
        if (!confirm(`¿Estás seguro de eliminar el medicamento "${med.Nombre}"?`)) return
        try {
            await supabase.from('Medicamento').delete().eq('ID', med.ID)
            fetchData()
            showToast('Medicamento eliminado correctamente')
        } catch (error) {
            console.error(error)
            showToast('Error al eliminar', 'error')
        }
    }

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventario por Piso</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de medicamentos y materiales</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'inventario' ? (
                        <>
                            {canManageInventory && (
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('agregar')}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                                    <Plus size={20} /> Agregar a Inventario
                                </motion.button>
                            )}
                            {canManageInventory && (
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('movimiento')}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                                    <ArrowUpDown size={20} /> Registrar Movimiento
                                </motion.button>
                            )}
                        </>
                    ) : (
                        canManageInventory && (
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal('agregarMedicamento')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">
                                <Plus size={20} /> Agregar Medicamento
                            </motion.button>
                        )
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <motion.div whileHover={{ scale: 1.02 }} className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Medicamentos Registrados</p>
                            <p className="text-3xl font-bold mt-1">{medicamentos.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-lg"><Pill size={24} /></div>
                    </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Items en Inventario</p>
                            <p className="text-3xl font-bold mt-1">{inventario.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-lg"><Package size={24} /></div>
                    </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm">Alertas de Stock Bajo</p>
                            <p className="text-3xl font-bold mt-1">{getAlertasStock().length}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-lg"><AlertTriangle size={24} /></div>
                    </div>
                </motion.div>
            </div>

            {/* Tus Movimientos Section */}
            {activeTab === 'inventario' && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Tus Movimientos Recientes</h3>
                    {movimientos.filter(m => m.idEnfermero === currentUser.ID).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {movimientos.filter(m => m.idEnfermero === currentUser.ID).slice(0, 3).map(mov => {
                                const itemInv = inventario.find(i => i.id === mov.idInventario)
                                const med = medicamentos.find(m => m.ID === itemInv?.idMedicamento)
                                return (
                                    <div key={mov.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-200">{med?.Nombre || 'Medicamento'}</p>
                                            <p className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleString()}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {mov.tipo} {mov.cantidad}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No has realizado movimientos recientemente.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveTab('inventario')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'inventario' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    <Package size={18} className="inline mr-2" />Inventario por Piso
                </button>
                <button onClick={() => setActiveTab('medicamentos')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'medicamentos' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    <Pill size={18} className="inline mr-2" />Catálogo de Medicamentos
                </button>
            </div>

            {/* Alertas de stock bajo */}
            {activeTab === 'inventario' && getAlertasStock().length > 0 && (
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


            {/* Filtro por piso - Tabs */}
            {activeTab === 'inventario' && (
                <div className="mb-6 flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedPiso('')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedPiso === ''
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}>
                        Todos
                    </button>
                    {pisos.map(p => (
                        <button
                            key={p.ID}
                            onClick={() => setSelectedPiso(p.ID.toString())}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedPiso === p.ID.toString()
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}>
                            Piso {p.Número}
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'inventario' ? (
                <>
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
                                const pisosPermitidos = getPisosEnfermeroActual()
                                const esPisoPermitido = canManageInventory || pisosPermitidos.includes(item.idPiso)

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
                                                {canReturnItems && esPisoPermitido && <button onClick={() => { setSelectedItem(item); setShowModal('entrada') }} className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg" title="Entrada/Devolución"><Plus size={16} /></button>}
                                                {canDispense && esPisoPermitido && <button onClick={() => { setSelectedItem(item); setShowModal('salida') }} className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg" title="Salida"><Minus size={16} /></button>}
                                                {canManageInventory && <button onClick={() => { setSelectedItem(item); setShowModal('editar') }} className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg" title="Editar"><Edit3 size={16} /></button>}
                                                {canManageInventory && <button onClick={() => handleDeleteItem(item)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>}
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
                                const pac = pacientes.find(p => p.ID === mov.idPaciente)
                                return (
                                    <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {mov.tipo === 'ENTRADA' ? <Plus size={16} /> : <Minus size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-gray-800 dark:text-white font-medium">{med?.Nombre}</p>
                                                {pac ? (
                                                    <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                        <User size={12} /> {pac.Nombre} {pac.A_Paterno}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-500">{mov.tipo === 'ENTRADA' ? 'Reabastecimiento' : 'Sin paciente asignado'}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className={`font-semibold ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                                                </p>
                                                <p className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                {canManageInventory && (
                                                    <>
                                                        <button onClick={() => { setSelectedMovimiento(mov); setShowModal('editarMovimiento') }}
                                                            className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg" title="Editar">
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteMovimiento(mov)}
                                                            className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg" title="Eliminar">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            ) : (
                /* Tabla de medicamentos */
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <Pill size={20} className="text-purple-600" /> Catálogo de Medicamentos
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Gestiona los medicamentos registrados en el sistema</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fórmula</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Presentación</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">En Inventario</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando...</td></tr>
                                ) : medicamentos.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay medicamentos registrados</td></tr>
                                ) : (
                                    medicamentos.map(med => {
                                        const inInventory = inventario.filter(i => i.idMedicamento === med.ID).length
                                        return (
                                            <tr key={med.ID} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{med.ID}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                            <Pill size={16} className="text-purple-600" />
                                                        </div>
                                                        <span className="font-medium text-gray-800 dark:text-white">{med.Nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{med.Formula}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{med.Presentacion}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {inInventory > 0 ? (
                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                                            {inInventory} piso(s)
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full text-xs">
                                                            No asignado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {canManageInventory && (
                                                            <>
                                                                <button onClick={() => { setSelectedMedicamento(med); setShowModal('editarMedicamento') }}
                                                                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg" title="Editar">
                                                                    <Edit3 size={16} />
                                                                </button>
                                                                <button onClick={() => handleDeleteMedicamento(med)}
                                                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg" title="Eliminar">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* Modales */}
            <AnimatePresence>
                {(showModal === 'entrada' || showModal === 'salida') && selectedItem && (
                    <ModalMovimiento tipo={showModal === 'entrada' ? 'ENTRADA' : 'SALIDA'} item={selectedItem} medicamentos={medicamentos} pacientes={getPacientesPermitidos()} movimientos={movimientos}
                        onClose={() => { setShowModal(null); setSelectedItem(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedItem(null); showToast(showModal === 'entrada' ? 'Entrada registrada' : 'Medicamento administrado') }} />
                )}
                {showModal === 'movimiento' && (
                    <ModalMovimientoCompleto inventario={inventario} medicamentos={medicamentos} pisos={pisos} pacientes={pacientes}
                        onClose={() => setShowModal(null)}
                        onSuccess={() => { fetchData(); setShowModal(null); showToast('Movimiento registrado') }} />
                )}
                {showModal === 'editarMovimiento' && selectedMovimiento && (
                    <ModalEditarMovimiento movimiento={selectedMovimiento} inventario={inventario} pacientes={pacientes}
                        onClose={() => { setShowModal(null); setSelectedMovimiento(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedMovimiento(null); showToast('Movimiento actualizado') }} />
                )}
                {showModal === 'agregar' && (
                    <ModalAgregarInventario medicamentos={medicamentos} pisos={pisos} inventario={inventario}
                        onClose={() => setShowModal(null)}
                        onSuccess={() => { fetchData(); setShowModal(null); showToast('Item agregado al inventario') }} />
                )}
                {showModal === 'editar' && selectedItem && (
                    <ModalEditarInventario item={selectedItem} medicamentos={medicamentos} pisos={pisos}
                        onClose={() => { setShowModal(null); setSelectedItem(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedItem(null); showToast('Item actualizado') }} />
                )}
                {showModal === 'agregarMedicamento' && (
                    <ModalAgregarMedicamento
                        onClose={() => setShowModal(null)}
                        onSuccess={() => { fetchData(); setShowModal(null); showToast('Medicamento agregado') }} />
                )}
                {showModal === 'editarMedicamento' && selectedMedicamento && (
                    <ModalEditarMedicamento medicamento={selectedMedicamento}
                        onClose={() => { setShowModal(null); setSelectedMedicamento(null) }}
                        onSuccess={() => { fetchData(); setShowModal(null); setSelectedMedicamento(null); showToast('Medicamento actualizado') }} />
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

function ModalMovimiento({ tipo, item, medicamentos, pacientes, movimientos, onClose, onSuccess }) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const canManageInventory = hasPermission(currentUser, PERMISSIONS.CAN_MANAGE_INVENTORY)

    // Default tab logic based on permission
    const [activeTab, setActiveTab] = useState(canManageInventory ? 'resurtir' : 'devolver')
    const [cantidad, setCantidad] = useState('')
    const [idPaciente, setIdPaciente] = useState('')
    const [via, setVia] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedDevolucion, setSelectedDevolucion] = useState(null)
    const [cantidadDevolver, setCantidadDevolver] = useState('')
    const med = medicamentos.find(m => m.ID === item.idMedicamento)

    const viasAdministracion = ['Oral', 'Intravenosa', 'Intramuscular', 'Subcutánea', 'Tópica', 'Inhalatoria', 'Rectal', 'Sublingual']

    // Get SALIDA movements for this inventory item that can be returned
    const movimientosSalida = movimientos?.filter(m =>
        m.idInventario === item.id &&
        m.tipo === 'SALIDA' &&
        m.cantidad > 0
    ) || []

    const handleSubmitResurtir = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const cantNum = parseInt(cantidad)
            const nuevaCantidad = item.cantidad + cantNum

            await supabase.from('InventarioPiso').update({ cantidad: nuevaCantidad, fechaActualizacion: new Date().toISOString() }).eq('id', item.id)
            await supabase.from('MovimientoInventario').insert([{
                idInventario: item.id,
                tipo: 'ENTRADA',
                cantidad: cantNum,
                idEnfermero: currentUser.ID
            }])
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const handleSubmitDevolucion = async (e) => {
        e.preventDefault()
        if (!selectedDevolucion || !cantidadDevolver) return
        setLoading(true)
        try {
            const cantDevolver = parseInt(cantidadDevolver)

            // Update inventory (add back the returned quantity)
            await supabase.from('InventarioPiso').update({
                cantidad: item.cantidad + cantDevolver,
                fechaActualizacion: new Date().toISOString()
            }).eq('id', item.id)

            // Update the original movement (reduce the quantity)
            await supabase.from('MovimientoInventario').update({
                cantidad: selectedDevolucion.cantidad - cantDevolver
            }).eq('id', selectedDevolucion.id)

            // Add observation to Administracion_Medicamento if exists
            const { data: adminMed } = await supabase.from('Administracion_Medicamento')
                .select('*')
                .eq('idMovimientoInventario', selectedDevolucion.id)
                .single()

            if (adminMed) {
                const nuevaObs = `${adminMed.Observaciones || ''}\n[DEVOLUCIÓN: ${cantDevolver} unidades devueltas el ${new Date().toLocaleString()}]`.trim()
                await supabase.from('Administracion_Medicamento').update({
                    Observaciones: nuevaObs
                }).eq('ID', adminMed.ID)
            }

            // Create a new ENTRADA movement for the return
            await supabase.from('MovimientoInventario').insert([{
                idInventario: item.id,
                tipo: 'ENTRADA',
                cantidad: cantDevolver,
                idEnfermero: currentUser.ID,
                idPaciente: selectedDevolucion.idPaciente
            }])

            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const handleSubmitSalida = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const cantNum = parseInt(cantidad)
            const nuevaCantidad = item.cantidad - cantNum

            await supabase.from('InventarioPiso').update({ cantidad: nuevaCantidad, fechaActualizacion: new Date().toISOString() }).eq('id', item.id)

            const { data: movData, error: movError } = await supabase.from('MovimientoInventario').insert([{
                idInventario: item.id,
                tipo: 'SALIDA',
                cantidad: cantNum,
                idEnfermero: currentUser.ID,
                idPaciente: idPaciente ? parseInt(idPaciente) : null
            }]).select('id').single()

            if (movError) throw movError

            // Si hay paciente, crear registro de enfermería y luego administración de medicamento
            if (idPaciente && movData) {
                // Primero crear el registro de enfermería
                const { data: regData, error: regError } = await supabase.from('Registro_Enfermeria').insert([{
                    idPaciente: parseInt(idPaciente),
                    idEnfermero: currentUser.ID,
                    fecha: new Date().toISOString(),
                    observaciones: `Administración de medicamento: ${med?.Nombre}`,
                    firmado: false
                }]).select()

                if (regError) throw regError

                // Luego crear administración de medicamento con idRegistro
                await supabase.from('Administracion_Medicamento').insert([{
                    idRegistro: regData[0].ID,
                    Medicamento_ID: item.idMedicamento,
                    Nombre: med?.Nombre,
                    Fecha_hora: new Date().toISOString(),
                    Via: via,
                    Observaciones: observaciones,
                    idMovimientoInventario: movData.id
                }])
            }

            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {tipo === 'ENTRADA' ? 'Entrada de Stock' : 'Administración de Medicamento'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>

                {/* Info del medicamento */}
                <div className="px-6 pt-4">
                    <div className="text-center py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">{med?.Nombre}</p>
                        <p className="text-sm text-gray-500">{med?.Presentacion} • Stock: {item.cantidad}</p>
                    </div>
                </div>

                {tipo === 'ENTRADA' ? (
                    <>
                        {/* Tabs para ENTRADA */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 mx-6 mt-4">
                            {canManageInventory && (
                                <button onClick={() => { setActiveTab('resurtir'); setSelectedDevolucion(null) }}
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resurtir' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    📦 Resurtir
                                </button>
                            )}
                            <button onClick={() => setActiveTab('devolver')}
                                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'devolver' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                ↩️ Devolver
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'resurtir' ? (
                                <form onSubmit={handleSubmitResurtir} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad a agregar *</label>
                                        <input type="number" required min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white text-center text-xl" />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                                            {loading ? 'Guardando...' : 'Resurtir Stock'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    {movimientosSalida.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No hay salidas registradas para devolver</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-500 mb-3">Selecciona una salida para devolver:</p>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {movimientosSalida.map(mov => {
                                                    const pac = pacientes.find(p => p.ID === mov.idPaciente)
                                                    return (
                                                        <div key={mov.id}
                                                            onClick={() => { setSelectedDevolucion(mov); setCantidadDevolver('1') }}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedDevolucion?.id === mov.id
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                                }`}>
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-medium text-gray-800 dark:text-white">
                                                                        {pac ? `${pac.Nombre} ${pac.A_Paterno}` : 'Sin paciente'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleString()}</p>
                                                                </div>
                                                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-sm font-medium">
                                                                    {mov.cantidad} uds
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {selectedDevolucion && (
                                                <form onSubmit={handleSubmitDevolucion} className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Cantidad a devolver
                                                        </label>
                                                        <div className="text-center mb-4">
                                                            <span className="text-4xl font-bold text-blue-600">{cantidadDevolver || 1}</span>
                                                            <span className="text-gray-400 ml-2">/ {selectedDevolucion.cantidad}</span>
                                                        </div>
                                                        <Slider
                                                            min={1}
                                                            max={selectedDevolucion.cantidad}
                                                            step={1}
                                                            value={[parseInt(cantidadDevolver) || 1]}
                                                            onValueChange={(val) => setCantidadDevolver(val[0].toString())}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                                                            <span>1</span>
                                                            <span>{selectedDevolucion.cantidad}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button type="button" onClick={() => setSelectedDevolucion(null)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                                                        <button type="submit" disabled={loading || !cantidadDevolver} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
                                                            {loading ? 'Procesando...' : 'Confirmar Devolución'}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* SALIDA - Administración de medicamento */
                    <form onSubmit={handleSubmitSalida} className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad *</label>
                            <input type="number" required min="1" max={item.cantidad} value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white text-center text-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente *</label>
                            <select required value={idPaciente} onChange={(e) => setIdPaciente(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                                <option value="">Seleccionar paciente</option>
                                {pacientes.map(p => (
                                    <option key={p.ID} value={p.ID}>{p.Nombre} {p.A_Paterno} {p.A_Materno}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vía de Administración *</label>
                            <select required value={via} onChange={(e) => setVia(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                                <option value="">Seleccionar vía</option>
                                {viasAdministracion.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2}
                                placeholder="Notas adicionales sobre la administración..."
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white resize-none" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
                                {loading ? 'Guardando...' : 'Administrar'}
                            </button>
                        </div>
                    </form>
                )}
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

function ModalAgregarInventario({ medicamentos, pisos, inventario, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ idMedicamento: '', idPiso: '', cantidad: '', cantidadMinima: '10' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Filter out medications that already exist in the selected floor
    const getMedicamentosDisponibles = () => {
        if (!formData.idPiso) return medicamentos
        const existingMeds = inventario.filter(i => i.idPiso === parseInt(formData.idPiso)).map(i => i.idMedicamento)
        return medicamentos.filter(m => !existingMeds.includes(m.ID))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Check if this combination already exists
        const exists = inventario.find(i =>
            i.idPiso === parseInt(formData.idPiso) &&
            i.idMedicamento === parseInt(formData.idMedicamento)
        )
        if (exists) {
            setError('Este medicamento ya existe en este piso')
            return
        }

        setLoading(true)
        try {
            const { error: insertError } = await supabase.from('InventarioPiso').insert([{
                idPiso: parseInt(formData.idPiso),
                idMedicamento: parseInt(formData.idMedicamento),
                cantidad: parseInt(formData.cantidad),
                cantidadMinima: parseInt(formData.cantidadMinima),
                fechaActualizacion: new Date().toISOString()
            }])
            if (insertError) throw insertError
            onSuccess()
        } catch (err) {
            console.error(err)
            setError('Error al agregar item')
        }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Agregar a Inventario</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Piso *</label>
                        <select required value={formData.idPiso} onChange={(e) => setFormData({ ...formData, idPiso: e.target.value, idMedicamento: '' })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                            <option value="">Seleccionar piso</option>
                            {pisos.map(p => <option key={p.ID} value={p.ID}>Piso {p.Número}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicamento *</label>
                        <select required value={formData.idMedicamento} onChange={(e) => setFormData({ ...formData, idMedicamento: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white"
                            disabled={!formData.idPiso}>
                            <option value="">Seleccionar medicamento</option>
                            {getMedicamentosDisponibles().map(m => <option key={m.ID} value={m.ID}>{m.Nombre} - {m.Presentacion}</option>)}
                        </select>
                        {formData.idPiso && getMedicamentosDisponibles().length === 0 && (
                            <p className="text-xs text-yellow-600 mt-1">Todos los medicamentos ya están registrados en este piso</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad Inicial *</label>
                            <input type="number" required min="0" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad Mínima *</label>
                            <input type="number" required min="1" value={formData.cantidadMinima} onChange={(e) => setFormData({ ...formData, cantidadMinima: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                            {loading ? 'Agregando...' : 'Agregar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalEditarInventario({ item, medicamentos, pisos, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        cantidad: item.cantidad.toString(),
        cantidadMinima: item.cantidadMinima.toString()
    })
    const [loading, setLoading] = useState(false)
    const med = medicamentos.find(m => m.ID === item.idMedicamento)
    const piso = pisos.find(p => p.ID === item.idPiso)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await supabase.from('InventarioPiso').update({
                cantidad: parseInt(formData.cantidad),
                cantidadMinima: parseInt(formData.cantidadMinima),
                fechaActualizacion: new Date().toISOString()
            }).eq('id', item.id)
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Editar Item</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-center py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">{med?.Nombre}</p>
                        <p className="text-sm text-gray-500">{med?.Presentacion} • Piso {piso?.Número}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad Actual *</label>
                        <input type="number" required min="0" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white text-center text-xl" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad Mínima (alerta) *</label>
                        <input type="number" required min="1" value={formData.cantidadMinima} onChange={(e) => setFormData({ ...formData, cantidadMinima: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white text-center" />
                        <p className="text-xs text-gray-500 mt-1">Se mostrará alerta cuando el stock sea igual o menor a este valor</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalAgregarMedicamento({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({ Nombre: '', Formula: '', Presentacion: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { error: insertError } = await supabase.from('Medicamento').insert([{
                Nombre: formData.Nombre,
                Formula: formData.Formula,
                Presentacion: formData.Presentacion
            }])
            if (insertError) throw insertError
            onSuccess()
        } catch (err) {
            console.error(err)
            setError('Error al agregar medicamento')
        }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Agregar Medicamento</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                        <input type="text" required value={formData.Nombre} onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                            placeholder="Ej: Paracetamol"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fórmula *</label>
                        <input type="text" required value={formData.Formula} onChange={(e) => setFormData({ ...formData, Formula: e.target.value })}
                            placeholder="Ej: C8H9NO2"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presentación *</label>
                        <input type="text" required value={formData.Presentacion} onChange={(e) => setFormData({ ...formData, Presentacion: e.target.value })}
                            placeholder="Ej: Tabletas 500mg"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50">
                            {loading ? 'Agregando...' : 'Agregar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalEditarMedicamento({ medicamento, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        Nombre: medicamento.Nombre,
        Formula: medicamento.Formula,
        Presentacion: medicamento.Presentacion
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await supabase.from('Medicamento').update({
                Nombre: formData.Nombre,
                Formula: formData.Formula,
                Presentacion: formData.Presentacion
            }).eq('ID', medicamento.ID)
            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Editar Medicamento</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                        <input type="text" required value={formData.Nombre} onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fórmula *</label>
                        <input type="text" required value={formData.Formula} onChange={(e) => setFormData({ ...formData, Formula: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presentación *</label>
                        <input type="text" required value={formData.Presentacion} onChange={(e) => setFormData({ ...formData, Presentacion: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50">
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

function ModalEditarMovimiento({ movimiento, inventario, pacientes, onClose, onSuccess }) {
    const [cantidad, setCantidad] = useState(movimiento.cantidad.toString())
    const [idPaciente, setIdPaciente] = useState(movimiento.idPaciente?.toString() || '')
    const [loading, setLoading] = useState(false)
    const inv = inventario.find(i => i.id === movimiento.idInventario)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const cantidadAnterior = movimiento.cantidad
            const cantidadNueva = parseInt(cantidad)
            const diferencia = cantidadNueva - cantidadAnterior

            // Adjust inventory based on difference
            if (inv && diferencia !== 0) {
                const ajuste = movimiento.tipo === 'ENTRADA' ? diferencia : -diferencia
                await supabase.from('InventarioPiso').update({
                    cantidad: inv.cantidad + ajuste
                }).eq('id', inv.id)
            }

            // Update movement
            await supabase.from('MovimientoInventario').update({
                cantidad: cantidadNueva,
                idPaciente: idPaciente ? parseInt(idPaciente) : null
            }).eq('id', movimiento.id)

            onSuccess()
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Editar Movimiento</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className={`text-center py-2 rounded-lg ${movimiento.tipo === 'ENTRADA' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <p className={`text-lg font-semibold ${movimiento.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                            {movimiento.tipo}
                        </p>
                        <p className="text-sm text-gray-500">{new Date(movimiento.fecha).toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad *</label>
                        <input type="number" required min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white text-center text-xl" />
                    </div>
                    {movimiento.tipo === 'SALIDA' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente</label>
                            <select value={idPaciente} onChange={(e) => setIdPaciente(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white">
                                <option value="">Sin paciente</option>
                                {pacientes.map(p => (
                                    <option key={p.ID} value={p.ID}>{p.Nombre} {p.A_Paterno}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

export default InventarioPage
