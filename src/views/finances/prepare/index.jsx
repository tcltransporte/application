"use client"

import {
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  TextField,
  Tooltip,
  Card,
  Box,
  CardContent,
  Dialog, // Importe Dialog para o modal
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material"
import React, { useState, useEffect, useRef } from "react"
//import { updateInstallment } from "./index.controller"
import { AutoComplete } from "@/components/field/AutoComplete";
import * as search from "@/utils/search";
import { updateInstallment } from "@/app/server/finances/prepare";
import { useTitle } from "@/contexts/TitleProvider";

// Novo componente para o Modal de Edição
const EditInstallment = ({ open, onClose, installment, onSave }) => {

  const [editedAmount, setEditedAmount] = useState(installment?.amount || 0)
  const amountInputRef = useRef(null)

  const [paymentMethod, setPaymentMethod] = useState(null)

  // Atualiza o estado do valor editado sempre que a parcela muda (ou o modal é aberto)
  useEffect(() => {
    if (installment) {
      setEditedAmount(installment.amount || 0);
    }
    if (open && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [installment, open]);

  const handleSave = () => {
    onSave(installment.id, parseFloat(editedAmount));
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="edit-amount-dialog-title">
      <DialogTitle id="edit-amount-dialog-title">Editar</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>Parcela:</strong> #{installment?.financialMovement?.documentNumber} - {installment?.installment}
        </Typography>
        <AutoComplete
          size="small"
          label="Forma de pagamento"
          value={paymentMethod}
          text={(paymentMethod) => paymentMethod.name}
          onChange={(paymentMethod) => setPaymentMethod(paymentMethod)}
          onSearch={search.paymentMethod}
        >
          {(item) => <span>{item.name}</span>}
        </AutoComplete>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente InstallmentCard atualizado
const InstallmentCard = ({ installment, loading, onOpenEditModal }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const isLate = installment.status === "overdue"
  const backgroundColor = isLate ? "#fdecea" : "white"
  const opacity = loading ? 0.5 : 1

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  }

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleEditValueClick = () => {
    onOpenEditModal(installment); // Abre o modal passando a parcela
    handleCloseMenu(); // Fecha o menu
  };

  return (
    <Card
      variant="outlined"
      sx={{ backgroundColor, opacity, position: "relative" }}
    >
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.6)",
            zIndex: 10,
          }}
        >
          <i className="ri-loader-4-line animate-spin text-xl text-gray-500"></i>
        </Box>
      )}

      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, padding: 2, paddingBottom: '6px !important' }}>
        {/* Ícone de três pontos para o menu de opções */}
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
          <IconButton size="small" onClick={handleOpenMenu}>
            <i className="ri-more-2-line" style={{ fontSize: 18 }}></i>
          </IconButton>
          <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
            <MenuItem onClick={handleEditValueClick}>Editar</MenuItem>
            {/* Outras opções poderiam ser adicionadas aqui, como "Excluir", "Marcar como Pago", etc. */}
          </Menu>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <i className="ri-file-list-2-line text-base" />
          <Typography variant="body2" noWrap>
            <strong>
              #{installment.financialMovement?.documentNumber} - {installment.installment}
            </strong>
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <i className="ri-user-line text-base" />
          <Tooltip title={installment.financialMovement?.partner?.surname || ""}>
            <Typography variant="body2" noWrap>
              <strong>{installment.financialMovement?.partner?.surname}</strong>
            </Typography>
          </Tooltip>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <i className="ri-wallet-3-line text-base" />
          <Typography variant="body2" noWrap>
            <strong>
              Boleto
            </strong>
          </Typography>
        </Box>

        <Box display="flex" alignItems="center">
          <i className="ri-file-text-line mr-1 text-base" style={{ flexShrink: 0 }} />
          <Tooltip title={installment.observation || ''}>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {installment.observation}
            </Typography>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }} gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <i className="ri-money-dollar-circle-line text-base" />
            <Typography variant="body2">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(installment.amount || 0)}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <i className="ri-calendar-line text-base" />
            <Typography variant="body2">
              {installment.dueDate
                ? new Date(installment.dueDate).toLocaleDateString("pt-BR")
                : "-"}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// Componente NewInstallment (inalterado)
const NewInstallment = ({ addInstallment }) => {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      addInstallment(input.trim())
      setInput("")
      setEditing(false)
    }
  }

  const handleCancel = () => {
    setInput("")
    setEditing(false)
  }

  if (!editing) {
    return (
      <Button
        variant="text"
        size="small"
        onClick={() => setEditing(true)}
        sx={{
          marginTop: 1,
          justifyContent: "flex-start",
          textTransform: "none",
          color: "text.secondary",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
        startIcon={<i className="ri-add-line"></i>}
      >
        Nova tarefa
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
      <TextField
        inputRef={inputRef}
        size="small"
        variant="outlined"
        placeholder="Nova tarefa"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={handleCancel}
        fullWidth
      />
    </form>
  )
}

// Componente ColumnHeader (inalterado)
const ColumnHeader = ({ bankAccount, onGenerateRemessa, onExportCsv }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget)
  const handleCloseMenu = () => setAnchorEl(null)

  const handleGenerateRemessaClick = () => {
    onGenerateRemessa(bankAccount.id)
    handleCloseMenu()
  }

  const handleExportCsvClick = () => {
    onExportCsv(bankAccount.id)
    handleCloseMenu()
  }

  return (
    <div className="column-header flex items-center justify-between p-2" style={{ gap: 8 }}>
      <div className="flex items-center gap-2">
        {bankAccount.bank?.icon && (
          <img src={bankAccount.bank?.icon} alt={`${bankAccount.bank?.name} icon`} style={{ width: 24, height: 24 }} />
        )}
        <div>
          <Typography fontWeight="bold">{bankAccount.bank?.name}</Typography>
          <Typography fontSize="0.85rem" color="#666">
            {bankAccount.id ? `${bankAccount.agency} / ${bankAccount.number}` : 'Títulos sem uma conta bancária vinculada'}
          </Typography>
        </div>
      </div>

      {bankAccount.id !== null && (
        <>
          <IconButton size="small" onClick={handleOpenMenu}>
            <i className="ri-more-2-line" style={{ fontSize: 20 }}></i>
          </IconButton>

          <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}>
            <MenuItem onClick={handleGenerateRemessaClick}>Gerar Remessa</MenuItem>
          </Menu>
        </>
      )}
    </div>
  )
}

// Componente KanbanList (com drag and drop nativo e integração com o modal)
const KanbanList = ({
  bankAccount,
  installments,
  bankAccounts,
  setBankAccounts,
  setInstallments,
  loadingInstallmentIds,
  addLoadingInstallment,
  removeLoadingInstallment
}) => {
  const [installmentsList, setInstallmentsList] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  const dragCounter = useRef(0); // Contador de drag para lidar com filhos

  useEffect(() => {
    const installmentIds = bankAccounts.find((col) => col.id === bankAccount.id)?.taskIds || [];
    setInstallmentsList(
      installments.filter((installment) => installment && installmentIds.includes(installment.id))
    );
  }, [bankAccounts, installments, bankAccount.id]);

  const removeInstallmentFromBankAccount = (bankAccounts, bankAccountId, installmentId) =>
    bankAccounts.map((ba) =>
      ba.id === bankAccountId
        ? { ...ba, taskIds: ba.taskIds.filter((id) => id !== installmentId) }
        : ba
    );

  const insertInstallmentInBankAccount = (bankAccounts, bankAccountId, installmentId, index) =>
    bankAccounts.map((ba) =>
      ba.id === bankAccountId
        ? { ...ba, taskIds: [...ba.taskIds.slice(0, index), installmentId, ...ba.taskIds.slice(index)] }
        : ba
    );

  const handleDragStart = (e, installment) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        installmentId: installment.id,
        originBankAccountId: bankAccount.id,
        fromIndex: installmentsList.findIndex((item) => item.id === installment.id)
      })
    );
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging");
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove("dragging");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const { installmentId, originBankAccountId, fromIndex } = data;

    const draggedInstallment = installments.find((inst) => inst.id === installmentId);
    if (!draggedInstallment) return;

    let destIndex = installmentsList.length;
    const children = Array.from(e.currentTarget.querySelectorAll(".task-wrapper"));
    for (let i = 0; i < children.length; i++) {
      const childRect = children[i].getBoundingClientRect();
      if (e.clientY < childRect.top + childRect.height / 2) {
        destIndex = i;
        break;
      }
    }

    const destBankAccountId = bankAccount.id;
    if (destBankAccountId === originBankAccountId && (fromIndex === destIndex || fromIndex + 1 === destIndex)) return;

    let updatedBankAccounts = removeInstallmentFromBankAccount(bankAccounts, originBankAccountId, draggedInstallment.id);
    updatedBankAccounts = insertInstallmentInBankAccount(updatedBankAccounts, destBankAccountId, draggedInstallment.id, destIndex);
    setBankAccounts(updatedBankAccounts);

    addLoadingInstallment(draggedInstallment.id);

    try {
      await updateInstallment({ id: draggedInstallment.id, bankAccountId: destBankAccountId });
    } catch (error) {
      setBankAccounts((prev) => {
        let reverted = removeInstallmentFromBankAccount(prev, destBankAccountId, draggedInstallment.id);
        reverted = insertInstallmentInBankAccount(reverted, originBankAccountId, draggedInstallment.id, fromIndex);
        return reverted;
      });
      alert(`Erro ao mover tarefa #${draggedInstallment.id}, operação revertida.`);
    } finally {
      removeLoadingInstallment(draggedInstallment.id);
    }
  };

  const addNewInstallment = (title) => {
    const maxId = installments.length > 0 ? Math.max(...installments.map((t) => t.id || 0)) : 0;
    const newInstallment = { id: maxId + 1, title };
    setInstallments((prev) => [...prev, newInstallment]);
    setBankAccounts((prev) =>
      prev.map((ba) =>
        ba.id === bankAccount.id ? { ...ba, taskIds: [...ba.taskIds, newInstallment.id] } : ba
      )
    );
  };

  const handleOpenEditModal = (installmentToEdit) => {
    setSelectedInstallment(installmentToEdit);
    setModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setModalOpen(false);
    setSelectedInstallment(null);
  };

  const handleSaveEditedAmount = async (installmentId, newAmount) => {
    addLoadingInstallment(installmentId);
    try {
      await updateInstallment({ id: installmentId, amount: newAmount });
      setInstallments((prevInstallments) =>
        prevInstallments.map((inst) =>
          inst.id === installmentId ? { ...inst, amount: newAmount } : inst
        )
      );
    } catch (error) {
      alert(`Erro ao atualizar o valor da parcela #${installmentId}: ${error.message}`);
    } finally {
      removeLoadingInstallment(installmentId);
    }
  };

  return (
    <div
      data-bank-account-id={bankAccount.id === null ? "null" : bankAccount.id}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      style={{
        width: "320px",
        padding: "0.5rem",
        backgroundColor: "#f4f5f7",
        borderRadius: 4,
        marginRight: 8,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: isDraggingOver ? "2px dashed #007bff" : "2px solid transparent",
        transition: "border 0.2s ease"
      }}
    >
      <ColumnHeader bankAccount={bankAccount} />
      <div style={{ flexGrow: 1, overflowY: "auto" }} className="scroll-smooth">
        {installmentsList.map((installment) => (
          <div
            key={installment.id}
            className="task-wrapper"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, installment)}
            onDragEnd={handleDragEnd}
            style={{ cursor: "grab", userSelect: "none", marginBottom: 8 }}
          >
            <InstallmentCard
              installment={installment}
              loading={loadingInstallmentIds.includes(installment.id)}
              onOpenEditModal={handleOpenEditModal}
            />
          </div>
        ))}
        {/* <NewInstallment addInstallment={addNewInstallment} /> */}
      </div>

      {selectedInstallment && (
        <EditInstallment
          open={modalOpen}
          onClose={handleCloseEditModal}
          installment={selectedInstallment}
          onSave={handleSaveEditedAmount}
        />
      )}
    </div>
  );
};

// Componente KanbanBoard (inalterado)
const KanbanBoard = ({ initialBankAccounts, initialInstallments }) => {

  const { setTitle } = useTitle()

  const [installments, setInstallments] = useState(initialInstallments)
  const [bankAccounts, setBankAccounts] = useState(initialBankAccounts)
  const [loadingInstallmentIds, setLoadingInstallmentIds] = useState([])

  useEffect(() => {
    setTitle(['Finanças', 'Prepare'])
  }, [])

  const addLoadingInstallment = (installmentId) =>
    setLoadingInstallmentIds((prev) => [...new Set([...prev, installmentId])])
  const removeLoadingInstallment = (installmentId) =>
    setLoadingInstallmentIds((prev) => prev.filter((id) => id !== installmentId))

  return (
    <div className="flex items-start" style={{ height: "100%" }}>
      <div className="flex" style={{ height: "100%" }}>
        {bankAccounts.map((ba) => (
          <KanbanList
            key={ba.id === null ? "null" : ba.id}
            bankAccount={ba}
            installments={installments}
            bankAccounts={bankAccounts}
            setBankAccounts={setBankAccounts}
            setInstallments={setInstallments}
            loadingInstallmentIds={loadingInstallmentIds}
            addLoadingInstallment={addLoadingInstallment}
            removeLoadingInstallment={removeLoadingInstallment}
          />
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard