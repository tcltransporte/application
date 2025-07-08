'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    IconButton,
    DialogTitle
} from '@mui/material'
//import CloseIcon from '@mui/icons-material/Close'

import { Worker, Viewer } from '@react-pdf-viewer/core'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { getFilePlugin } from '@react-pdf-viewer/get-file'
import { styles } from './styles'

const PdfViewer = ({ base64Pdf, filename = 'documento.pdf' }) => {
    
    const getFilePluginInstance = getFilePlugin({
        fileNameGenerator: () => filename,
    })

    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        toolbarPlugin: {
            // Usa o getFilePlugin para substituir o botão de download
            toolbarPluginInstance: getFilePluginInstance,
        },
    })

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={base64Pdf}
                    plugins={[defaultLayoutPluginInstance, getFilePluginInstance]}
                />
            </Worker>
        </div>
    )
}

export class ReportViewer extends React.Component {

    state = {
        open: false,
        pdf: null,
    }

    visualize = (pdf) => {
        this.setState({ pdf, open: true })
    }

    close = () => {
        this.setState({ open: false, pdf: null })
    }

    render() {
        const { open, pdf } = this.state

        return (
            <Dialog
                open={open}
                onClose={this.close}
                maxWidth={false}
                slotProps={{
                    paper: {
                        sx: {
                            width: 1100,
                            height: '100%',
                        },
                    }
                }}
            >
                <DialogTitle sx={styles.dialogTitle}>
                    Visualização de PDF
                    <IconButton aria-label="close" onClick={this.close} sx={styles.dialogClose}>
                        <i className="ri-close-line" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0 }}>
                    <div style={{ height: '100%', overflow: 'auto' }}>
                        {pdf && (
                            <PdfViewer base64Pdf={`data:application/pdf;base64,${pdf}`} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        )
    }
}
