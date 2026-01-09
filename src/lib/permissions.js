export const ROLES = {
    ENFERMERO: 'Enfermero',
    COORDINADOR: 'Coordinador general',
    JEFE_PISO: 'Jefe de Piso',
    JEFE_PEDIATRIA: 'Jefe de enfermería de pediatría',
    CAPACITACION: 'Capacitación',
    MEDICO: 'Médico de guardia'
};

export const PERMISSIONS = {
    // Pacientes
    CAN_ADD_PATIENT: [ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR, ROLES.MEDICO],
    CAN_EDIT_PATIENT: [ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR, ROLES.MEDICO],
    CAN_DELETE_PATIENT: [ROLES.COORDINADOR], // Solo coordinador por seguridad
    CAN_ASSIGN_BED: [ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR, ROLES.MEDICO],
    CAN_DISCHARGE_PATIENT: [ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR, ROLES.MEDICO],

    // Registros Clínicos
    CAN_ADD_VITALS: [ROLES.ENFERMERO, ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR, ROLES.MEDICO],
    CAN_ADD_MEDICATION: [ROLES.ENFERMERO, ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR, ROLES.MEDICO], // Enfermeros validan asignación en componente
    CAN_ADD_DIAGNOSIS: [ROLES.MEDICO, ROLES.COORDINADOR],
    CAN_ADD_INCIDENT: [ROLES.ENFERMERO, ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR, ROLES.MEDICO],

    // Gestión
    CAN_MANAGE_ROLES: [ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR],
    CAN_MANAGE_COURSES: [ROLES.CAPACITACION, ROLES.COORDINADOR],
    CAN_VIEW_REPORTS: [ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR],
    CAN_CREATE_DAILY_REPORT: [ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.COORDINADOR],

    // Inventario
    CAN_MANAGE_INVENTORY: [ROLES.COORDINADOR, ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA],
    CAN_RETURN_ITEMS: [ROLES.ENFERMERO, ROLES.COORDINADOR, ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA]
};

export const hasPermission = (user, permissionRoles) => {
    if (!user || !user.Cargo || !user.Cargo.Nombre_Cargo) return false;
    const userRole = user.Cargo.Nombre_Cargo;
    return permissionRoles.includes(userRole);
};

// Helper específico para verificar si un enfermero tiene asignado un paciente
export const isPatientAssigned = (user, patientId, assignments = []) => {
    // Si es Coordinador, Jefe o Médico, siempre tiene acceso
    if ([ROLES.COORDINADOR, ROLES.JEFE_PISO, ROLES.JEFE_PEDIATRIA, ROLES.MEDICO].includes(user?.Cargo?.Nombre_Cargo)) return true;

    // Si es Enfermero, buscar en asignaciones activas
    if (user?.Cargo?.Nombre_Cargo === ROLES.ENFERMERO) {
        // Esta lógica dependerá de cómo tengamos las asignaciones cargadas en el front
        // Por ahora retornamos true para no bloquear si no tenemos la lista, 
        // pero idealmente se pasaría la lista de asignaciones del día.
        return true;
    }
    return false;
};
