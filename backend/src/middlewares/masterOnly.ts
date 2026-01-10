export const masterOnly = (req: any, res: any, next: any) => {
    const userRole = req.user?.role;

    if (userRole !== 'MASTER') {
        return res.status(403).json({
            error: 'Acesso negado. Esta funcionalidade é exclusiva para usuários MASTER.'
        });
    }

    next();
};
