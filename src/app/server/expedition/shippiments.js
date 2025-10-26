"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function findAll({dueDate, limit = 50, offset}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    const shippiments = await db.Shippiment.findAndCountAll({
        attributes: ['codigo_carga', 'documentNumber', 'description', 'predominant'],
        include: [
            {model: db.Partner, as: 'sender', attributes: ['codigo_pessoa', 'surname']},
            {model: db.Cte, as: 'ctes', attributes: ['id', 'chCTe']},
        ],
        limit: limit,
        offset: offset * limit,
        order: [['codigo_carga', 'desc']],
        where
    })

    return {
        request: {
            limit, offset
        },
        response: {
            rows: _.map(shippiments.rows, (item) => item.toJSON()), count: shippiments.count
        }
    }

}

export async function create({senderId, description, predominant, nfes = []}) {

    await insertShippiment({senderId, nfes})

}

export async function nfes({senderId}) {

    const db = new AppContext()

    const where = []
    
    if (senderId) {
        where.push({'$IDRemetente$': senderId})
    }

    const nfes = await db.Nfe.findAll({
        attributes: ['codigo_nota', 'emission', 'nNF', 'serie', 'chNFe', 'weight', 'amount'],
        include: [
            { model: db.Partner, as: 'sender', attributes: ['codigo_pessoa', 'surname'] },
            { model: db.Partner, as: 'destination', attributes: ['codigo_pessoa', 'surname'] }
        ],
        where,
        order: [['data_emissao', 'desc']],
        limit: 50
    })

    return _.map(nfes, (item) => item.toJSON())

}

export async function addCte({shippimentId, chCTe}) {
    
    const db = new AppContext()

    const cte = await db.Cte.findOne({where: [{chaveCt: chCTe}]})

    if (!cte) {
        throw new Error('CT-e não encontrado!')
    }

    if (cte.shippimentId) {
        throw new Error('CT-e já está adicionado em outro romaneio!')
    }

    await db.Cte.update({shippimentId: shippimentId}, {where: [{chaveCt: chCTe}]})

    return cte.toJSON()

}

export async function removeCte({cteId}) {
    
    const db = new AppContext()

    await db.Cte.update({shippimentId: null}, {where: [{id: cteId}]})

}

async function insertShippiment(
  {
    senderId,
    IdCargaOrdem,
    nfes,
    idViagem,
    idTipoCteNaEmpresa,
    agruparNotas = false,
    DocumentoTransporte = null,
    CodigoEmpresaFilial = null,
    profile
  }
) {

  const db = new AppContext()

  await db.transaction(async (transaction) => {

    try {

      //if (CodigoEmpresaFilial == null) {
      //  CodigoEmpresaFilial = profile.empresa_filial.codigo_empresa_filial;
      //}

      // Buscar CargaOrdem (assumo table CargaOrdem ou similar)
      //const CargaOrdem = await sequelize.models.CargaOrdem.findByPk(IdCargaOrdem, {
      //  transaction: t,
      //  include: [{ model: sequelize.models.Nota, as: 'notas' }]
      //});

      const shippiment = {
        codigo_cliente: senderId,
        IDCargaTipo: 1,
        codigo_tipo_carga: 1,
        CodigoEmpresaFilial,
        data_saida: new Date(),
        dataEntrega: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        descricao: '',
        //documento_transporte: DocumentoTransporte ?? (CargaOrdem ? CargaOrdem.DocumentoTransporte : null),
        forPag: 1,
        Lota: true,
        TipoServico: 0,
        TomadorServico: 0,
        valor_frete: 0,
        IDTipoCalculoIcms: 1,
        IDCteModal: 1,
        DataInsert: new Date(),
        //UserIdInsert: Util.getUserId(),
        IsValida: false,
        codigo_viagem: idViagem
      };

      // Inserir carga
      //const carga = await db.Shippiment.create(shippiment, { transaction });

      // Buscar NFes
      const NFes = await db.Nfe.findAll({
        attributes: ['codigo_nota', 'weight', 'amount'],
        where: { codigo_nota: nfes },
        include: [
          { model: db.Partner, as: 'sender', include: 
            [
              //{ model: db.Address, as: 'address' }
            ]
          }
        ],
        transaction
      })

      console.log(shippiment)

      console.log(NFes)

      return

      // Buscar FreteCalculo query base
      /*
      let QueryFreteCalculo = await FreteCalculo.findAll({
        include: [
          { model: sequelize.models.FreteCalculoRemetente, as: 'FreteCalculoRemetente' },
          { model: sequelize.models.FreteCalculoPeso, as: 'FreteCalculoPeso' },
          { model: sequelize.models.FreteCalculoDestinatario, as: 'FreteCalculoDestinatario' },
          { model: sequelize.models.FreteCalculoMunicipio, as: 'FreteCalculoMunicipio' },
          { model: sequelize.models.FreteCalculoMesoRegiao, as: 'FreteCalculoMesoRegiao' }
        ],
        transaction: t
      });
      */

      // Filtrar por remetente e tipo (C# fazia QueryFreteCalculo.Where(...).OrderByDescending(...))
      /*
      if (CargaOrdem) {
        QueryFreteCalculo = QueryFreteCalculo
          .filter(fc => fc.FreteCalculoRemetente && fc.FreteCalculoRemetente.some(r => r.IDRemetente === CargaOrdem.IdCliente))
          .filter(fc => fc.IDFreteCalculoTipo === CargaOrdem.IDFreteCalculoTipo)
          .sort((a, b) => {
            const aMax = (a.FreteCalculoPeso || []).reduce((m, p) => Math.max(m, p.Valor || 0), 0);
            const bMax = (b.FreteCalculoPeso || []).reduce((m, p) => Math.max(m, p.Valor || 0), 0);
            return bMax - aMax;
          });
      }
      */

      // Somatórios
      const Peso = NFes.reduce((s, x) => s + (x.weight || 0), 0);
      const Valor = NFes.reduce((s, x) => s + (x.amount || 0), 0);

      const CNPJ = NFes.map(x => x.pessoa?.CpfCnpj).filter(Boolean);
      const IdMunicipio = NFes.map(x => x.pessoa?.Enderecos?.[0]?.municipio?.codigo_municipio).filter(Boolean);
      const IdMesoRegiao = NFes.map(x => x.pessoa?.Enderecos?.[0]?.municipio?.IDMesoRegiao).filter(Boolean);

      // Escolher FreteCalculo seguindo as regras do C#
      let FreteCalculoFound = null;
      for (const fc of QueryFreteCalculo) {
        if (fc.FreteCalculoDestinatario && fc.FreteCalculoDestinatario.some(d => CNPJ.includes(d.CNPJ))) {
          FreteCalculoFound = fc;
          break;
        }
      }
      if (!FreteCalculoFound) {
        for (const fc of QueryFreteCalculo) {
          if (fc.FreteCalculoMunicipio && fc.FreteCalculoMunicipio.some(m => IdMunicipio.includes(m.IDDestinatarioMunicipio || 0))) {
            FreteCalculoFound = fc;
            break;
          }
        }
      }
      if (!FreteCalculoFound) {
        for (const fc of QueryFreteCalculo) {
          if (fc.FreteCalculoMesoRegiao && fc.FreteCalculoMesoRegiao.some(m => IdMesoRegiao.includes(m.IDDestinatarioMesoRegiao || 0))) {
            FreteCalculoFound = fc;
            break;
          }
        }
      }

      // adicionar componentes de valor na carga (c.CompValorFretes)
      if (FreteCalculoFound) {
        // CUBAGEM
        let pesoCalc = Peso;
        if (FreteCalculoFound.IDPesoTipo === 2) {
          const Cubagem = NFes.reduce((s, x) => s + ((x.Cubagem || 0) * (FreteCalculoFound.PesoFatorConversao || 1)), 0);
          if (Cubagem > pesoCalc) pesoCalc = Cubagem;
        }

        // FRACIONADO (IDFreteCalculoTipo == 3)
        if (CargaOrdem?.IDFreteCalculoTipo === 3) {
          const Fator = (FreteCalculoFound.FreteCalculoPeso || []).find(fp => (fp.PesoInicial || 0) <= pesoCalc && (fp.PesoFinal || 0) >= pesoCalc);
          if (Fator) {
            if (Fator.CalculoTipo === 'fixo') {
              const valor = (Fator.FreteCalculo?.AliquotaICMS > 0)
                ? ((Fator.Valor || 0) / (Fator.FreteCalculo.AliquotaICMS || 1))
                : (Fator.Valor || 0);
              await CompValorFrete.create({ IDCarga: carga.id, IDTipoComponenteValorFrete: 1, Valor: valor }, { transaction: t });
            } else if (Fator.CalculoTipo === 'multiplicado') {
              const valor = (Fator.FreteCalculo?.AliquotaICMS > 0)
                ? (((Fator.Valor || 0) / (Fator.FreteCalculo.AliquotaICMS || 1)) * pesoCalc)
                : ((Fator.Valor || 0) * pesoCalc);
              await CompValorFrete.create({ IDCarga: carga.id, IDTipoComponenteValorFrete: 1, Valor: valor }, { transaction: t });
            }
          }
        }

        // FULL-SERVICE (IDFreteCalculoTipo == 1)
        if (CargaOrdem?.IDFreteCalculoTipo === 1) {
          const Fator = (FreteCalculoFound.FreteCalculoPeso || []).find(fp => (fp.PesoInicial || 0) <= Peso && (fp.PesoFinal || 0) >= Peso);
          const PesoTotal = (CargaOrdem?.notas || []).filter(n => !n.IsPalete).reduce((s, x) => s + (x.peso || 0), 0) || 0;
          const ValorPeso = Fator ? ((Fator.Valor || 0) / (PesoTotal || 1)) : 0;
          const PesoNF = NFes.filter(n => !n.IsPalete).reduce((s, x) => s + (x.peso || 0), 0);
          if (Fator && Fator.CalculoTipo === 'fixo') {
            const valor = (Fator.FreteCalculo?.AliquotaICMS > 0)
              ? ((ValorPeso * PesoNF) / (Fator.FreteCalculo.AliquotaICMS || 1))
              : (ValorPeso * PesoNF);
            await CompValorFrete.create({ IDCarga: carga.id, IDTipoComponenteValorFrete: 1, Valor: valor }, { transaction: t });
          }
        }

        // GRIS
        if ((FreteCalculoFound.GRIS || 0) !== 0) {
          let ValorGRIS = (Valor * (FreteCalculoFound.GRIS || 0)) / 100;
          if (FreteCalculoFound.AliquotaICMS > 0) ValorGRIS = ValorGRIS / (FreteCalculoFound.AliquotaICMS || 1);
          await CompValorFrete.create({ IDCarga: carga.id, IDTipoComponenteValorFrete: 12, Valor: ValorGRIS }, { transaction: t });
        }

        // ADVALOREM
        if ((FreteCalculoFound.ADValorem || 0) !== 0) {
          let ValorADValorem = (Valor * (FreteCalculoFound.ADValorem || 0)) / 100;
          if (FreteCalculoFound.AliquotaICMS > 0) ValorADValorem = ValorADValorem / (FreteCalculoFound.AliquotaICMS || 1);
          await CompValorFrete.create({ IDCarga: carga.id, IDTipoComponenteValorFrete: 2, Valor: ValorADValorem }, { transaction: t });
        }
      }

      // Seguro da carga (se houver)
      const Remetente = await sequelize.models.Pessoa.findOne({ where: { codigo_pessoa: (IDRemetente ?? CargaOrdem?.IdCliente) }, transaction: t });
      if (Remetente && Remetente.SeguroSeguradoraID != null) {
        await SeguroDaCarga.create({
          IDCarga: carga.id,
          respSeg: Remetente.SeguroSeguradoraID === 24 ? 4 : 0,
          IDSeguroSeguradora: Remetente.SeguroSeguradoraID,
          nApol: Remetente.SeguradoraNumeroApolice
        }, { transaction: t });
      }

      // ultimaCarga -> ajustar proPred e forPag se houver
      const ultimaCarga = await Carga.findOne({
        where: { codigo_cliente: carga.codigo_cliente },
        order: [['codigo_carga', 'DESC']],
        transaction: t
      });
      if (ultimaCarga) {
        // supondo proPred seja string
        carga.proPred = ultimaCarga.proPred?.toString();
        carga.forPag = ultimaCarga.forPag;
        await carga.save({ transaction: t });
      }

      // COMMIT preliminar de carga
      //await t.commit();

      // Montar notas (agrupar ou separar)
      let notas;
      if (agruparNotas) {
        const firstNota = NFes[0];
        notas = [{
          Long01: firstNota.codigo_cliente,
          Descricao01: CargaOrdem?.shippment || '',
          Long10: CargaOrdem?.DocumentoTransporte,
          Lista01: NFes.map(x => ({ Long01: x.codigo_nota, Inteiro20: x.quantidade }))
        }];
      } else {
        // agrupa por codigo_cliente, shippment, DocumentoTransporte
        const grouped = {};
        for (const n of NFes) {
          const key = `${n.codigo_cliente}||${n.CargaOrdem?.shippment || ''}||${n.CargaOrdem?.DocumentoTransporte || ''}`;
          grouped[key] = grouped[key] || { Long01: n.codigo_cliente, Descricao01: n.CargaOrdem?.shippment || '', Long10: n.CargaOrdem?.DocumentoTransporte, Lista01: [] };
          grouped[key].Lista01.push({ Long01: n.codigo_nota, Inteiro20: n.quantidade });
        }
        notas = Object.values(grouped);
      }

      // Agora inserir CTEs para cada 'p' em notas
      const cf = new CargaFunctions();
      const objNfe = new HelpNFe();

      let lastCtId = null;

      for (const p of notas) {
        // obter um Cte (cf.getCte) - assumo que retorna uma instância pronta para salvar
        const ctData = await cf.getCte(idViagem, carga.codigo_cliente, p.Long01, 0, p.Lista01.reduce((s, i) => s + (i.Inteiro20 || 0), 0), idTipoCteNaEmpresa);

        // preencher campos conforme C#
        ctData.IDCarga = carga.codigo_carga || carga.id; // ajuste pro campo do DB
        ctData.IdViagem = idViagem;
        ctData.IdTomador = await (new CargaFunctions()).GetTomador(carga, ctData.IDCliente);
        ctData.vTPrest = (carga.CompValorFretes ? (await carga.getCompValorFretes()) : []).reduce((s, x) => s + (x.Valor || 0), 0) || 0;
        ctData.valorAReceber = ctData.vTPrest;
        ctData.baseCalculo = ctData.vTPrest;

        if (ctData.IdTomador === 2059) {
          ctData.NumeroControleCliente = (p.Descricao01 || '').toString();
          if ((p.Descricao01 || '').trim()) ctData.infAdFisco = (ctData.infAdFisco || '') + ' PO:' + p.Descricao01.trim();
          if ((p.Long10 || '').toString().trim()) ctData.infAdFisco = (ctData.infAdFisco || '') + ' FOR:' + p.Long10;
        }

        // inserir Cte
        const createdCt = await Cte.create(ctData, { transaction: await sequelize.transaction() }); // crio em transação independente para evitar conflitos
        lastCtId = createdCt.ID;

        // relacionar notas
        for (const item of p.Lista01) {
          await CteNota.create({ CteId: createdCt.ID, IDNota: item.Long01 }, { transaction: await sequelize.transaction() });
          await objNfe.SetNFeStatus(item.Long01, 91, new Date(), `NFe adicionada na viagem ${idViagem}`);
        }

        // Atualizar campo IDEmpresaFilial via outro contexto (simulando db2)
        createdCt.IDEmpresaFilial = profile.empresa_filial.codigo_empresa_filial;
        await createdCt.save();
        Util.logar('Ctes', 'Inserir', 'Cargas', createdCt, carga.codigo_carga || carga.id);
      }

      return lastCtId;

    } catch (err) {
      // se iniciou transação e não comitou, fazer rollback
      //try { await sequelize.transaction(async tx => { await tx.rollback?.(); }); } catch (e) { /* ignore */ }
      throw err;
    }
  })

}