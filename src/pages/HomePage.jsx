import { motion } from 'framer-motion'
import { Users, Calendar, Bed, Package, GraduationCap, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const stats = [
    { title: 'Enfermeros', value: '24', icon: Users, color: 'blue' },
    { title: 'Turnos hoy', value: '8', icon: Calendar, color: 'green' },
    { title: 'Camas ocupadas', value: '45', icon: Bed, color: 'purple' },
    { title: 'Alertas stock', value: '3', icon: Package, color: 'orange' },
]

const quickActions = [
    { title: 'Registrar enfermero', icon: Users, path: '/personal' },
    { title: 'Ver rol', icon: Calendar, path: '/rol' },
    { title: 'Nuevo incidente', icon: FileText, path: '/reportes' },
    { title: 'Cursos', icon: GraduationCap, path: '/capacitacion' },
]

function HomePage({ user }) {
    const navigate = useNavigate()

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    ¡Hola, {user?.nombre || 'Usuario'}!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Bienvenido al sistema de gestión de enfermería
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                    stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                                        stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                            'bg-orange-100 dark:bg-orange-900/30'
                                }`}>
                                <stat.icon className={`${stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                        stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                                            stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                                                'text-orange-600 dark:text-orange-400'
                                    }`} size={24} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Acciones rápidas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Acciones rápidas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <motion.button
                            key={action.title}
                            onClick={() => navigate(action.path)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                <action.icon className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.title}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

export default HomePage
