import { useState,  useEffect } from 'react';
import {
  Form,
  Select,
  Button,
  Card,
  Typography,
  ConfigProvider,
  Input,
  Row,
  Col,
  App,
  Modal,
  Upload,
  Table,
  Drawer,
} from 'antd';
import {
  BarcodeOutlined,
  LinkOutlined,
  PlusOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import * as yup from 'yup';
import {
  artigoAPI,
  metalBaseAPI,
  metalSecundarioAPI,
  materialAPI,
  corAPI,
  itemAPI,
  itemAPIUpdate,
  sequenceAPI,
  uploadExcelAPI,
  itemFornecedorAPI,
  ItemFornecedor,
  fornecedorAPI,
  Fornecedor,
} from './services/api';
import { gerarSKU } from './utils/gerarSKU';

const { Title } = Typography;
const { Option } = Select;

type LabelsType = {
  artigo: Record<string, string>;
  metalBase: Record<string, string>;
  metalSecundario: Record<string, string>;
  materialComplementar: Record<string, string>;
  cor: Record<string, string>;
};

const initialLabels: LabelsType = {
  artigo: {
    AN: 'Anel',
    PU: 'Pulseira',
    CO: 'Colar',
    CR: 'Cordão',
    BR: 'Brinco',
    PI: 'Piercing',
    PN: 'Pingente'
  },
  metalBase: {
    A: 'Aço',
    P: 'Prata',
    L: 'Latão'
  },
  metalSecundario: {
    D: 'Dourado',
    R: 'Prateado',
    O: 'Banho de Ouro'
  },
  materialComplementar: {
    '1': 'Couro',
    '2': 'Esmalte',
    '3': 'Pedra'
  },
  cor: {
    '0': 'Amarelo',
    '1': 'Azul',
    '2': 'Vermelho',
    '3': 'Rosa',
    '4': 'Roxo',
    '5': 'Verde'
  }
};

// Schema de validação Yup para os campos de entrada
const validationSchema = yup.object().shape({
  select1: yup.string().required('Por favor, selecione o Artigo'),
  select2: yup.string().required('Por favor, selecione o Metal Base'),
  select3: yup.string().required('Por favor, selecione o Metal Secundário'),
  select4: yup.string().nullable(),
  select5: yup.string().nullable()
});

function AppContent() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  
  // Estados para controlar os valores do formulário
  const [select1, setSelect1] = useState<string | undefined>(undefined);
  const [select2, setSelect2] = useState<string | undefined>(undefined);
  const [select3, setSelect3] = useState<string | undefined>(undefined);
  const [select4, setSelect4] = useState<string | undefined>(undefined);
  const [select5, setSelect5] = useState<string | undefined>(undefined);
  const [descricaoCompleta, setDescricaoCompleta] = useState<string>('');
  const [descricaoEtiqueta, setDescricaoEtiqueta] = useState<string>('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [step, setStep] = useState<'lista' | 'form'>('lista');

  const [showInputs, setShowInputs] = useState(false);
  const [skuGerado, setSkuGerado] = useState<string | null>(null);
  const [salvandoItem, setSalvandoItem] = useState(false);
  const [labels, setLabels] = useState(initialLabels);
  const [modalOpen, setModalOpen] = useState<any>({});
  const [currentModalType, setCurrentModalType] = useState('');
  const [loading, setLoading] = useState(true);
  const [excelUploadModalOpen, setExcelUploadModalOpen] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelPreviewColumns, setExcelPreviewColumns] = useState<string[]>([]);
  const [excelPreviewData, setExcelPreviewData] = useState<any[]>([]);
  const [excelFileSelected, setExcelFileSelected] = useState<File | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [codigoFornecedor, setCodigoFornecedor] = useState<string>('');
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itensFornecedor, setItensFornecedor] = useState<ItemFornecedor[]>([]);
  const [loadingItensFornecedor, setLoadingItensFornecedor] = useState(false);
  const [selectedItemFornecedorId, setSelectedItemFornecedorId] = useState<number | null>(null);
  const [skuModalOpen, setSkuModalOpen] = useState(false);

  // Carregar dados do backend
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setLoadingItensFornecedor(true);
        const [
          artigos,
          metaisBase,
          metaisSecundarios,
          materiais,
          cores,
          itens,
        ] = await Promise.all([
          artigoAPI.getAll(),
          metalBaseAPI.getAll(),
          metalSecundarioAPI.getAll(),
          materialAPI.getAll(),
          corAPI.getAll(),
          itemFornecedorAPI.getAll(),
        ]);

        // Mapear dados do backend para o formato esperado
        const novoLabels = {
          artigo: Object.fromEntries(artigos.map(a => [a.codigo, a.nome])),
          metalBase: Object.fromEntries(metaisBase.map(m => [String(m.id), m.nome])),
          metalSecundario: Object.fromEntries(metaisSecundarios.map(m => [m.codigo, m.nome])),
          materialComplementar: Object.fromEntries(materiais.map(m => [m.codigo, m.nome])),
          cor: Object.fromEntries(cores.map(c => [String(c.id), c.nome]))
        };

        setLabels(novoLabels);
        setItensFornecedor(itens);

        // Carregar fornecedores em uma chamada separada, para não quebrar a tabela caso falhe
        try {
          const fornecedoresResponse = await fornecedorAPI.getAll();
          setFornecedores(fornecedoresResponse);
        } catch (err) {
          console.error('Erro ao carregar fornecedores:', err);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        message.error('Erro ao carregar dados do servidor. Usando dados padrão.');
      } finally {
        setLoading(false);
        setLoadingItensFornecedor(false);
      }
    };

    carregarDados();
  }, [message]);

  const totalItens = itensFornecedor.length;
  const comReferencia = itensFornecedor.filter(
    item => item.referencia_fornecedor && item.referencia_fornecedor.trim() !== ''
  ).length;

  const artigoOptions = Object.entries(labels.artigo).map(([value, label]) => ({ value, label }));
  const metalBaseOptions = Object.entries(labels.metalBase).map(([value, label]) => ({ value, label }));
  const metalSecundarioOptions = Object.entries(labels.metalSecundario).map(([value, label]) => ({ value, label }));
  const materialComplementarOptions = Object.entries(labels.materialComplementar).map(([value, label]) => ({ value, label }));
  const corOptions = Object.entries(labels.cor).map(([value, label]) => ({ value, label }));

  const gerarDescricaoCompleta = (
    artigo: string,
    metalBase: string,
    metalSecundario?: string,
    materialComplementar?: string,
    cor?: string
  ) => {
    const parts = [
      labels.artigo[artigo as keyof typeof labels.artigo] || artigo,
      `de ${labels.metalBase[metalBase as keyof typeof labels.metalBase] || metalBase}`
    ];

    if (metalSecundario) {
      parts.push(labels.metalSecundario[metalSecundario as keyof typeof labels.metalSecundario] || metalSecundario);
    }

    if (materialComplementar && materialComplementar !== '0') {
      parts.push(`com ${labels.materialComplementar[materialComplementar as keyof typeof labels.materialComplementar] || materialComplementar}`);
    }

    if (cor) {
      parts.push(labels.cor[cor as keyof typeof labels.cor] || cor);
    }

    return parts.join(' ');
  };

  const gerarDescricaoEtiqueta = (descricaoCompleta: string) => {
    // Reduz para 20 caracteres mantendo legibilidade
    if (descricaoCompleta.length <= 20) {
      return descricaoCompleta;
    }

    // Estratégia: usar abreviações inteligentes
    let resultado = descricaoCompleta;

    // Remove vogais de palavras maiores (exceto a primeira letra)
    const palavras = resultado.split(' ');
    const palavrasAbreviadas = palavras.map(palavra => {
      if (palavra.length > 5) {
        return palavra[0] + palavra.slice(1).replace(/[AEIOU]/g, '');
      }
      return palavra;
    });

    resultado = palavrasAbreviadas.join(' ');

    // Se ainda for muito longo, trunca e adiciona...
    if (resultado.length > 20) {
      resultado = resultado.substring(0, 17);
    }

    return resultado;
  };

 const handleGerarSKU = async () => {
  try {
    await validationSchema.validate(
      { select1, select2, select3, select4, select5 },
      { abortEarly: false }
    );

    // 🔥 BUSCA SEQUENCE DO BANCO
    const response = await sequenceAPI.getNextSku();
    const sequenceFormatada = response.sequenceFormatada;

    // 🔥 GERA SKU USANDO A SEQUENCE
    const sku = gerarSKU(
      select1!,
      select2!,
      select3!,
      select4,
      select5,
      sequenceFormatada
    );

    const novaDescricaoCompleta = gerarDescricaoCompleta(
      select1!,
      select2!,
      select3!,
      select4,
      select5
    );

    const novaDescricaoEtiqueta =
      gerarDescricaoEtiqueta(novaDescricaoCompleta);

    setSkuGerado(sku);
    setDescricaoCompleta(novaDescricaoCompleta);
    setDescricaoEtiqueta(novaDescricaoEtiqueta);
    setShowInputs(true);

    form.setFieldsValue({
      descricaoCompleta: novaDescricaoCompleta,
      descricaoEtiqueta: novaDescricaoEtiqueta
    });

    message.success('SKU e descrições gerados com sucesso!');
  } catch (error: unknown) {
    if (error instanceof yup.ValidationError) {
      const fieldErrors = error.inner.map(err => ({
        name: [err.path!],
        errors: [err.message]
      }));
      form.setFields(fieldErrors);
      message.error('Preencha todos os campos obrigatórios');
    } else {
      console.error(error);
      message.error('Erro ao gerar SKU');
    }
  }
};



  const handleAbrirModal = (tipo: string) => {
    setCurrentModalType(tipo);
    setModalOpen({ [tipo]: true });
    modalForm.resetFields();
  };

  const handleSalvarItem = async (tipo: string) => {
    try {
      const values = await modalForm.validateFields();
      
      // Criar item no backend
      switch (tipo) {
        case 'artigo': {
          const novoItem = await artigoAPI.create({ codigo: values.codigo, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            artigo: { ...prev.artigo, [novoItem.codigo]: novoItem.nome }
          }));
          break;
        }
        case 'metalBase': {
          const idNumero = parseInt(values.codigo, 10);
          if (isNaN(idNumero)) {
            throw new Error('O código deve ser um número válido');
          }
          const novoItem = await metalBaseAPI.create({ id: idNumero, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            metalBase: { ...prev.metalBase, [String(novoItem.id)]: novoItem.nome }
          }));
          break;
        }
        case 'metalSecundario': {
          const novoItem = await metalSecundarioAPI.create({ codigo: values.codigo, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            metalSecundario: { ...prev.metalSecundario, [novoItem.codigo]: novoItem.nome }
          }));
          break;
        }
        case 'materialComplementar': {
          const novoItem = await materialAPI.create({ codigo: values.codigo, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            materialComplementar: { ...prev.materialComplementar, [novoItem.codigo]: novoItem.nome }
          }));
          break;
        }
        case 'cor': {
          const idNumero = parseInt(values.codigo, 10);
          if (isNaN(idNumero)) {
            throw new Error('O código deve ser um número válido');
          }
          const novoItem = await corAPI.create({ id: idNumero, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            cor: { ...prev.cor, [String(novoItem.id)]: novoItem.nome }
          }));
          break;
        }
      }

      message.success('Item adicionado com sucesso!');
      setModalOpen({});
      modalForm.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar item';
      message.error(errorMessage);
    }
  };

 const handleCriarItemSAP = async () => {
  if (!skuGerado || !descricaoCompleta || !descricaoEtiqueta) {
    message.warning('Preencha os campos obrigatórios');
    return;
  }

  try {
    setSalvandoItem(true);

    let picture: string | undefined;

    if (imagem) {
      const extensao = imagem.name.split('.').pop();
      picture = `${skuGerado}.${extensao}`;

      const formData = new FormData();
      formData.append('file', imagem, picture);

      await fetch(`${import.meta.env.VITE_API_IMAGEM}/imagem`, {
        method: 'POST',
        body: formData
      });
    }

    await itemAPI.create({
      sku: skuGerado,
      descricaoCompleta,
      descricaoEtiqueta,
      picture,
      itemFornecedorId: selectedItemFornecedorId ?? undefined,
    });
    
    // Atualizar referencia_fornecedor no lume_item_fornecedor vinculado
    if (selectedItemFornecedorId) {
      try {
        await itemFornecedorAPI.update(selectedItemFornecedorId, {
          referencia_fornecedor: skuGerado,
          // Códigos/IDs usados para mapear artigo/metal/material/cor no backend
          artigo_codigo: select1,
          metal_base_id: select2,
          metal_secundario_codigo: select3,
          material_codigo: select4,
          cor_id_num: select5,
        });
      } catch (e) {
        console.error('Erro ao atualizar referencia_fornecedor:', e);
      }
    }

    message.success('Item criado no SAP e referência atualizada!');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    message.error(`Erro ao criar item: ${errorMessage}`);
    console.error(error);
  } finally {
    setSalvandoItem(false);
  }
};




  const handleAtualizar = async (campo: 'descricaoCompleta' | 'descricaoEtiqueta') => {
    try {
      if (!skuGerado) {
        message.warning('Gere o SKU primeiro antes de atualizar');
        return;
      }

      const valor = campo === 'descricaoCompleta' ? descricaoCompleta : descricaoEtiqueta;
      
      if (!valor || valor.trim() === '') {
        message.warning('Por favor, preencha o campo antes de atualizar');
        return;
      }

      // Atualizar item no backend
      await itemAPIUpdate.updateDescricao(
        skuGerado,
        {
          descricaoCompleta,
          descricaoEtiqueta,
        }
);

      message.success(`${campo === 'descricaoCompleta' ? 'Descrição completa' : 'Descrição etiqueta'} atualizada com sucesso!`);
    } catch (error) {
      message.error('Erro ao atualizar item');
      console.error('Erro ao atualizar:', error);
    }
  };

  const getModalTitle = (tipo: string) => {
    const titulos: { [key: string]: string } = {
      artigo: 'Inserir Novo Artigo',
      metalBase: 'Inserir Novo Metal Base',
      metalSecundario: 'Inserir Novo Metal Secundário',
      materialComplementar: 'Inserir Novo Material Complementar',
      cor: 'Inserir Nova Cor'
    };
    return titulos[tipo] || 'Inserir Novo Item';
  };

  const handleVoltar = () => {
    setShowInputs(false);
    setSkuGerado(null);
    setDescricaoCompleta('');
    setDescricaoEtiqueta('');
    setImagem(null);
    form.resetFields();
    setSkuModalOpen(false);
  };

  // Função para apenas ler e mostrar pré-visualização (sem salvar)
  const handlePreviewExcel = async (file: File) => {
    try {
      setPreviewLoading(true);
      
      // Validar extensão do arquivo
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        message.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        setExcelFileSelected(null);
        return false;
      }

      // Guarda o arquivo para usar depois no upload
      setExcelFileSelected(file);

      // Cria FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 Enviando arquivo para preview:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        formDataKeys: Array.from(formData.keys())
      });

      // Faz upload apenas para pré-visualização (backend retorna dados sem salvar)
      const result: any = await uploadExcelAPI.preview(formData);

      // Espera-se que o backend retorne { message, totalRows, data }
      const rows = Array.isArray(result?.data) ? result.data : [];

      if (!rows.length) {
        message.warning('Arquivo processado, mas nenhuma linha foi encontrada.');
        setExcelPreviewColumns([]);
        setExcelPreviewData([]);
        setExcelFileSelected(null);
        return false;
      }

      const firstRow = rows[0] || {};
      const columns = Object.keys(firstRow).filter(
        key => key !== '__rowIndex' && key !== 'pic.' && !key.toLowerCase().includes('pic')
      );

      const previewRows = rows.slice(0, 10).map((row: any, index: number) => {
        const filteredRow: any = { key: row.__rowIndex ?? index };
        columns.forEach(col => {
          filteredRow[col] = row[col];
        });
        return filteredRow;
      });

      setExcelPreviewColumns(columns);
      setExcelPreviewData(previewRows);

      message.success('Arquivo processado! Revise a pré-visualização e confirme para importar.');

      return false; // Impede o upload automático do Ant Design
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      message.error(`Erro ao processar Excel: ${errorMessage}`);
      console.error('Erro ao processar Excel:', error);
      setExcelFileSelected(null);
      return false;
    } finally {
      setPreviewLoading(false);
    }
  };

  // Função para confirmar e fazer o upload real (salvar no banco)
  const handleConfirmUpload = async () => {
    if (!excelFileSelected) {
      message.warning('Nenhum arquivo selecionado');
      return;
    }

    // Validar código do fornecedor
    if (!codigoFornecedor || codigoFornecedor.trim() === '') {
      message.error('Por favor, informe o código do fornecedor');
      return;
    }

    try {
      setUploadingExcel(true);

      // Usa o código do fornecedor informado pelo usuário
      // O backend vai buscar o fornecedor_id pelo código
      const usuarioId = '001'; // TODO: Obter do contexto/estado da aplicação

      const result: any = await uploadExcelAPI.upload(
        excelFileSelected,
        codigoFornecedor.trim(),
        usuarioId
      );

      const totalRows = typeof result?.totalRows === 'number'
        ? result.totalRows
        : (typeof result?.saved === 'number' ? result.saved : 0);
      const saved = typeof result?.saved === 'number' ? result.saved : totalRows;
      const duplicados = Math.max(totalRows - saved, 0);

      message.success(`Arquivo importado com sucesso! ${saved} itens salvos.`);

      if (duplicados > 0) {
        Modal.info({
          title: 'Itens duplicados encontrados',
          content: `Foram encontrados ${duplicados} itens duplicados para este fornecedor. Itens duplicados não foram cadastrados.`
        });
      }

      // Limpar estados
      setExcelFileSelected(null);
      setExcelPreviewColumns([]);
      setExcelPreviewData([]);
      setCodigoFornecedor('');
      setExcelUploadModalOpen(false);

      // Aqui você pode recarregar a tabela principal se necessário
      // await carregarDadosTabela();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      if (errorMessage === 'Esse arquivo já foi importado') {
        Modal.info({
          title: 'Arquivo já importado',
          content: 'Esse arquivo já foi importado anteriormente para este fornecedor.',
        });
      } else {
        message.error(`Erro ao importar: ${errorMessage}`);
      }

      console.error('Erro ao importar:', error);
    } finally {
      setUploadingExcel(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-4xl">
        <Card
          className="w-full shadow-xl"
          style={{
            borderRadius: '16px',
            border: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
          bodyStyle={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}
          >
            <div>
              <Title level={2} className="!mb-0 !text-gray-800">
                Itens cadastrados
              </Title>
              <div style={{ marginTop: 4, color: '#303030', fontSize: 18 }}>
                Referências preenchidas: {comReferencia}/{totalItens}
              </div>
            </div>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setExcelUploadModalOpen(true)}
              size="large"
              className="!rounded-lg"
            >
              Importar Excel
            </Button>
          </div>

          <Table
            bordered
            loading={loadingItensFornecedor}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            dataSource={itensFornecedor.map(item => ({
              key: String(item.id),
              id: item.id,
              imagem_path: item.imagem_path,
              codigo_fornecedor: item.codigo_fornecedor,
              caracteristicas: item.caracteristicas,
              referencia_fornecedor: item.referencia_fornecedor
            }))}
            columns={[
              {
                title: 'Imagem',
                dataIndex: 'imagem_path',
                key: 'imagem_path',
                width: '15%',
                render: (value: string | null) => {
                  if (!value) {
                    return '-';
                  }

                  // URL das imagens
                  // - Se VITE_API_IMAGEM estiver definida, ela já aponta para a pasta/servidor correto
                  //   (ex.: http://servidor/uploads/images)
                  // - Caso contrário, usamos VITE_API_URL (ou origem atual) + /uploads/images
                  let src: string;

                  if (import.meta.env.VITE_API_IMAGEM) {
                    let base = import.meta.env.VITE_API_IMAGEM.replace(/\/+$/, '');
                    src = `${base}/${value}`;
                  } else {
                    let base =
                      import.meta.env.VITE_API_URL || window.location.origin;
                    base = base.replace(/\/+$/, '');
                    if (base.toLowerCase().endsWith('/api')) {
                      base = base.slice(0, -4);
                    }
                    src = `${base}/uploads/images/${value}`;
                  }

                  return (
                    <img
                      src={src}
                      alt="Item"
                      style={{
                        maxWidth: 60,
                        maxHeight: 60,
                        objectFit: 'contain',
                        borderRadius: 4,
                      }}
                    />
                  );
                },
              },
              {
                title: 'Código Fornecedor',
                dataIndex: 'codigo_fornecedor',
                key: 'codigo_fornecedor',
                width: '30%'
              },
              {
                title: 'Características',
                dataIndex: 'caracteristicas',
                key: 'caracteristicas'
              },
              {
                title: 'Referência Fornecedor',
                dataIndex: 'referencia_fornecedor',
                key: 'referencia_fornecedor'
              }
            ]}
            onRow={record => ({
              onClick: () => {
                setSelectedItemFornecedorId(record.id as number);
                setSkuGerado(null);
                setDescricaoCompleta('');
                setDescricaoEtiqueta('');
                setImagem(null);
                form.resetFields();
                setShowInputs(false);
                setSkuModalOpen(true);
              }
            })}
            rowClassName={() =>
              'cursor-pointer hover:bg-blue-50 transition-colors'
            }
          />
        </Card>
      </div>

      {/* Modal para cadastro de códigos auxiliares (artigo, cor, etc.) */}
      <Modal
        centered
        open={modalOpen[currentModalType] || false}
        title={getModalTitle(currentModalType)}
        onOk={() => handleSalvarItem(currentModalType)}
        onCancel={() => setModalOpen({})}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{ className: '!rounded-lg' }}
        cancelButtonProps={{ className: '!rounded-lg' }}
      >
        <Form form={modalForm} layout="vertical" className="mt-4">
          <Form.Item
            label="Código"
            name="codigo"
            rules={[
              { required: true, message: 'Por favor, informe o código' },
              { max: 2, message: 'O código deve ter no máximo 2 caracteres' }
            ]}
          >
            <Input
              placeholder="Ex: AB"
              maxLength={2}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Por favor, informe o nome' }]}
          >
            <Input
              placeholder="Ex: Anel"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de importação de Excel */}
      <Modal
        centered
        open={excelUploadModalOpen}
        title="Importar Excel"
        onCancel={() => {
          setExcelUploadModalOpen(false);
          setExcelPreviewColumns([]);
          setExcelPreviewData([]);
          setExcelFileSelected(null);
          setCodigoFornecedor('');
        }}
        footer={null}
        okButtonProps={{ className: '!rounded-lg' }}
        cancelButtonProps={{ className: '!rounded-lg' }}
        width={900}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: '24px' }}>
            <Title level={5} className="!mb-2 !text-gray-800">
              Código do Fornecedor *
            </Title>
            <Select
              placeholder="Selecione o fornecedor"
              value={codigoFornecedor || undefined}
              onChange={(value: string) => setCodigoFornecedor(value)}
              size="large"
              className="!rounded-lg w-full"
              disabled={previewLoading || uploadingExcel}
              options={fornecedores.map((f) => ({
                value: f.codigo_sap,  // continua usando o código para enviar ao backend
                label: f.nome,        // exibe apenas o nome no select
              }))}
              showSearch={false}
              allowClear={false}
            />
            <div style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>
              * Campo obrigatório para importação
            </div>
          </div>

          {!excelPreviewColumns.length ? (
            <>
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={(file) => {
                  // Validar código do fornecedor antes de processar
                  if (!codigoFornecedor || codigoFornecedor.trim() === '') {
                    message.error('Por favor, informe o código do fornecedor antes de selecionar o arquivo');
                    return false;
                  }
                  handlePreviewExcel(file);
                  return false; // Impede upload automático
                }}
                showUploadList={false}
                maxCount={1}
                disabled={!codigoFornecedor || codigoFornecedor.trim() === ''}
              >
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  loading={previewLoading}
                  size="large"
                  block
                  className="!rounded-lg"
                  disabled={!codigoFornecedor || codigoFornecedor.trim() === '' || previewLoading}
                >
                  {previewLoading ? 'Processando...' : 'Selecionar arquivo Excel'}
                </Button>
              </Upload>
              <div style={{ marginTop: '16px', color: '#8c8c8c', fontSize: '12px' }}>
                Formatos aceitos: .xlsx, .xls | Cabeçalho na linha 19
              </div>
            </>
          ) : (
            <>
              {excelFileSelected && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                  <strong>Arquivo selecionado:</strong> {excelFileSelected.name}
                </div>
              )}
              <div style={{ marginBottom: '16px' }}>
                <Title level={5} className="!mb-2 !text-gray-800">
                  Pré-visualização (primeiras 10 linhas)
                </Title>
                <Table
                  size="small"
                  bordered
                  scroll={{ x: true }}
                  pagination={false}
                  dataSource={excelPreviewData}
                  columns={excelPreviewColumns.map(col => {
                    // Se for a coluna de imagem, renderiza a imagem
                    const isImageColumn = col.toLowerCase().includes('pic') || 
                                         col.toLowerCase().includes('image') || 
                                         col.toLowerCase().includes('picture');
                    
                    return {
                      title: col,
                      dataIndex: col,
                      key: col,
                      render: (text: any) => {
                        if (text === null || text === undefined || text === '') {
                          return '-';
                        }
                        
                        // Se for coluna de imagem e o valor for base64 ou URL de imagem
                        if (isImageColumn) {
                          const isBase64 = typeof text === 'string' && 
                                          (text.startsWith('data:image/') || 
                                           text.startsWith('data:image/png') ||
                                           text.startsWith('data:image/jpeg') ||
                                           text.startsWith('data:image/jpg'));
                          
                          if (isBase64 || (typeof text === 'string' && (text.startsWith('http://') || text.startsWith('https://')))) {
                            return (
                              <img 
                                src={text} 
                                alt="Preview" 
                                style={{ 
                                  maxWidth: '80px', 
                                  maxHeight: '80px', 
                                  objectFit: 'contain',
                                  borderRadius: '4px'
                                }} 
                                onError={(e) => {
                                  // Se a imagem falhar ao carregar, mostra o texto
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.textContent = String(text);
                                }}
                              />
                            );
                          }
                        }
                        
                        return String(text);
                      }
                    };
                  })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <Button
                  onClick={() => {
                    setExcelPreviewColumns([]);
                    setExcelPreviewData([]);
                    setExcelFileSelected(null);
                    setCodigoFornecedor('');
                  }}
                  size="large"
                  className="!rounded-lg"
                >
                  Selecionar outro arquivo
                </Button>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  loading={uploadingExcel}
                  onClick={handleConfirmUpload}
                  disabled={!codigoFornecedor || codigoFornecedor.trim() === ''}
                  size="large"
                  className="!rounded-lg"
                >
                  {uploadingExcel ? 'Importando...' : 'Confirmar e Importar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Painel lateral (Drawer) para geração de SKU e preenchimento de descrições do item selecionado */}
      <Drawer
        placement="right"
        width={520}
        open={skuModalOpen}
        onClose={handleVoltar}
        mask={false}
        title={
          selectedItemFornecedorId
            ? `Classificar item #${selectedItemFornecedorId}`
            : 'Gerador de SKU'
        }
      >
        {!showInputs ? (
          <>
            <Title
              level={4}
              className="!mb-4 !text-gray-800 text-center"
            >
              Gerador de SKU
            </Title>

            <Form form={form} layout="vertical" size="large">
              <Form.Item
                name="select1"
                label={<span className="text-base font-semibold">Artigo</span>}
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      placeholder="Selecione"
                      size="large"
                      loading={loading}
                      value={select1}
                      onChange={value => setSelect1(value)}
                    >
                      {artigoOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('artigo')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="select2"
                label={<span className="text-base font-semibold">Metal Base</span>}
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      placeholder="Selecione"
                      size="large"
                      loading={loading}
                      value={select2}
                      onChange={value => setSelect2(value)}
                    >
                      {metalBaseOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('metalBase')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="select3"
                label={
                  <span className="text-base font-semibold">
                    Metal Secundário
                  </span>
                }
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      placeholder="Selecione"
                      size="large"
                      loading={loading}
                      value={select3}
                      onChange={value => setSelect3(value)}
                    >
                      {metalSecundarioOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('metalSecundario')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="select4"
                label={
                  <span className="text-base font-semibold">
                    Material Complementar
                  </span>
                }
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      allowClear
                      size="large"
                      loading={loading}
                      value={select4}
                      onChange={value => setSelect4(value)}
                    >
                      {materialComplementarOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('materialComplementar')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="select5"
                label={<span className="text-base font-semibold">Cor</span>}
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      allowClear
                      size="large"
                      loading={loading}
                      value={select5}
                      onChange={value => setSelect5(value)}
                    >
                      {corOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('cor')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Button
                type="primary"
                block
                icon={<BarcodeOutlined />}
                onClick={handleGerarSKU}
                size="large"
                className="!rounded-lg !h-12 !text-base !font-medium shadow-md hover:shadow-lg transition-all"
              >
                Gerar SKU e descrições
              </Button>
            </Form>
          </>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}
            >
              <Button
                type="default"
                icon={<ArrowLeftOutlined />}
                onClick={handleVoltar}
                size="large"
                className="!rounded-lg"
              >
                Voltar
              </Button>
              <Title
                level={4}
                className="!mb-0 !text-gray-800 text-center"
                style={{ flex: 1 }}
              >
                SKU e Descrições
              </Title>
              <div style={{ width: '100px' }} />
            </div>

            {selectedItemFornecedorId !== null && (
              <div style={{ marginBottom: '16px', color: '#595959' }}>
                ID do item selecionado: <strong>{selectedItemFornecedorId}</strong>
              </div>
            )}

            {skuGerado && (
              <Button
                type="primary"
                htmlType="button"
                icon={<LinkOutlined />}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCriarItemSAP();
                }}
                block
                size="large"
                loading={salvandoItem}
                className="!rounded-lg !h-12 !text-base !font-medium shadow-md hover:shadow-lg transition-all !mb-6"
              >
                {skuGerado}
              </Button>
            )}

            <Form form={form} layout="vertical" size="large">
              <Form.Item
                name="descricaoCompleta"
                label={
                  <span className="text-base font-semibold">
                    Descrição Completa
                  </span>
                }
              >
                <Input.TextArea
                  rows={4}
                  size="large"
                  value={descricaoCompleta}
                  onChange={e => setDescricaoCompleta(e.target.value)}
                />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right', marginBottom: '24px' }}>
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  onClick={() => handleAtualizar('descricaoCompleta')}
                  size="large"
                  className="!rounded-lg"
                >
                  Atualizar
                </Button>
              </Form.Item>

              <Form.Item
                name="descricaoEtiqueta"
                label={
                  <span className="text-base font-semibold">
                    Descrição Etiqueta
                  </span>
                }
              >
                <Input
                  maxLength={20}
                  size="large"
                  value={descricaoEtiqueta}
                  onChange={e => setDescricaoEtiqueta(e.target.value)}
                />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right', marginBottom: '24px' }}>
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  onClick={() => handleAtualizar('descricaoEtiqueta')}
                  size="large"
                  className="!rounded-lg"
                >
                  Atualizar
                </Button>
              </Form.Item>

              <Form.Item 
                name="imagem" 
                label={<span className="text-base font-semibold">Imagem (Opcional)</span>}
              >
                {imagem ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <span style={{ flex: 1, color: '#595959' }}>
                      {imagem.name}
                    </span>

                    <Button
                      type="default"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setImagem(null);
                        form.setFieldsValue({ imagem: undefined });
                      }}
                      size="large"
                      className="!rounded-lg"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <Upload
                    accept="image/*"
                    beforeUpload={(file) => {
                      setImagem(file);
                      return false;
                    }}
                    showUploadList={false}
                    maxCount={1}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      size="large"
                      className="!rounded-lg"
                      block
                    >
                      Selecionar Imagem
                    </Button>
                  </Upload>
                )}
              </Form.Item>
            </Form>

            {!skuGerado && (
              <div className="text-center text-gray-400 py-8">
                <p>Gere o SKU para ver as informações aqui</p>
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}

export default function AppComponent() {
  return (
    <ConfigProvider>
      <App>
        <AppContent />
      </App>
    </ConfigProvider>
  );
}
