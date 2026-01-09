import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    Calendar,
    Bed,
    Package,
    GraduationCap,
    FileText,
    ChevronLeft,
    LogOut,
    Menu,
    Sun,
    Moon,
    Home
} from 'lucide-react'

// Páginas
import HomePage from '@/pages/HomePage'
import PersonalPage from '@/modules/personal/PersonalPage'
import RolPage from '@/modules/rol/RolPage'
import PacientesPage from '@/modules/pacientes/PacientesPage'
import InventarioPage from '@/modules/inventario/InventarioPage'
import CapacitacionPage from '@/modules/capacitacion/CapacitacionPage'
import ReportesPage from '@/modules/reportes/ReportesPage'

const menuItems = [
    {
        title: 'Inicio',
        icon: Home,
        path: '/',
        description: 'Dashboard principal'
    },
    {
        title: 'Personal',
        icon: Users,
        path: '/personal',
        description: 'Gestión de enfermeros'
    },
    {
        title: 'Rol de Enfermería',
        icon: Calendar,
        path: '/rol',
        description: 'Turnos y horarios'
    },
    {
        title: 'Pacientes',
        icon: Bed,
        path: '/pacientes',
        description: 'Camas y registros'
    },
    {
        title: 'Inventario',
        icon: Package,
        path: '/inventario',
        description: 'Medicamentos e insumos'
    },
    {
        title: 'Capacitación',
        icon: GraduationCap,
        path: '/capacitacion',
        description: 'Cursos y charlas'
    },
    {
        title: 'Reportes',
        icon: FileText,
        path: '/reportes',
        description: 'Incidentes y eventos'
    },
]

function DashboardLayout({ user, onLogout }) {
    const [collapsed, setCollapsed] = useState(false)
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode')
        return saved ? JSON.parse(saved) : false
    })
    const navigate = useNavigate()
    const location = useLocation()

    // Aplicar/remover clase dark al documento
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    const toggleTheme = () => {
        setDarkMode(!darkMode)
    }

    return (
        <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 280 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300"
            >
                {/* Header del Sidebar */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-bold text-xl text-gray-800 dark:text-white"
                            >
                                Mano a Mano
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                    >
                        {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                {/* Menú de navegación */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
                    {menuItems.map((item) => (
                        <motion.button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            whileHover={{ x: 4 }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <item.icon size={20} />
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <span className="font-medium whitespace-nowrap">{item.title}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    ))}
                </nav>

                {/* Footer del Sidebar */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
                    {/* Toggle de tema */}
                    <motion.button
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg mb-4 transition-colors ${darkMode
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        {!collapsed && <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>}
                    </motion.button>

                    {/* Info usuario */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                            {user?.nombre?.charAt(0) || 'U'}
                        </div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 overflow-hidden"
                                >
                                    <p className="font-medium text-gray-800 dark:text-white truncate">
                                        {user?.nombre} {user?.apellidoPaterno}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {user?.Cargo?.Nombre_Cargo || 'Usuario'}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Botón cerrar sesión */}
                    <motion.button
                        onClick={onLogout}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${collapsed ? 'px-2' : ''
                            }`}
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Cerrar sesión</span>}
                    </motion.button>
                </div>
            </motion.aside>

            {/* Contenido principal */}
            <main className="flex-1 overflow-auto">
                <Routes>
                    <Route path="/" element={<HomePage user={user} />} />
                    <Route path="/personal/*" element={<PersonalPage />} />
                    <Route path="/rol/*" element={<RolPage />} />
                    <Route path="/pacientes/*" element={<PacientesPage />} />
                    <Route path="/inventario/*" element={<InventarioPage />} />
                    <Route path="/capacitacion/*" element={<CapacitacionPage />} />
                    <Route path="/reportes/*" element={<ReportesPage />} />
                </Routes>
            </main>
        </div>
    )
}

export default DashboardLayout

