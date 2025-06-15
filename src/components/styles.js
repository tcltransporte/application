export const styles = {

    header: (theme) => ({
        p: 2,
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 'var(--header-height)',
    }),

    container: (theme) => ({
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        //backgroundColor: theme.palette.background.default,
    }),

    tableWrapper: (theme) => ({
        flex: 1,
        mt: 1,
        overflow: 'auto',
    }),

    tableCellLoader: (theme) => ({
        height: 'calc(100vh - 200px)',
    }),

    pagination: (theme) => ({
        position: 'sticky',
        zIndex: 1100,
        bottom: 0,
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.divider}`,
    }),

    paperContainer: (theme) => ({
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
    }),

    tableLayout: (theme) => ({
        tableLayout: 'fixed',
        width: '100%'
    }),

    dialogTitle: (theme) => ({
        fontWeight: '700',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        py: 1.5,
        userSelect: 'none',
    }),

    dialogTextField: {
        '& input': {
            fontWeight: 600,
            fontSize: '1.1rem',
        },
    },
    
    dialogActions: {
        px: 3,
        pb: 2,
    },

    saveButton: (theme) => ({
        textTransform: 'none',
        fontWeight: 700,
        backgroundColor: theme.palette.primary.main,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
    }),

}