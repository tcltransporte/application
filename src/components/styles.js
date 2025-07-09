import { alpha } from "@mui/material";

export const styles = {

    header: () => ({
        p: 2,
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: 'var(--mui-palette-background-default)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 'var(--header-height)',
    }),

    container: () => ({
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    }),

    tableWrapper: () => ({
        flex: 1,
        mt: 1,
        overflow: 'auto',
    }),

    tableCellLoader: () => ({
        height: '100%',
    }),

    pagination: () => ({
        position: 'sticky',
        zIndex: 1100,
        bottom: 0,
        opacity: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        backgroundColor: 'var(--mui-palette-background-default)',
        borderTop: '1px solid var(--mui-palette-divider)', // borda elegante baseada no tema
        backdropFilter: 'blur(4px)', // opcional: dá um toque de vidro fosco
    }),


    paperContainer: () => ({
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
    }),

    tableLayout: () => ({
        tableLayout: 'fixed',
        width: '100%'
    }),

    dialogTitle: () => ({
        backgroundColor: 'var(--mui-palette-primary-main)',
        color: 'var(--mui-palette-primary-contrastText)',
        py: 3,
    }),

    dialogClose: () => ({
        position: "absolute",
        right: 8,
        top: 8,
        color: 'var(--mui-palette-primary-contrastText)',
    }),

}