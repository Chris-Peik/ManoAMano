import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'

function LoginPage({ onLoginSuccess }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')

        const { data: enfermeroData, error: dbError } = await supabase
            .from('Enfermero')
            .select('*, Cargo:Cargo!fk_Enfermero_ID_Cargo_Cargo(*)')
            .eq('email', email)
            .eq('password', password)
            .single()

        if (dbError && dbError.code !== 'PGRST116') {
            setErrorMsg('Error al conectar con la base de datos: ' + dbError.message)
            setLoading(false)
            return
        }

        if (enfermeroData) {
            onLoginSuccess(enfermeroData)
        } else {
            setErrorMsg('Credenciales inválidas. Correo o contraseña incorrectos.')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex">
            {/* Panel izquierdo - Formulario */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
                        <p className="text-gray-600">Sistema de administración de enfermería</p>
                    </div>

                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                        >
                            {errorMsg}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="usuario@hospital.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                }`}
                        >
                            {loading ? 'Verificando...' : 'Iniciar Sesión'}
                        </motion.button>
                    </form>
                </motion.div>
            </div>

            {/* Panel derecho - Imagen/Decoración */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-center text-white"
                >
                    <div className="w-24 h-24 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Mano a Mano</h2>
                    <p className="text-lg text-blue-100 max-w-sm">
                        Gestiona tu equipo de enfermería, turnos y pacientes de manera eficiente
                    </p>
                </motion.div>
            </div>
        </div>
    )
}

export default LoginPage
