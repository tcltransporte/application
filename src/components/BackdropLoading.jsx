import { Backdrop, CircularProgress, Typography } from "@mui/material"

export const BackdropLoading = (props) => {

    return (
        <Backdrop open={props.loading} sx={{ zIndex: 1200, color: "#fff", flexDirection: "column" }}>
            <CircularProgress color="inherit" />
            <Typography variant="h6" sx={{ mt: 2, color: "#fff" }}>
                {props.message}
            </Typography>
        </Backdrop>
    )

}