import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Calendar, Bed, Package, GraduationCap, FileText, AlertTriangle,
    Activity, TrendingUp, TrendingDown, Clock, ChevronRight, Pill,
    UserPlus, ClipboardList, AlertCircle, CheckCircle, XCircle, Eye,
    Plus, Stethoscope, Building, BarChart3
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
    RadialBarChart, RadialBar
} from 'recharts'

// ============================================
// COMPONENTES DE DASHBOARD
// ============================================

function StatCard({ title, value, icon: Icon, color, trend, subtitle, onClick }) {
    const colors = {
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
        green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
        red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
        cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
    }
    const c = colors[color] || colors.blue

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={onClick}
            className={`bg-white dark:bg-gray-800 rounded-xl border ${c.border} p-5 hover:shadow-lg transition-all cursor-pointer`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{Math.abs(trend)}% vs ayer</span>
                        </div>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <Icon className={c.text} size={24} />
                </div>
            </div>
        </motion.div>
    )
}

function AlertPanel({ alerts, onViewAll }) {
    const priorityColors = {
        critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
        high: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
        medium: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
        low: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    }
    const icons = { critical: XCircle, high: AlertTriangle, medium: AlertCircle, low: CheckCircle }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" size={20} />
                    Alertas Activas
                </h3>
                <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 px-2 py-1 rounded-full font-medium">
                    {alerts.length} pendientes
                </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4 text-center">No hay alertas activas ✓</p>
                ) : (
                    alerts.slice(0, 5).map((alert, idx) => {
                        const Icon = icons[alert.priority] || AlertCircle
                        return (
                            <div key={idx} className={`p-3 rounded-lg border ${priorityColors[alert.priority]} flex items-start gap-3`}>
                                <Icon size={18} className="mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{alert.title}</p>
                                    <p className="text-xs opacity-75">{alert.description}</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            {alerts.length > 5 && (
                <button onClick={onViewAll} className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Ver todas ({alerts.length})
                </button>
            )}
        </div>
    )
}



// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function HomePage({ user }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        enfermeros: 0,
        pacientesHospitalizados: 0,
        totalCamas: 0,
        alertasStock: 0,
        incidentesAbiertos: 0,
        turnosHoy: 0,
        cursosActivos: 0,
        ocupacionPorPiso: [],
        movimientosRecientes: [],
        incidentesPorGravedad: [],
        alertas: [],
        inventarioBajo: [],
        misInscripciones: { total: 0, completadas: 0 }
    })

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const hoy = new Date().toISOString().split('T')[0]

            // Fetch all data in parallel
            const [
                enfRes, camasRes, invRes, incRes, turnosRes, cursosRes,
                pisosRes, habRes, movRes, inscRes
            ] = await Promise.all([
                supabase.from('Enfermero').select('ID', { count: 'exact', head: true }),
                supabase.from('Cama').select('*'),
                supabase.from('InventarioPiso').select('*, Medicamento(Nombre), Piso(Número)'),
                supabase.from('Incidente').select('*'),
                supabase.from('DetalleRol').select('*').eq('fecha', hoy),
                supabase.from('CursoCapacitacion').select('*'),
                supabase.from('Piso').select('*, Especialidad(Descripción)'),
                supabase.from('Habitación').select('*'),
                supabase.from('MovimientoInventario').select('*, InventarioPiso(*, Medicamento(Nombre))').order('fecha', { ascending: false }).limit(50),
                supabase.from('InscripcionCurso').select('*').eq('idEnfermero', user?.ID)
            ])

            // Process camas ocupadas
            const camasOcupadas = camasRes.data?.filter(c => c.idPaciente) || []

            // Process alertas stock
            const stockBajo = invRes.data?.filter(i => i.cantidad <= i.cantidadMinima) || []

            // Process incidentes abiertos
            const incidentesAbiertos = incRes.data?.filter(i => i.estado === 'ABIERTO') || []

            // Process cursos activos
            const cursosActivos = cursosRes.data?.filter(c => c.estado === 'ABIERTO') || []

            // Build ocupación por piso
            const ocupacionPorPiso = pisosRes.data?.map(piso => {
                const habitaciones = habRes.data?.filter(h => h.ID_Piso === piso.ID) || []
                const camasPiso = camasRes.data?.filter(c => habitaciones.some(h => h.ID === c.idHabitacion)) || []
                const ocupadas = camasPiso.filter(c => c.idPaciente).length
                const total = camasPiso.length || 1
                return {
                    name: `Piso ${piso.Número}`,
                    especialidad: piso.Especialidad?.Descripción || '',
                    ocupadas,
                    total,
                    porcentaje: Math.round((ocupadas / total) * 100)
                }
            }) || []

            // Build movimientos últimos 7 días
            const hace7Dias = new Date()
            hace7Dias.setDate(hace7Dias.getDate() - 7)
            const movimientos7d = movRes.data?.filter(m => new Date(m.fecha) >= hace7Dias) || []
            const movimientosPorDia = {}
            movimientos7d.forEach(m => {
                const dia = new Date(m.fecha).toLocaleDateString('es-MX', { weekday: 'short' })
                if (!movimientosPorDia[dia]) movimientosPorDia[dia] = { entradas: 0, salidas: 0 }
                if (m.tipo === 'ENTRADA') movimientosPorDia[dia].entradas += m.cantidad
                else movimientosPorDia[dia].salidas += m.cantidad
            })
            const movimientosRecientes = Object.entries(movimientosPorDia).map(([dia, vals]) => ({
                dia, ...vals
            }))

            // Incidentes por gravedad
            const incidentesPorGravedad = ['Leve', 'Moderada', 'Grave', 'Crítica'].map(g => ({
                name: g,
                value: incRes.data?.filter(i => i.gravedad === g).length || 0,
                color: g === 'Leve' ? '#22c55e' : g === 'Moderada' ? '#eab308' : g === 'Grave' ? '#f97316' : '#ef4444'
            })).filter(x => x.value > 0)

            // Build alertas
            const alertas = []
            // Stock agotado (crítico)
            stockBajo.filter(i => i.cantidad === 0).forEach(i => {
                alertas.push({
                    priority: 'critical',
                    title: `${i.Medicamento?.Nombre} agotado`,
                    description: `Piso ${i.Piso?.Número} - Resurtir urgente`
                })
            })
            // Incidentes graves/críticos
            incidentesAbiertos.filter(i => ['Grave', 'Crítica'].includes(i.gravedad)).forEach(i => {
                alertas.push({
                    priority: 'critical',
                    title: `Incidente ${i.gravedad}`,
                    description: i.descripcion?.substring(0, 50) + '...'
                })
            })
            // Stock bajo
            stockBajo.filter(i => i.cantidad > 0).forEach(i => {
                alertas.push({
                    priority: 'high',
                    title: `Stock bajo: ${i.Medicamento?.Nombre}`,
                    description: `Piso ${i.Piso?.Número} - ${i.cantidad}/${i.cantidadMinima}`
                })
            })

            // Mis inscripciones
            const misInscripciones = {
                total: inscRes.data?.length || 0,
                completadas: inscRes.data?.filter(i => i.completado).length || 0
            }

            setData({
                enfermeros: enfRes.count || 0,
                pacientesHospitalizados: camasOcupadas.length,
                totalCamas: camasRes.data?.length || 0,
                alertasStock: stockBajo.length,
                incidentesAbiertos: incidentesAbiertos.length,
                turnosHoy: turnosRes.data?.length || 0,
                cursosActivos: cursosActivos.length,
                ocupacionPorPiso,
                movimientosRecientes,
                incidentesPorGravedad,
                alertas,
                inventarioBajo: stockBajo,
                misInscripciones
            })
        } catch (error) {
            console.error('Error fetching dashboard:', error)
        }
        setLoading(false)
    }

    // Quick actions por sección


    const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444']

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
                    ¡Hola, {user?.nombre || 'Usuario'}!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard title="Enfermeros" value={data.enfermeros} icon={Users} color="blue" onClick={() => navigate('/personal')} />
                <StatCard title="Hospitalizados" value={data.pacientesHospitalizados} icon={Bed} color="purple" subtitle={`${data.pacientesHospitalizados} de ${data.totalCamas} camas ocupadas`} onClick={() => navigate('/pacientes')} />
                <StatCard title="Alertas Stock" value={data.alertasStock} icon={Package} color={data.alertasStock > 0 ? 'orange' : 'green'} subtitle={data.alertasStock > 0 ? 'Requiere atención' : 'Inventario OK'} onClick={() => navigate('/inventario')} />
                <StatCard title="Incidentes" value={data.incidentesAbiertos} icon={AlertTriangle} color={data.incidentesAbiertos > 0 ? 'red' : 'green'} subtitle={`${data.incidentesAbiertos} reporte(s) abiertos`} onClick={() => navigate('/reportes')} />
                <StatCard title="Turnos Hoy" value={data.turnosHoy} icon={Calendar} color="cyan" subtitle="Personal activo" onClick={() => navigate('/rol')} />
                <StatCard title="Cursos" value={data.cursosActivos} icon={GraduationCap} color="green" subtitle="Disponibles" onClick={() => navigate('/capacitacion')} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ocupación por Piso */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="text-purple-500" size={20} />
                            Ocupación de Camas por Piso
                        </h3>
                        {data.ocupacionPorPiso.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={data.ocupacionPorPiso} layout="vertical">
                                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                    <YAxis type="category" dataKey="name" width={60} />
                                    <Tooltip formatter={v => `${v}%`} labelFormatter={l => data.ocupacionPorPiso.find(p => p.name === l)?.especialidad} />
                                    <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]}>
                                        {data.ocupacionPorPiso.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.porcentaje > 80 ? '#ef4444' : entry.porcentaje > 60 ? '#eab308' : '#22c55e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No hay datos de ocupación</p>
                        )}
                    </div>

                    {/* Movimientos de Inventario */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="text-orange-500" size={20} />
                            Movimientos de Inventario (7 días)
                        </h3>
                        {data.movimientosRecientes.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={data.movimientosRecientes}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                    <XAxis dataKey="dia" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="entradas" stroke="#22c55e" strokeWidth={2} name="Entradas" />
                                    <Line type="monotone" dataKey="salidas" stroke="#ef4444" strokeWidth={2} name="Salidas" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No hay movimientos recientes</p>
                        )}
                    </div>

                    {/* Row of smaller charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Incidentes por Gravedad */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="text-red-500" size={20} />
                                Incidentes por Gravedad
                            </h3>
                            {data.incidentesPorGravedad.length > 0 ? (
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={data.incidentesPorGravedad} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                            {data.incidentesPorGravedad.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Sin incidentes registrados</p>
                            )}
                        </div>

                        {/* Mi Progreso de Capacitación */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <GraduationCap className="text-green-500" size={20} />
                                Mi Capacitación
                            </h3>
                            <div className="flex items-center justify-center">
                                <div className="relative">
                                    <ResponsiveContainer width={140} height={140}>
                                        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={[{ value: data.misInscripciones.total > 0 ? (data.misInscripciones.completadas / data.misInscripciones.total) * 100 : 0, fill: '#22c55e' }]} startAngle={90} endAngle={-270}>
                                            <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#e5e7eb' }} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-2xl font-bold text-gray-800 dark:text-white">{data.misInscripciones.completadas}</span>
                                        <span className="text-xs text-gray-500">de {data.misInscripciones.total}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-500 mt-2">Cursos completados</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Alerts only (Quick Actions removed) */}
                <div className="space-y-6">
                    {/* Alertas */}
                    <AlertPanel alerts={data.alertas} onViewAll={() => navigate('/inventario')} />
                </div>
            </div>
        </div>
    )
}

export default HomePage
